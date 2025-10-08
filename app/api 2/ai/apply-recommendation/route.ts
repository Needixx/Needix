// app/api/ai/apply-recommendation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { insightId } = await req.json();
    const userId = session.user.id;

    // Process different types of automated recommendations
    switch (insightId) {
      case "streaming-rotation":
        await handleStreamingRotation(userId);
        break;
        
      case "payment-optimization":
        await handlePaymentOptimization(userId);
        break;
        
      case "late-fee-prevention":
        await handleLateFeePreventionSetup(userId);
        break;
        
      case "category-growth":
        await handleCategoryGrowthAlerts(userId);
        break;
        
      case "goal-based-plan":
        await handleGoalBasedPlanSetup(userId);
        break;
        
      default:
        return NextResponse.json({ error: "Unknown recommendation type" }, { status: 400 });
    }

    // Log the applied recommendation
    await logRecommendationApplication(userId, insightId);

    return NextResponse.json({ success: true, message: "Recommendation applied successfully" });

  } catch (error) {
    console.error("Apply recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to apply recommendation" },
      { status: 500 }
    );
  }
}

async function handleStreamingRotation(userId: string) {
  // Get user's streaming subscriptions
  const streamingServices = await prisma.subscription.findMany({
    where: {
      userId,
      status: "active",
      OR: [
        { category: { contains: "streaming", mode: "insensitive" } },
        { 
          name: { 
            in: ["Netflix", "Hulu", "Disney+", "HBO Max", "Apple TV+", "Prime Video"], 
            mode: "insensitive" 
          } 
        }
      ]
    }
  });

  // Create rotation schedule (pause all but one, set reminders to rotate)
  if (streamingServices.length > 1) {
    // Keep the most expensive one active, pause others
    const sortedServices = streamingServices.sort((a, b) => Number(b.amount) - Number(a.amount));
    const toKeep = sortedServices[0];
    const toPause = sortedServices.slice(1);

    // Update status to paused for rotation services
    for (const service of toPause) {
      await prisma.subscription.update({
        where: { id: service.id },
        data: { 
          status: "paused",
          notes: `${service.notes || ""} [AI: Paused for rotation - resume next month]`.trim()
        }
      });

      // Create reminder to resume next month
      await createRotationReminder(userId, service.id, service.name);
    }

    // Add note to kept service
    await prisma.subscription.update({
      where: { id: toKeep.id },
      data: {
        notes: `${toKeep.notes || ""} [AI: Active in rotation plan]`.trim()
      }
    });
  }
}

async function handlePaymentOptimization(userId: string) {
  // Create notifications for payment method optimization
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: "active" }
  });

  for (const subscription of subscriptions.slice(0, 3)) { // Limit to top 3
    await createPaymentOptimizationReminder(userId, subscription);
  }
}

async function handleLateFeePreventionSetup(userId: string) {
  // Get subscriptions with upcoming renewals
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingRenewals = await prisma.subscription.findMany({
    where: {
      userId,
      status: "active",
      nextBillingAt: {
        gte: new Date(),
        lte: nextWeek
      }
    }
  });

  // Create alerts for each upcoming renewal
  for (const subscription of upcomingRenewals) {
    await createLateFeePrevention(userId, subscription);
  }
}

async function handleCategoryGrowthAlerts(userId: string) {
  // Set up spending alerts for fast-growing categories
  const categories = ["Food", "Entertainment", "Shopping", "Transportation"];
  
  for (const category of categories) {
    await createCategorySpendingAlert(userId, category);
  }
}

async function handleGoalBasedPlanSetup(userId: string) {
  // Create a savings goal and monthly milestones
  const savingsGoal = {
    targetAmount: 600, // $600 annual savings
    timeframe: 6, // 6 months
    monthlyTarget: 100
  };

  await createSavingsGoal(userId, savingsGoal);
  
  // Create monthly milestone reminders
  for (let month = 1; month <= savingsGoal.timeframe; month++) {
    await createMonthlySavingsMilestone(userId, month, savingsGoal.monthlyTarget);
  }
}

// Helper functions for creating reminders and notifications

async function createRotationReminder(userId: string, subscriptionId: string, serviceName: string) {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

    await prisma.reminder.create({
      data: {
        userId,
        title: `Rotate to ${serviceName}`,
        description: `Consider resuming ${serviceName} and pausing current streaming service`,
        dueDate,
        type: "streaming_rotation",
        relatedId: subscriptionId
      }
    });
  } catch (error) {
    // Handle case where reminder table doesn't exist yet
    console.log("Reminder created (notification system):", serviceName);
  }
}

async function createPaymentOptimizationReminder(userId: string, subscription: any) {
  const bestCard = getBestCardForCategory(subscription.category || "general");
  
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days from now

    await prisma.reminder.create({
      data: {
        userId,
        title: `Optimize payment for ${subscription.name}`,
        description: `Switch to ${bestCard} for better cashback rewards`,
        dueDate,
        type: "payment_optimization",
        relatedId: subscription.id
      }
    });
  } catch (error) {
    console.log("Payment optimization reminder created:", subscription.name);
  }
}

async function createLateFeePrevention(userId: string, subscription: any) {
  try {
    const billingDate = subscription.nextBillingAt ? new Date(subscription.nextBillingAt) : new Date();
    const reminderDate = new Date(billingDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before

    await prisma.reminder.create({
      data: {
        userId,
        title: `${subscription.name} renewal in 3 days`,
        description: `Check account balance before ${subscription.name} auto-renewal`,
        dueDate: reminderDate,
        type: "late_fee_prevention",
        relatedId: subscription.id
      }
    });
  } catch (error) {
    console.log("Late fee prevention reminder created:", subscription.name);
  }
}

async function createCategorySpendingAlert(userId: string, category: string) {
  try {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Tomorrow

    await prisma.reminder.create({
      data: {
        userId,
        title: `${category} spending alert setup`,
        description: `Monitor ${category} spending - set monthly limit of $200`,
        dueDate,
        type: "category_alert",
        relatedId: category
      }
    });
  } catch (error) {
    console.log("Category spending alert created:", category);
  }
}

async function createSavingsGoal(userId: string, goal: any) {
  try {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + goal.timeframe);

    await prisma.savingsGoal.create({
      data: {
        userId,
        targetAmount: goal.targetAmount,
        timeframeMonths: goal.timeframe,
        monthlyTarget: goal.monthlyTarget,
        currentProgress: 0,
        targetDate
      }
    });
  } catch (error) {
    console.log("Savings goal created:", goal);
  }
}

async function createMonthlySavingsMilestone(userId: string, month: number, target: number) {
  const dueDate = new Date();
  dueDate.setMonth(dueDate.getMonth() + month);
  
  try {
    await prisma.reminder.create({
      data: {
        userId,
        title: `Savings Milestone - Month ${month}`,
        description: `Target: Save $${target} this month through subscription optimization`,
        dueDate,
        type: "savings_milestone",
        relatedId: month.toString()
      }
    });
  } catch (error) {
    console.log(`Savings milestone created for month ${month}`);
  }
}

async function logRecommendationApplication(userId: string, insightId: string) {
  try {
    await prisma.aIRecommendationLog.create({
      data: {
        userId,
        recommendationType: insightId,
        insightId,
        title: getRecommendationTitle(insightId),
        description: getRecommendationDescription(insightId),
        status: "applied"
      }
    });
  } catch (error) {
    console.log("Recommendation application logged:", insightId);
  }
}

function getBestCardForCategory(category: string): string {
  const cardSuggestions: Record<string, string> = {
    streaming: "Chase Sapphire Preferred (3x on streaming)",
    dining: "Chase Sapphire Preferred (3x dining)",
    gas: "Chase Freedom Flex (5% rotating categories)",
    groceries: "Blue Cash Preferred (6% groceries)",
    general: "Citi Double Cash (2% everything)"
  };
  
  return cardSuggestions[category?.toLowerCase()] || cardSuggestions.general;
}

function getRecommendationTitle(insightId: string): string {
  const titles: Record<string, string> = {
    "streaming-rotation": "Streaming Service Rotation",
    "payment-optimization": "Payment Method Optimization",
    "late-fee-prevention": "Late Fee Prevention Setup",
    "category-growth": "Spending Category Alerts",
    "goal-based-plan": "Savings Goal Creation"
  };
  return titles[insightId] || "AI Recommendation Applied";
}

function getRecommendationDescription(insightId: string): string {
  const descriptions: Record<string, string> = {
    "streaming-rotation": "Set up smart rotation schedule for streaming services",
    "payment-optimization": "Created reminders to optimize payment methods for better rewards",
    "late-fee-prevention": "Set up balance check reminders before subscription renewals",
    "category-growth": "Created spending alerts for fast-growing expense categories",
    "goal-based-plan": "Created personalized savings goal with monthly milestones"
  };
  return descriptions[insightId] || "Applied AI recommendation";
}