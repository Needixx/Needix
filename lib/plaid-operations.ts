// lib/plaid-operations.ts
import { plaidClient, isPlaidConfigured } from './plaid';
import { prisma } from './prisma';

// Check if Plaid is available before any operation
const ensurePlaidConfigured = (): void => {
  if (!isPlaidConfigured()) {
    throw new Error('Plaid is not configured. Please set PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV.');
  }
};

/**
 * Sync transactions for a specific bank account
 */
export async function syncTransactionsForAccount(bankAccountId: string) {
  ensurePlaidConfigured();
  
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw new Error('Bank account not found');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const response = await plaidClient.transactionsGet({
    access_token: bankAccount.plaidAccessToken,
    start_date: startDate.toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  return response.data.transactions;
}

/**
 * Get account balances
 */
export async function getAccountBalances(bankAccountId: string) {
  ensurePlaidConfigured();
  
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw new Error('Bank account not found');
  }

  const response = await plaidClient.accountsBalanceGet({
    access_token: bankAccount.plaidAccessToken,
  });

  return response.data.accounts;
}

/**
 * Remove a bank account connection
 */
export async function removeBankAccount(bankAccountId: string) {
  ensurePlaidConfigured();
  
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw new Error('Bank account not found');
  }

  await plaidClient.itemRemove({
    access_token: bankAccount.plaidAccessToken,
  });

  await prisma.bankAccount.update({
    where: { id: bankAccountId },
    data: { isActive: false },
  });
}

/**
 * Check if access token needs to be refreshed
 */
export async function checkItemStatus(bankAccountId: string) {
  ensurePlaidConfigured();
  
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw new Error('Bank account not found');
  }

  try {
    const response = await plaidClient.itemGet({
      access_token: bankAccount.plaidAccessToken,
    });

    return {
      status: 'healthy',
      institutionId: response.data.item.institution_id,
    };
  } catch (error: any) {
    if (error.error_code === 'ITEM_LOGIN_REQUIRED') {
      return {
        status: 'requires_update',
        message: 'User needs to reconnect their bank',
      };
    }
    throw error;
  }
}

/**
 * Get spending by category
 */
export async function getSpendingByCategory(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate },
      amount: { gt: 0 },
    },
  });

  const categoryTotals = new Map<string, number>();
  
  transactions.forEach((txn) => {
    const category = txn.category?.[0] || 'Uncategorized';
    const current = categoryTotals.get(category) || 0;
    categoryTotals.set(category, current + parseFloat(txn.amount.toString()));
  });

  return Array.from(categoryTotals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Detect potential subscription from transaction history
 */
export async function analyzeSubscriptionPotential(
  merchantName: string,
  userId: string
): Promise<{ isSubscription: boolean; confidence: number; details: any }> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      merchantName: {
        contains: merchantName,
        mode: 'insensitive',
      },
      date: {
        gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { date: 'asc' },
  });

  if (transactions.length < 2) {
    return { isSubscription: false, confidence: 0, details: null };
  }

  const daysBetween: number[] = [];
  for (let i = 1; i < transactions.length; i++) {
    const diff = Math.abs(
      (transactions[i].date.getTime() - transactions[i - 1].date.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    daysBetween.push(diff);
  }

  const avgDays = daysBetween.reduce((a, b) => a + b, 0) / daysBetween.length;
  const variance = daysBetween.reduce((sum, days) => 
    sum + Math.pow(days - avgDays, 2), 0
  ) / daysBetween.length;
  const stdDev = Math.sqrt(variance);

  const isMonthly = avgDays >= 28 && avgDays <= 31 && stdDev < 3;
  const isWeekly = avgDays >= 6 && avgDays <= 8 && stdDev < 2;
  const isAnnual = avgDays >= 360 && avgDays <= 370 && stdDev < 7;

  const isSubscription = isMonthly || isWeekly || isAnnual;
  const confidence = isSubscription
    ? Math.min(100, Math.max(0, 100 - stdDev * 10))
    : 0;

  return {
    isSubscription,
    confidence: Math.round(confidence),
    details: {
      occurrences: transactions.length,
      averageDaysBetween: Math.round(avgDays),
      standardDeviation: Math.round(stdDev * 10) / 10,
      amounts: transactions.map(t => parseFloat(t.amount.toString())),
      detectedInterval: isMonthly ? 'monthly' : isWeekly ? 'weekly' : isAnnual ? 'annual' : 'unknown',
    },
  };
}

/**
 * Get user's total spending for a period
 */
export async function getTotalSpending(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      date: { gte: startDate },
      amount: { gt: 0 },
    },
    _sum: {
      amount: true,
    },
  });

  return parseFloat(result._sum.amount?.toString() || '0');
}

/**
 * Get merchants with most transactions
 */
export async function getTopMerchants(userId: string, limit: number = 10) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    select: {
      merchantName: true,
      amount: true,
    },
  });

  const merchantTotals = new Map<string, { count: number; total: number }>();
  
  transactions.forEach((txn) => {
    const merchant = txn.merchantName || 'Unknown';
    const current = merchantTotals.get(merchant) || { count: 0, total: 0 };
    merchantTotals.set(merchant, {
      count: current.count + 1,
      total: current.total + parseFloat(txn.amount.toString()),
    });
  });

  return Array.from(merchantTotals.entries())
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}