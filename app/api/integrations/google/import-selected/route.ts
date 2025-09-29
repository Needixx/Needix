// app/api/integrations/google/import-selected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ImportItem {
  id: string;
  type: "subscription" | "order" | "expense";
  name: string;
  amount: number;
  currency: string;
  category: string;
  interval?: string;
  date?: string;
  vendor?: string;
  merchant?: string;
  confidence: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { items } = body as { items: ImportItem[] };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items data" }, { status: 400 });
    }

    console.log(`Importing ${items.length} items for user: ${user.email}`);

    let imported = 0;
    const results = {
      subscriptions: 0,
      orders: 0,
      expenses: 0,
      errors: [] as string[]
    };

    // Process each item based on its type
    for (const item of items) {
      try {
        switch (item.type) {
          case "subscription":
            await createSubscription(user.id, item);
            results.subscriptions++;
            break;
            
          case "order":
            await createOrder(user.id, item);
            results.orders++;
            break;
            
          case "expense":
            await createExpense(user.id, item);
            results.expenses++;
            break;
            
          default:
            results.errors.push(`Unknown item type: ${item.type}`);
            continue;
        }
        
        imported++;
        console.log(`Imported ${item.type}: ${item.name} - $${item.amount}`);
        
      } catch (error) {
        console.error(`Error importing ${item.type} ${item.name}:`, error);
        results.errors.push(`Failed to import ${item.name}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    const response = {
      success: true,
      imported,
      results,
      message: `Successfully imported ${imported} items: ${results.subscriptions} subscriptions, ${results.orders} orders, ${results.expenses} expenses.`
    };

    console.log('Import completed:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error importing selected items:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function createSubscription(userId: string, item: ImportItem) {
  // Check if subscription already exists
  const existing = await prisma.subscription.findFirst({
    where: {
      userId,
      name: item.name,
    }
  });

  if (existing) {
    throw new Error("Subscription already exists");
  }

  // Map interval to Prisma enum
  let interval = "monthly";
  if (item.interval === "yearly") interval = "yearly";
  else if (item.interval === "weekly") interval = "weekly";
  else if (item.interval === "daily") interval = "daily";

  await prisma.subscription.create({
    data: {
      userId,
      name: item.name,
      amount: item.amount,
      currency: item.currency,
      interval: interval as any,
      category: item.category,
      isEssential: false,
      nextBillingAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }
  });
}

async function createOrder(userId: string, item: ImportItem) {
  // Check if order already exists (by name and amount to avoid duplicates)
  const existing = await prisma.order.findFirst({
    where: {
      userId,
      merchant: item.vendor || item.name,
      total: item.amount,
    }
  });

  if (existing) {
    throw new Error("Order already exists");
  }

  await prisma.order.create({
    data: {
      userId,
      merchant: item.vendor || item.name,
      total: item.amount,
      currency: item.currency,
      orderDate: item.date ? new Date(item.date) : new Date(),
      category: item.category,
      isEssential: false,
      status: "active",
    }
  });
}

async function createExpense(userId: string, item: ImportItem) {
  // Check if expense already exists (by description and amount to avoid duplicates)
  const existing = await prisma.expense.findFirst({
    where: {
      userId,
      description: item.name,
      amount: item.amount,
      date: item.date ? new Date(item.date) : new Date(),
    }
  });

  if (existing) {
    throw new Error("Expense already exists");
  }

  await prisma.expense.create({
    data: {
      userId,
      description: item.name,
      amount: item.amount,
      currency: item.currency,
      date: item.date ? new Date(item.date) : new Date(),
      merchant: item.merchant || item.vendor,
      category: item.category,
      isEssential: false,
      recurrence: "none",
    }
  });
}