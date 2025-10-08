// app/api/plaid/exchange-public-token/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import type { CountryCode } from 'plaid';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { public_token } = body;

    if (!public_token) {
      return NextResponse.json(
        { error: 'Missing public_token' },
        { status: 400 }
      );
    }

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    });

    let institutionName = 'Unknown';
    let institutionId = itemResponse.data.item.institution_id || '';

    if (institutionId) {
      try {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US'] as CountryCode[],
        });
        institutionName = institutionResponse.data.institution.name;
      } catch (error) {
        console.error('Error fetching institution name:', error);
      }
    }

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;
    
    for (const account of accounts) {
      await prisma.bankAccount.create({
        data: {
          userId: session.user.id,
          plaidAccessToken: accessToken,
          plaidItemId: itemId,
          plaidInstitutionId: institutionId,
          institutionName,
          accountName: account.name,
          accountType: account.type,
          accountSubtype: account.subtype || '',
          mask: account.mask || '',
          availableBalance: account.balances.available 
            ? parseFloat(account.balances.available.toString()) 
            : null,
          currentBalance: account.balances.current 
            ? parseFloat(account.balances.current.toString()) 
            : null,
          currency: account.balances.iso_currency_code || 'USD',
          lastSyncedAt: new Date(),
        },
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    });

    const bankAccount = await prisma.bankAccount.findFirst({
      where: { plaidItemId: itemId, userId: session.user.id },
    });

    if (bankAccount) {
      for (const transaction of transactionsResponse.data.transactions) {
        await prisma.transaction.create({
          data: {
            userId: session.user.id,
            bankAccountId: bankAccount.id,
            plaidTransactionId: transaction.transaction_id,
            amount: Math.abs(parseFloat(transaction.amount.toString())),
            currency: transaction.iso_currency_code || 'USD',
            date: new Date(transaction.date),
            authorizedDate: transaction.authorized_date 
              ? new Date(transaction.authorized_date) 
              : null,
            merchantName: transaction.merchant_name || transaction.name,
            category: transaction.category || [],
            categoryId: transaction.category_id || '',
            pending: transaction.pending,
            paymentChannel: transaction.payment_channel,
            mcc: transaction.merchant_entity_id || '',
          },
        });
      }
    }

    return NextResponse.json({ 
      success: true,
      accounts: accounts.length,
      transactions: transactionsResponse.data.transactions.length,
    });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to connect bank account',
        details: error?.response?.data || error.message 
      },
      { status: 500 }
    );
  }
}