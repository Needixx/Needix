// app/api/ai/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const includeRaw = req.nextUrl.searchParams.get("includeRaw") === "1";

    // For demo purposes, AI analysis is enabled by default
    // In production, this would be stored in the database per user
    const allowDataAccess = true;

    if (!allowDataAccess) {
      return NextResponse.json(
        { error: "AI analysis is disabled. Enable it in Settings > AI & Privacy" },
        { status: 403 }
      );
    }

    // Fetch user data (preserve your current behavior)
    const [subscriptions, orders, expenses] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId, status: "active" },
        orderBy: { amount: "desc" },
      }),
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { total: "desc" },
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { amount: "desc" },
      }),
    ]);

    const totalItems = subscriptions.length + orders.length + expenses.length;

    if (totalItems === 0) {
      return NextResponse.json({
        insights: [],
        summary: {
          totalMonthly: 0,
          totalAnnual: 0,
          subscriptionCount: 0,
          orderCount: 0,
          expenseCount: 0,
          totalItemCount: 0,
          message:
            "No financial data found. Add subscriptions, orders, or expenses to get AI insights!",
        },
      });
    }

    // Calculate totals (unchanged)
    const monthlySubscriptionTotal = subscriptions.reduce((sum, sub: any) => {
      const amount = Number(sub.amount) || 0;
      const factor =
        sub.interval === "monthly"
          ? 1
          : sub.interval === "yearly"
          ? 1 / 12
          : sub.interval === "weekly"
          ? 4.345
          : 1;
      return sum + amount * factor;
    }, 0);

    const monthlyExpenseTotal = expenses.reduce((sum, expense: any) => {
      const amount = Number(expense.amount) || 0;
      const factor =
        expense.recurrence === "monthly"
          ? 1
          : expense.recurrence === "yearly"
          ? 1 / 12
          : expense.recurrence === "weekly"
          ? 4.345
          : expense.recurrence === "daily"
          ? 30
          : 0; // Only recurring expenses
      return sum + amount * factor;
    }, 0);

    const totalOrderValue = orders.reduce((s, o: any) => s + (Number(o.total) || 0), 0);
    const monthlyTotal = monthlySubscriptionTotal + monthlyExpenseTotal;
    const annualTotal = monthlyTotal * 12;

    // Generate insights (unchanged)
    const insights: any[] = [];

    // High-cost subscription
    const mostExpensiveSubscription: any = subscriptions[0];
    if (mostExpensiveSubscription && Number(mostExpensiveSubscription.amount) > 20) {
      insights.push({
        type: "cost_optimization",
        priority: "high" as const,
        title: "High-Cost Subscription Detected",
        description: `${mostExpensiveSubscription.name} costs $${mostExpensiveSubscription.amount}/${mostExpensiveSubscription.interval}. Consider if you're getting full value from this service.`,
        action:
          "Review usage patterns and consider downgrading or canceling if underutilized.",
        potentialSavings: Number(mostExpensiveSubscription.amount) * 0.5,
        category: "subscriptions",
      });
    }

    // Large order
    const largestOrder: any = orders[0];
    if (largestOrder && Number(largestOrder.total) > 100) {
      insights.push({
        type: "spending_pattern",
        priority: "medium" as const,
        title: "Large Purchase Detected",
        description: `Your largest order from ${largestOrder.merchant} was $${largestOrder.total}. Consider if similar future purchases could be planned or budgeted for.`,
        action: "Set up a savings plan for large purchases to avoid budget strain.",
        potentialSavings: 0,
        category: "orders",
      });
    }

    // Recurring expense optimization
    const recurringExpenses = expenses.filter((e: any) => e.recurrence !== "none");
    if (recurringExpenses.length > 0) {
      const totalRecurringMonthly = recurringExpenses.reduce((sum: number, expense: any) => {
        const amount = Number(expense.amount) || 0;
        const factor =
          expense.recurrence === "monthly"
            ? 1
            : expense.recurrence === "yearly"
            ? 1 / 12
            : expense.recurrence === "weekly"
            ? 4.345
            : expense.recurrence === "daily"
            ? 30
            : 0;
        return sum + amount * factor;
      }, 0);

      if (totalRecurringMonthly > 50) {
        insights.push({
          type: "expense_optimization",
          priority: "medium" as const,
          title: "Recurring Expenses Opportunity",
          description: `You have $${totalRecurringMonthly.toFixed(
            2
          )}/month in recurring expenses. Review these for potential savings.`,
          action: "Audit recurring expenses monthly to identify unnecessary costs.",
          potentialSavings: totalRecurringMonthly * 0.15,
          category: "expenses",
        });
      }
    }

    // Category analysis across all types
    const allCategories: {
      [key: string]: { count: number; total: number; types: string[] };
    } = {};

    subscriptions.forEach((sub: any) => {
      const category = sub.category || "Other";
      const amount = Number(sub.amount) || 0;
      if (!allCategories[category]) {
        allCategories[category] = { count: 0, total: 0, types: [] };
      }
      allCategories[category].count++;
      allCategories[category].total += amount;
      if (!allCategories[category].types.includes("subscription")) {
        allCategories[category].types.push("subscription");
      }
    });

    orders.forEach((order: any) => {
      const category = order.category || "Other";
      const amount = Number(order.total) || 0;
      if (!allCategories[category]) {
        allCategories[category] = { count: 0, total: 0, types: [] };
      }
      allCategories[category].count++;
      allCategories[category].total += amount;
      if (!allCategories[category].types.includes("order")) {
        allCategories[category].types.push("order");
      }
    });

    expenses.forEach((expense: any) => {
      const category = expense.category || "Other";
      const amount = Number(expense.amount) || 0;
      if (!allCategories[category]) {
        allCategories[category] = { count: 0, total: 0, types: [] };
      }
      allCategories[category].count++;
      allCategories[category].total += amount;
      if (!allCategories[category].types.includes("expense")) {
        allCategories[category].types.push("expense");
      }
    });

    // Service redundancy insight
    if (subscriptions.length >= 5) {
      insights.push({
        type: "usage_optimization",
        priority: "high" as const,
        title: "Potential Service Overlap",
        description: `With ${subscriptions.length} active subscriptions, some may provide similar services or be underutilized.`,
        action:
          "Track usage for 30 days and cancel services you don't use regularly.",
        potentialSavings: monthlySubscriptionTotal * 0.25,
        category: "subscriptions",
      });
    }

    // Budget distribution insight
    if (monthlyTotal > 200) {
      const subscriptionRatio = (monthlySubscriptionTotal / monthlyTotal) * 100;
      const expenseRatio = (monthlyExpenseTotal / monthlyTotal) * 100;

      if (subscriptionRatio > 70) {
        insights.push({
          type: "budget_balance",
          priority: "medium" as const,
          title: "Subscription-Heavy Budget",
          description: `${subscriptionRatio.toFixed(
            1
          )}% of your monthly spending is on subscriptions. Consider balancing with essential expenses.`,
          action:
            "Review if all subscriptions align with your current priorities and usage patterns.",
          potentialSavings: monthlySubscriptionTotal * 0.2,
          category: "budget",
        });
      }
    }

    // Essential vs non-essential analysis
    const essentialSubscriptions = subscriptions.filter((s: any) => s.isEssential);
    const essentialExpenses = expenses.filter((e: any) => e.isEssential);
    const essentialOrders = orders.filter((o: any) => o.isEssential);

    const nonEssentialItems =
      totalItems -
      (essentialSubscriptions.length +
        essentialExpenses.length +
        essentialOrders.length);

    if (nonEssentialItems > totalItems * 0.6) {
      insights.push({
        type: "priority_optimization",
        priority: "medium" as const,
        title: "Non-Essential Spending Review",
        description: `${nonEssentialItems} of your ${totalItems} tracked items are marked as non-essential.`,
        action:
          "Review non-essential items and consider which could be reduced or eliminated.",
        potentialSavings: (monthlyTotal + totalOrderValue / 12) * 0.3,
        category: "budget",
      });
    }

    // ----- NEW: attach raw arrays when includeRaw=1 -----
    // The client Deep Scan expects:
    //   rawSubscriptions: { id, name, amount, interval: 'month|year|week|day', nextPaymentDate?, lastPaymentDate?, status?, tags? }
    //   rawOrders:       { id, merchant|title, amount, date }
    //   rawExpenses:     { id, merchant|title, amount, date, recurring? }
    const mapIntervalToUnit = (v?: string | null): "month" | "year" | "week" | "day" => {
      switch (v) {
        case "year":
        case "yearly":
          return "year";
        case "week":
        case "weekly":
          return "week";
        case "day":
        case "daily":
          return "day";
        default:
          return "month";
      }
    };

    const safeISO = (d: any): string | undefined => {
      try {
        if (!d) return undefined;
        const dt = typeof d === "string" ? new Date(d) : d instanceof Date ? d : null;
        return dt ? dt.toISOString() : undefined;
      } catch {
        return undefined;
      }
    };

    const payload: any = {
      insights,
      summary: {
        totalMonthly: monthlyTotal,
        totalAnnual: annualTotal,
        subscriptionCount: subscriptions.length,
        orderCount: orders.length,
        expenseCount: expenses.length,
        totalItemCount: totalItems,
        totalOrderValue,
        monthlySubscriptionTotal,
        monthlyExpenseTotal,
        topCategories: Object.entries(allCategories)
          .map(([name, data]) => ({
            name,
            count: data.count,
            total: data.total,
            types: data.types,
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5),
        message: `AI analyzed ${totalItems} items (${subscriptions.length} subscriptions, ${orders.length} orders, ${expenses.length} expenses) and found ${insights.length} optimization opportunities.`,
      },
      lastAnalyzed: new Date().toISOString(),
    };

    if (includeRaw) {
      // Subscriptions
      payload.rawSubscriptions = subscriptions.map((s: any) => ({
        id: s.id,
        name: s.name,
        amount: Number(s.amount) || 0,
        interval: mapIntervalToUnit(s.interval ?? s.billingInterval),
        nextPaymentDate:
          safeISO(s.nextPaymentDate ?? s.nextBillingDate ?? s.renewalDate) || undefined,
        lastPaymentDate: safeISO(s.lastPaymentDate ?? s.lastBillingDate) || undefined,
        status: s.status,
        tags: Array.isArray(s.tags) ? s.tags : undefined,
      }));

      // Orders
      payload.rawOrders = orders.map((o: any) => ({
        id: o.id,
        merchant: o.merchant ?? o.vendor ?? o.seller ?? undefined,
        title: o.title ?? undefined,
        amount: Number(o.total) || 0,
        date:
          safeISO(o.orderDate ?? o.date ?? o.createdAt ?? o.updatedAt) ||
          new Date().toISOString(),
        itemsCount: Array.isArray(o.items) ? o.items.length : undefined,
      }));

      // Expenses
      payload.rawExpenses = expenses.map((e: any) => ({
        id: e.id,
        merchant: e.merchant ?? undefined,
        title: e.description ?? e.title ?? undefined,
        amount: Number(e.amount) || 0,
        date: safeISO(e.date ?? e.createdAt ?? e.updatedAt) || new Date().toISOString(),
        recurring: e.recurrence && e.recurrence !== "none",
      }));
    }
    // ----- END NEW -----

    return NextResponse.json(payload);
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
