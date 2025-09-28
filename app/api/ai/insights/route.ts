// app/api/ai/insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // For demo purposes, AI analysis is enabled by default
    // In production, this would be stored in the database per user
    const allowDataAccess = true;

    if (!allowDataAccess) {
      return NextResponse.json({ 
        error: "AI analysis is disabled. Enable it in Settings > AI & Privacy" 
      }, { status: 403 });
    }

    // Get user's financial data using the correct model names
    const [subscriptions, orders, expenses] = await Promise.all([
      prisma.subscription.findMany({
        where: { userId, status: "active" },
        orderBy: { amount: "desc" }
      }),
      prisma.order.findMany({
        where: { userId },
        include: { items: true },
        orderBy: { total: "desc" }
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { amount: "desc" }
      })
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
          message: "No financial data found. Add subscriptions, orders, or expenses to get AI insights!"
        }
      });
    }

    // Calculate totals
    const monthlySubscriptionTotal = subscriptions.reduce((sum, sub) => {
      const amount = Number(sub.amount) || 0;
      const factor = sub.interval === "monthly" ? 1 : 
                    sub.interval === "yearly" ? 1/12 : 
                    sub.interval === "weekly" ? 4.345 : 1;
      return sum + (amount * factor);
    }, 0);

    const monthlyExpenseTotal = expenses.reduce((sum, expense) => {
      const amount = Number(expense.amount) || 0;
      const factor = expense.recurrence === "monthly" ? 1 :
                    expense.recurrence === "yearly" ? 1/12 :
                    expense.recurrence === "weekly" ? 4.345 :
                    expense.recurrence === "daily" ? 30 : 0; // Only recurring expenses
      return sum + (amount * factor);
    }, 0);

    const totalOrderValue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const monthlyTotal = monthlySubscriptionTotal + monthlyExpenseTotal;
    const annualTotal = monthlyTotal * 12;

    // Generate comprehensive insights
    const insights = [];
    
    // High-cost subscription insight
    const mostExpensiveSubscription = subscriptions[0];
    if (mostExpensiveSubscription && Number(mostExpensiveSubscription.amount) > 20) {
      insights.push({
        type: "cost_optimization",
        priority: "high" as const,
        title: "High-Cost Subscription Detected",
        description: `${mostExpensiveSubscription.name} costs $${mostExpensiveSubscription.amount}/${mostExpensiveSubscription.interval}. Consider if you're getting full value from this service.`,
        action: "Review usage patterns and consider downgrading or canceling if underutilized.",
        potentialSavings: Number(mostExpensiveSubscription.amount) * 0.5,
        category: "subscriptions"
      });
    }

    // Large order insight
    const largestOrder = orders[0];
    if (largestOrder && Number(largestOrder.total) > 100) {
      insights.push({
        type: "spending_pattern",
        priority: "medium" as const,
        title: "Large Purchase Detected",
        description: `Your largest order from ${largestOrder.merchant} was $${largestOrder.total}. Consider if similar future purchases could be planned or budgeted for.`,
        action: "Set up a savings plan for large purchases to avoid budget strain.",
        potentialSavings: 0,
        category: "orders"
      });
    }

    // Recurring expense optimization
    const recurringExpenses = expenses.filter(e => e.recurrence !== "none");
    if (recurringExpenses.length > 0) {
      const totalRecurringMonthly = recurringExpenses.reduce((sum, expense) => {
        const amount = Number(expense.amount) || 0;
        const factor = expense.recurrence === "monthly" ? 1 :
                      expense.recurrence === "yearly" ? 1/12 :
                      expense.recurrence === "weekly" ? 4.345 :
                      expense.recurrence === "daily" ? 30 : 0;
        return sum + (amount * factor);
      }, 0);

      if (totalRecurringMonthly > 50) {
        insights.push({
          type: "expense_optimization",
          priority: "medium" as const,
          title: "Recurring Expenses Opportunity",
          description: `You have $${totalRecurringMonthly.toFixed(2)}/month in recurring expenses. Review these for potential savings.`,
          action: "Audit recurring expenses monthly to identify unnecessary costs.",
          potentialSavings: totalRecurringMonthly * 0.15,
          category: "expenses"
        });
      }
    }

    // Category analysis across all types
    const allCategories: { [key: string]: { count: number; total: number; types: string[] } } = {};
    
    // Add subscriptions to categories
    subscriptions.forEach(sub => {
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

    // Add orders to categories
    orders.forEach(order => {
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

    // Add expenses to categories
    expenses.forEach(expense => {
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
        action: "Track usage for 30 days and cancel services you don't use regularly.",
        potentialSavings: monthlySubscriptionTotal * 0.25,
        category: "subscriptions"
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
          description: `${subscriptionRatio.toFixed(1)}% of your monthly spending is on subscriptions. Consider balancing with essential expenses.`,
          action: "Review if all subscriptions align with your current priorities and usage patterns.",
          potentialSavings: monthlySubscriptionTotal * 0.2,
          category: "budget"
        });
      }
    }

    // Essential vs non-essential analysis
    const essentialSubscriptions = subscriptions.filter(s => s.isEssential);
    const essentialExpenses = expenses.filter(e => e.isEssential);
    const essentialOrders = orders.filter(o => o.isEssential);
    
    const nonEssentialItems = totalItems - (essentialSubscriptions.length + essentialExpenses.length + essentialOrders.length);
    
    if (nonEssentialItems > totalItems * 0.6) {
      insights.push({
        type: "priority_optimization",
        priority: "medium" as const,
        title: "Non-Essential Spending Review",
        description: `${nonEssentialItems} of your ${totalItems} tracked items are marked as non-essential.`,
        action: "Review non-essential items and consider which could be reduced or eliminated.",
        potentialSavings: (monthlyTotal + (totalOrderValue / 12)) * 0.3,
        category: "budget"
      });
    }

    return NextResponse.json({
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
            types: data.types 
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5),
        message: `AI analyzed ${totalItems} items (${subscriptions.length} subscriptions, ${orders.length} orders, ${expenses.length} expenses) and found ${insights.length} optimization opportunities.`
      },
      lastAnalyzed: new Date().toISOString()
    });

  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}