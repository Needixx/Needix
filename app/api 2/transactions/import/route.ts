// app/api/transactions/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ImportRequest {
  transaction: {
    id: string;
    date: string;
    name: string;
    merchantName: string | null;
    amount: number;
    category: string[];
    subcategory: string | null;
    isSubscription: boolean;
    accountName: string;
  };
  importType: "subscription" | "order" | "expense";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ImportRequest = await req.json();
    const { transaction, importType } = body;

    console.log('Import request:', { transactionId: transaction.id, importType });

    if (!transaction || !importType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Get the PlaidTransaction to verify it exists
    const plaidTransaction = await prisma.plaidTransaction.findUnique({
      where: { id: transaction.id },
    });

    if (!plaidTransaction) {
      console.error('PlaidTransaction not found:', transaction.id);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    console.log('Found PlaidTransaction:', plaidTransaction);

    // Check if this transaction has already been imported
    const existingImport = await checkExistingImport(
      userId,
      transaction.merchantName || transaction.name,
      transaction.amount,
      importType
    );

    if (existingImport) {
      return NextResponse.json(
        { error: `This transaction has already been imported as a ${importType}` },
        { status: 400 }
      );
    }

    let result;

    switch (importType) {
      case "subscription":
        result = await createSubscription(userId, transaction);
        break;
      case "order":
        result = await createOrder(userId, transaction);
        break;
      case "expense":
        result = await createExpense(userId, transaction);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid import type" },
          { status: 400 }
        );
    }

    console.log('Successfully created:', importType, result.id);

    return NextResponse.json({
      success: true,
      importType,
      id: result.id,
    });
  } catch (error) {
    console.error("Error importing transaction:", error);
    return NextResponse.json(
      { 
        error: "Failed to import transaction",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

async function checkExistingImport(
  userId: string,
  merchantName: string,
  amount: number,
  importType: string
): Promise<boolean> {
  // Check for existing subscription with same merchant and amount
  if (importType === "subscription") {
    const existing = await prisma.subscription.findFirst({
      where: {
        userId,
        name: merchantName,
        amount: amount,
      },
    });
    return !!existing;
  }

  // Check for existing order with same merchant and amount within last 7 days
  if (importType === "order") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const existing = await prisma.order.findFirst({
      where: {
        userId,
        merchant: merchantName,
        total: amount,
        orderDate: {
          gte: sevenDaysAgo,
        },
      },
    });
    return !!existing;
  }

  // Check for existing expense with same merchant and amount within last 7 days
  if (importType === "expense") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const existing = await prisma.expense.findFirst({
      where: {
        userId,
        merchant: merchantName,
        amount: amount,
        date: {
          gte: sevenDaysAgo,
        },
      },
    });
    return !!existing;
  }

  return false;
}

async function createSubscription(userId: string, transaction: any) {
  const merchantName = transaction.merchantName || transaction.name;
  
  // Determine category from transaction
  let category = "Other";
  if (transaction.subcategory) {
    category = transaction.subcategory;
  } else if (transaction.category && transaction.category.length > 0) {
    category = transaction.category[0];
  }

  // Determine billing interval (default to monthly for now)
  const interval = "monthly";

  // Calculate next billing date (assume monthly)
  const nextBillingDate = new Date(transaction.date);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  return await prisma.subscription.create({
    data: {
      userId,
      name: merchantName,
      amount: transaction.amount,
      currency: "USD",
      interval,
      nextBillingAt: nextBillingDate,
      nextBillingDate: nextBillingDate.toISOString().split("T")[0],
      category,
      status: "active",
      notes: `Imported from bank transaction on ${new Date(
        transaction.date
      ).toLocaleDateString()}`,
    },
  });
}

async function createOrder(userId: string, transaction: any) {
  const merchantName = transaction.merchantName || transaction.name;
  
  // Determine category from transaction
  let category = "Shopping";
  if (transaction.subcategory) {
    category = transaction.subcategory;
  } else if (transaction.category && transaction.category.length > 0) {
    category = transaction.category[0];
  }

  return await prisma.order.create({
    data: {
      userId,
      merchant: merchantName,
      total: transaction.amount,
      currency: "USD",
      orderDate: new Date(transaction.date),
      category,
      status: "completed",
      notes: `Imported from bank transaction on ${new Date(
        transaction.date
      ).toLocaleDateString()}`,
      items: {
        create: [
          {
            name: merchantName,
            qty: 1,
            unitPrice: transaction.amount,
          },
        ],
      },
    },
  });
}

async function createExpense(userId: string, transaction: any) {
  const merchantName = transaction.merchantName || transaction.name;
  
  // Determine category from transaction
  let category = "General";
  if (transaction.subcategory) {
    category = transaction.subcategory;
  } else if (transaction.category && transaction.category.length > 0) {
    category = transaction.category[0];
  }

  return await prisma.expense.create({
    data: {
      userId,
      description: merchantName,
      amount: transaction.amount,
      currency: "USD",
      date: new Date(transaction.date),
      merchant: merchantName,
      category,
      recurrence: "none",
    },
  });
}