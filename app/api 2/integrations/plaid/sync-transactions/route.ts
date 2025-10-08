// app/api/integrations/plaid/sync-transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize Plaid client
    const configuration = new Configuration({
      basePath: process.env.PLAID_ENV === 'production' 
        ? PlaidEnvironments.production 
        : PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
          'PLAID-SECRET': process.env.PLAID_SECRET!,
        },
      },
    });
    
    const plaidClient = new PlaidApi(configuration);

    // Get all plaid items for this user
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: true,
      },
    });

    if (plaidItems.length === 0) {
      return NextResponse.json({ error: "No bank accounts connected" }, { status: 400 });
    }

    let totalTransactionsAdded = 0;

    // Sync transactions for each item
    for (const item of plaidItems) {
      try {
        // Get transactions for the last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const response = await plaidClient.transactionsGet({
          access_token: item.accessToken,
          start_date: thirtyDaysAgo.toISOString().split('T')[0],
          end_date: now.toISOString().split('T')[0],
        });

        const transactions = response.data.transactions;

        // Save transactions to database
        for (const transaction of transactions) {
          // Find the corresponding PlaidAccount
          const plaidAccount = item.accounts.find(
            acc => acc.accountId === transaction.account_id
          );

          if (!plaidAccount) continue;

          // Check if transaction already exists
          const existingTransaction = await prisma.plaidTransaction.findUnique({
            where: { transactionId: transaction.transaction_id },
          });

          if (!existingTransaction) {
            // Detect if this might be a subscription
            const isRecurring = transaction.category?.some(cat => 
              cat.toLowerCase().includes('subscription') ||
              cat.toLowerCase().includes('recurring')
            ) || false;

            await prisma.plaidTransaction.create({
              data: {
                plaidItemId: item.id,
                plaidAccountId: plaidAccount.id,
                transactionId: transaction.transaction_id,
                amount: transaction.amount,
                date: new Date(transaction.date),
                name: transaction.name,
                merchantName: transaction.merchant_name || null,
                category: transaction.category || [],
                subcategory: transaction.category?.[0] || null,
                isSubscription: isRecurring,
              },
            });

            totalTransactionsAdded++;
          }
        }
      } catch (error) {
        console.error(`Error syncing transactions for item ${item.id}:`, error);
        // Continue with other items even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalTransactionsAdded} new transactions`,
      transactionsAdded: totalTransactionsAdded,
    });

  } catch (error: any) {
    console.error("Error syncing transactions:", error);
    
    return NextResponse.json({
      error: "Failed to sync transactions",
      details: error.response?.data?.error_message || error.message || "Unknown error"
    }, { status: 500 });
  }
}