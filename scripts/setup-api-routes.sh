#!/bin/bash
# scripts/setup-api-routes.sh
# Verify and create missing API route directories

set -e

echo "🔍 Checking API route structure..."

# Function to create directory and route file
create_route() {
  local path=$1
  local content=$2
  
  # Create directory
  mkdir -p "$(dirname "$path")"
  
  # Create file
  echo "$content" > "$path"
  
  echo "✅ Created: $path"
}

# Create test route
create_route "app/api/test/route.ts" '// app/api/test/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: "API routes are working!",
    timestamp: new Date().toISOString()
  });
}'

# Create Google status route
create_route "app/api/integrations/google/status/route.ts" '// app/api/integrations/google/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
}'

# Create Plaid status route
create_route "app/api/integrations/plaid/status/route.ts" '// app/api/integrations/plaid/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
}'

# Create Plaid transactions route
create_route "app/api/integrations/plaid/transactions/route.ts" '// app/api/integrations/plaid/transactions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
              orderBy: { date: "desc" },
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
}'

# Create Plaid detect-subscriptions route
create_route "app/api/integrations/plaid/detect-subscriptions/route.ts" '// app/api/integrations/plaid/detect-subscriptions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    return NextResponse.json({
      success: true,
      subscriptions: [],
      count: 0,
      message: "Subscription detection not yet implemented"
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
}'

echo ""
echo "✅ API routes setup complete!"
echo ""
echo "Next steps:"
echo "1. Stop your dev server (Ctrl+C)"
echo "2. Delete .next folder: rm -rf .next"
echo "3. Restart dev server: pnpm dev"
echo "4. Test routes by visiting:"
echo "   - http://localhost:3000/api/test"
echo "   - http://localhost:3000/api/integrations/google/status"
echo "   - http://localhost:3000/api/integrations/plaid/status"