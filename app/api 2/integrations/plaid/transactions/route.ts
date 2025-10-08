// app/api/integrations/plaid/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    // Get all plaid items for this user
    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 100, // Limit to last 100 transactions
            },
          },
        },
      },
    });

    // Flatten all transactions with account info
    const transactions = plaidItems.flatMap(item =>
      item.accounts.flatMap(account =>
        account.transactions.map(txn => ({
          id: txn.id,
          date: txn.date.toISOString(),
          name: txn.name,
          merchantName: txn.merchantName,
          amount: Number(txn.amount),
          category: txn.category || [],
          subcategory: txn.subcategory,
          isSubscription: txn.isSubscription,
          accountName: account.name,
        }))
      )
    );

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });

  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    
    return NextResponse.json({
      error: "Failed to fetch transactions",
      details: error.message || "Unknown error"
    }, { status: 500 });
  }
}