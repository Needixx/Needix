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

    // Get user's subscription data using the correct model name
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: "active" },
      orderBy: { amount: "desc" }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        insights: [],
        summary: {
          totalMonthly: 0,
          totalAnnual: 0,
          subscriptionCount: 0,
          message: "No active subscriptions found. Add some subscriptions to get AI insights!"
        }
      });
    }

    // Calculate totals and generate insights
    const monthlyTotal = subscriptions.reduce((sum, sub) => {
      const amount = Number(sub.amount) || 0;
      const factor = sub.interval === "monthly" ? 1 : 
                    sub.interval === "yearly" ? 1/12 : 
                    sub.interval === "weekly" ? 4.345 : 1;
      return sum + (amount * factor);
    }, 0);

    const annualTotal = monthlyTotal * 12;

    // Generate insights based on data
    const insights = [];
    
    // Most expensive subscription insight
    const mostExpensive = subscriptions[0];
    if (mostExpensive && Number(mostExpensive.amount) > 20) {
      insights.push({
        type: "cost_optimization",
        priority: "high",
        title: "High-Cost Subscription Detected",
        description: `${mostExpensive.name} costs $${mostExpensive.amount}/${mostExpensive.interval}. Consider if you're getting full value from this service.`,
        action: "Review usage patterns and consider downgrading or canceling if underutilized.",
        potentialSavings: Number(mostExpensive.amount)
      });
    }

    // Multiple entertainment services
    const entertainmentSubs = subscriptions.filter(sub => 
      sub.name.toLowerCase().includes('netflix') ||
      sub.name.toLowerCase().includes('hulu') ||
      sub.name.toLowerCase().includes('disney') ||
      sub.name.toLowerCase().includes('spotify') ||
      sub.name.toLowerCase().includes('apple music') ||
      sub.name.toLowerCase().includes('youtube')
    );

    if (entertainmentSubs.length >= 3) {
      const entertainmentCost = entertainmentSubs.reduce((sum, sub) => sum + Number(sub.amount), 0);
      insights.push({
        type: "bundling_opportunity",
        priority: "medium",
        title: "Multiple Entertainment Subscriptions",
        description: `You have ${entertainmentSubs.length} entertainment subscriptions costing $${entertainmentCost.toFixed(2)}/month total.`,
        action: "Consider bundling services or rotating subscriptions seasonally to save money.",
        potentialSavings: entertainmentCost * 0.3 // Estimate 30% savings
      });
    }

    // Annual vs monthly billing insight
    const monthlyBilled = subscriptions.filter(sub => sub.interval === "monthly");
    if (monthlyBilled.length >= 2) {
      const monthlyCost = monthlyBilled.reduce((sum, sub) => sum + Number(sub.amount), 0);
      insights.push({
        type: "billing_optimization",
        priority: "low",
        title: "Annual Billing Savings Opportunity",
        description: `${monthlyBilled.length} services are billed monthly. Many services offer 10-20% discounts for annual billing.`,
        action: "Contact providers to switch to annual billing where available.",
        potentialSavings: monthlyCost * 12 * 0.15 // Estimate 15% annual savings
      });
    }

    // Spending velocity insight
    if (monthlyTotal > 100) {
      insights.push({
        type: "spending_awareness",
        priority: "medium", 
        title: "High Subscription Spending",
        description: `Your subscriptions total $${monthlyTotal.toFixed(2)}/month ($${annualTotal.toFixed(2)}/year).`,
        action: "Review each subscription quarterly to ensure you're still getting value.",
        potentialSavings: 0
      });
    }

    // Unused/underutilized services (mock insight)
    if (subscriptions.length >= 5) {
      insights.push({
        type: "usage_optimization",
        priority: "high",
        title: "Potential Unused Subscriptions",
        description: `With ${subscriptions.length} active subscriptions, some may be underutilized.`,
        action: "Track usage for 30 days and cancel services you don't use regularly.",
        potentialSavings: monthlyTotal * 0.25 // Estimate 25% of subscriptions are underused
      });
    }

    return NextResponse.json({
      insights,
      summary: {
        totalMonthly: monthlyTotal,
        totalAnnual: annualTotal,
        subscriptionCount: subscriptions.length,
        topCategories: getTopCategories(subscriptions),
        message: `AI analyzed ${subscriptions.length} subscriptions and found ${insights.length} optimization opportunities.`
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

function getTopCategories(subscriptions: unknown[]) {
  const categories: { [key: string]: { count: number; total: number } } = {};
  
  subscriptions.forEach(sub => {
    const subscription = sub as { category?: string; amount: unknown };
    const category = subscription.category || "Other";
    const amount = Number(subscription.amount) || 0;
    
    if (!categories[category]) {
      categories[category] = { count: 0, total: 0 };
    }
    
    categories[category].count++;
    categories[category].total += amount;
  });

  return Object.entries(categories)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
}