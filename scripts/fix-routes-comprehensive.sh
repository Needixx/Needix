#!/bin/bash
# scripts/fix-routes-comprehensive.sh
# Nuclear option: Completely recreate the problematic routes

set -e

echo "🔧 Comprehensive route fix starting..."
echo ""

# 1. Stop any running dev server
echo "⚠️  Please stop your dev server (Ctrl+C) before continuing."
echo "Press Enter when ready..."
read

# 2. Clean everything
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf .next.bak 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# 3. Remove and recreate the route directories
echo "📁 Recreating route directories..."
rm -rf app/api/integrations/plaid/transactions
rm -rf app/api/integrations/plaid/detect-subscriptions
rm -rf app/api/integrations/plaid/status
rm -rf app/api/integrations/google/status
rm -rf app/api/test

mkdir -p app/api/integrations/plaid/transactions
mkdir -p app/api/integrations/plaid/detect-subscriptions
mkdir -p app/api/integrations/plaid/status
mkdir -p app/api/integrations/google/status
mkdir -p app/api/test

# 4. Create route files with correct content
echo "📝 Creating route files..."

# Test route
cat > app/api/test/route.ts << 'EOF'
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "API routes are working!",
    timestamp: new Date().toISOString()
  });
}
EOF

# Google status route
cat > app/api/integrations/google/status/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: true,
        connected: false,
        provider: null 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ 
        success: true,
        connected: false,
        provider: null 
      });
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: "google",
      },
    });

    return NextResponse.json({
      success: true,
      connected: !!account,
      provider: account ? "google" : null,
    });

  } catch (error: unknown) {
    console.error("Error checking Google integration status:", error);
    
    return NextResponse.json({
      success: true,
      connected: false,
      provider: null,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}
EOF

# Plaid status route
cat > app/api/integrations/plaid/status/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: true,
        connected: false,
        accounts: [] 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ 
        success: true,
        connected: false,
        accounts: [] 
      });
    }

    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: true,
      },
    });

    const connected = plaidItems.length > 0;
    const accounts = plaidItems.map(item => ({
      id: item.id,
      institutionName: item.institutionName,
      accountCount: item.accounts.length,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      connected,
      accounts,
      count: plaidItems.length,
    });

  } catch (error: unknown) {
    console.error("Error checking Plaid status:", error);
    
    return NextResponse.json({
      success: true,
      connected: false,
      accounts: [],
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}
EOF

# Plaid transactions route
cat > app/api/integrations/plaid/transactions/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: true,
        transactions: [],
        count: 0 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ 
        success: true,
        transactions: [],
        count: 0 
      });
    }

    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 100,
            },
          },
        },
      },
    });

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

  } catch (error: unknown) {
    console.error("Error fetching transactions:", error);
    
    return NextResponse.json({
      success: true,
      transactions: [],
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}
EOF

# Plaid detect-subscriptions route
cat > app/api/integrations/plaid/detect-subscriptions/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

interface DetectedSubscription {
  merchantName: string;
  amount: number;
  frequency: string;
  transactionCount: number;
  lastTransactionDate: string;
  category: string[];
  confidence: number;
  sampleTransactionId: string;
}

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: true,
        subscriptions: [],
        count: 0 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ 
        success: true,
        subscriptions: [],
        count: 0 
      });
    }

    const plaidItems = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      include: {
        accounts: {
          include: {
            transactions: {
              orderBy: { date: 'desc' },
              take: 200,
            },
          },
        },
      },
    });

    const allTransactions = plaidItems.flatMap(item =>
      item.accounts.flatMap(account =>
        account.transactions.map(txn => ({
          id: txn.id,
          date: txn.date,
          name: txn.name,
          merchantName: txn.merchantName || txn.name,
          amount: Number(txn.amount),
          category: txn.category || [],
          isSubscription: txn.isSubscription,
        }))
      )
    );

    const merchantGroups = new Map<string, typeof allTransactions>();
    
    allTransactions.forEach(txn => {
      const key = txn.merchantName.toLowerCase().trim();
      if (!merchantGroups.has(key)) {
        merchantGroups.set(key, []);
      }
      merchantGroups.get(key)!.push(txn);
    });

    const detectedSubs: DetectedSubscription[] = [];

    merchantGroups.forEach((transactions, merchantKey) => {
      if (transactions.length < 2) return;

      const sorted = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const daysBetween: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const days = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
        daysBetween.push(days);
      }
      
      const avgDays = daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length;
      
      let frequency = "unknown";
      let confidence = 0;
      
      if (avgDays >= 5 && avgDays <= 9) {
        frequency = "weekly";
        confidence = 0.8;
      } else if (avgDays >= 25 && avgDays <= 35) {
        frequency = "monthly";
        confidence = 0.9;
      } else if (avgDays >= 85 && avgDays <= 95) {
        frequency = "quarterly";
        confidence = 0.7;
      } else if (avgDays >= 355 && avgDays <= 375) {
        frequency = "yearly";
        confidence = 0.7;
      }

      const amounts = sorted.map(t => t.amount);
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const amountVariance = amounts.every(amt => 
        Math.abs(amt - avgAmount) / avgAmount < 0.1
      );

      if (amountVariance) {
        confidence += 0.1;
      }

      const hasSubscriptionCategory = sorted[0].category.some(cat =>
        cat.toLowerCase().includes('subscription') ||
        cat.toLowerCase().includes('recurring') ||
        cat.toLowerCase().includes('membership')
      );

      if (hasSubscriptionCategory) {
        confidence += 0.1;
      }

      if (confidence >= 0.6 && frequency !== "unknown") {
        detectedSubs.push({
          merchantName: sorted[0].merchantName,
          amount: avgAmount,
          frequency,
          transactionCount: sorted.length,
          lastTransactionDate: sorted[sorted.length - 1].date.toISOString(),
          category: sorted[0].category,
          confidence: Math.min(confidence, 1),
          sampleTransactionId: sorted[0].id,
        });
      }
    });

    detectedSubs.sort((a, b) => {
      const confidenceDiff = b.confidence - a.confidence;
      if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
      return new Date(b.lastTransactionDate).getTime() - new Date(a.lastTransactionDate).getTime();
    });

    return NextResponse.json({
      success: true,
      subscriptions: detectedSubs,
      count: detectedSubs.length,
    });

  } catch (error: unknown) {
    console.error("Error detecting subscriptions:", error);
    
    return NextResponse.json({
      success: true,
      subscriptions: [],
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 200 });
  }
}
EOF

echo ""
echo "✅ All route files created!"
echo ""
echo "📋 Created routes:"
ls -la app/api/test/
ls -la app/api/integrations/google/status/
ls -la app/api/integrations/plaid/status/
ls -la app/api/integrations/plaid/transactions/
ls -la app/api/integrations/plaid/detect-subscriptions/
echo ""
echo "🚀 Next steps:"
echo "1. Start dev server: pnpm dev"
echo "2. Wait for compilation to complete"
echo "3. Test routes:"
echo "   - http://localhost:3000/api/test"
echo "   - http://localhost:3000/api/integrations/plaid/transactions"
echo "   - http://localhost:3000/api/integrations/plaid/detect-subscriptions"
echo "4. Visit /dashboard/transactions"
echo ""
