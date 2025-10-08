// app/api/transactions/recurring/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find transactions marked as recurring that aren't already linked to a subscription
    const recurringTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        isRecurring: true,
        detectedSubscriptionId: null,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Group by merchant and calculate frequency
    const merchantGroups = new Map<string, any[]>();
    
    recurringTransactions.forEach((transaction) => {
      const merchant = transaction.merchantName || 'Unknown';
      if (!merchantGroups.has(merchant)) {
        merchantGroups.set(merchant, []);
      }
      merchantGroups.get(merchant)?.push(transaction);
    });

    // Format response
    const groupedTransactions = Array.from(merchantGroups.entries()).map(([merchant, txns]) => {
      const mostRecent = txns[0];
      return {
        id: mostRecent.id,
        merchantName: merchant,
        amount: parseFloat(mostRecent.amount.toString()),
        currency: mostRecent.currency,
        lastDate: mostRecent.date,
        frequency: txns.length,
      };
    });

    // Only show transactions that appear 2+ times
    const filtered = groupedTransactions.filter(t => t.frequency >= 2);

    return NextResponse.json({ transactions: filtered });
  } catch (error: any) {
    console.error('Error fetching recurring transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring transactions', details: error.message },
      { status: 500 }
    );
  }
}