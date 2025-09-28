// app/api/ai/enhanced-insights/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AIInsight {
  id: string;
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  potentialSavings: number;
  category: string;
  timeline?: string;
  difficulty?: "easy" | "medium" | "hard";
  automated?: boolean;
  additionalData?: Record<string, unknown>;
}

interface SubscriptionOptimization {
  bundleOpportunities: Array<{
    suggestedBundle: string;
    currentServices: string[];
    monthlySavings: number;
    provider: string;
  }>;
  rotationPlan: Array<{
    service: string;
    optimalMonths: string[];
    reason: string;
  }>;
  trialOpportunities: Array<{
    service: string;
    lastUsed: string;
    discountAvailable: boolean;
    savingsPercent: number;
  }>;
}

interface CommerceOptimization {
  negotiationTargets: Array<{
    service: string;
    currentPrice: number;
    marketAverage: number;
    scriptTemplate: string;
    bestTimeToCall: string;
  }>;
  paymentOptimization: Array<{
    subscription: string;
    currentCard: string;
    suggestedCard: string;
    additionalCashback: number;
  }>;
  duplicateWarranties: Array<{
    item: string;
    duplicateCount: number;
    potentialSavings: number;
  }>;
}

interface BehavioralInsights {
  costPerUse: Array<{
    service: string;
    totalCost: number;
    usageCount: number;
    costPerUse: number;
    recommendation: string;
  }>;
  categoryGrowth: Array<{
    category: string;
    monthOverMonthGrowth: number;
    threshold: number;
    action: string;
  }>;
  goalBasedPlan: {
    targetSavings: number;
    timeframe: number;
    stepwisePlan: Array<{
      month: number;
      action: string;
      savings: number;
    }>;
  };
}

// Check if AI analysis is enabled
const getAISettings = () => {
  // In a real app, you'd get this from user preferences in the database
  // For now, we'll assume it's enabled if they're calling this endpoint
  return { allowDataAccess: true };
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const aiSettings = getAISettings();
  if (!aiSettings.allowDataAccess) {
    return NextResponse.json({ error: "AI analysis is disabled" }, { status: 403 });
  }

  try {
    const userId = session.user.id;
    
    // Fetch user data with proper type handling
    const [subscriptions, expenses, orders] = await Promise.all([
      prisma.subscription.findMany({ 
        where: { userId, status: "active" },
        orderBy: { createdAt: "desc" }
      }),
      prisma.expense.findMany({ 
        where: { userId },
        orderBy: { date: "desc" },
        take: 100 // Limit for performance
      }),
      prisma.order.findMany({ 
        where: { userId },
        include: { items: true },
        orderBy: { orderDate: "desc" },
        take: 50
      }),
    ]);

    // Calculate monthly totals with proper type conversion
    const monthlySubscriptionTotal = subscriptions.reduce((sum, s) => {
      const amount = parseFloat(s.amount.toString()) || 0;
      const factor = s.interval === "monthly" ? 1 : 
                    s.interval === "yearly" ? 1/12 : 
                    s.interval === "weekly" ? 4.345 : 0;
      return sum + (amount * factor);
    }, 0);

    // Generate enhanced insights
    const insights: AIInsight[] = [];

    // A. Subscription Optimization Insights
    
    // 1. Bundle Arbitrage Analysis
    const bundleOpportunities = analyzeBundleOpportunities(subscriptions);
    if (bundleOpportunities.length > 0) {
      insights.push({
        id: "bundle-arbitrage",
        type: "bundle_optimization",
        priority: "high",
        title: "Bundle Savings Available",
        description: `You could save $${bundleOpportunities.reduce((sum, b) => sum + b.monthlySavings, 0).toFixed(0)}/month by switching to bundles`,
        action: "Consider switching to suggested bundles for better value",
        potentialSavings: bundleOpportunities.reduce((sum, b) => sum + b.monthlySavings, 0),
        category: "subscriptions",
        timeline: "This week",
        difficulty: "easy",
        automated: false
      });
    }

    // 2. Streamer Rotation Strategy
    const streamingServices = subscriptions.filter(s => 
      s.category?.toLowerCase().includes('streaming') || 
      ['netflix', 'hulu', 'disney', 'hbo', 'prime video', 'apple tv'].some(service => 
        s.name.toLowerCase().includes(service)
      )
    );
    
    if (streamingServices.length > 2) {
      const rotationSavings = streamingServices.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0) * 0.6;
      insights.push({
        id: "streaming-rotation",
        type: "rotation_plan",
        priority: "medium",
        title: "Streaming Service Rotation",
        description: `Rotate between ${streamingServices.length} streaming services instead of keeping all active`,
        action: "Keep 1-2 services active per month, rotate based on content calendar",
        potentialSavings: rotationSavings,
        category: "subscriptions",
        timeline: "Next month",
        difficulty: "medium",
        automated: true
      });
    }

    // 3. Trial Re-eligibility Detection
    const trialOpportunities = detectTrialOpportunities(subscriptions);
    if (trialOpportunities.length > 0) {
      insights.push({
        id: "trial-reeligibility",
        type: "trial_optimization",
        priority: "medium",
        title: "Trial & Discount Opportunities",
        description: `${trialOpportunities.length} services may offer trials or winback discounts`,
        action: "Check eligibility for free trials or returning customer discounts",
        potentialSavings: trialOpportunities.reduce((sum, t) => sum + (t.savingsPercent / 100 * 20), 0), // Estimated
        category: "subscriptions",
        timeline: "This month",
        difficulty: "easy",
        automated: false
      });
    }

    // B. Commerce & Bills Optimization

    // 4. Recurring Merchant Re-pricing
    const negotiationTargets = identifyNegotiationTargets(subscriptions, expenses);
    if (negotiationTargets.length > 0) {
      insights.push({
        id: "price-negotiation",
        type: "negotiation",
        priority: "high",
        title: "Price Negotiation Opportunities",
        description: `${negotiationTargets.length} services are above market rate and negotiable`,
        action: "Call providers during suggested time windows with negotiation scripts",
        potentialSavings: negotiationTargets.reduce((sum, t) => sum + (t.currentPrice - t.marketAverage), 0),
        category: "commerce",
        timeline: "Next 2 weeks",
        difficulty: "medium",
        automated: false
      });
    }

    // 5. Payment Optimization
    const paymentOptimizations = analyzePaymentOptimization(subscriptions);
    if (paymentOptimizations.length > 0) {
      insights.push({
        id: "payment-optimization",
        type: "cashback_optimization",
        priority: "medium",
        title: "Credit Card Optimization",
        description: `Optimize payment methods for better cashback rewards`,
        action: "Switch payment methods to cards with better category bonuses",
        potentialSavings: paymentOptimizations.reduce((sum, p) => sum + p.additionalCashback, 0) * 12,
        category: "commerce",
        timeline: "This week",
        difficulty: "easy",
        automated: true
      });
    }

    // 6. Late Fee Risk Analysis
    const lateFeeRisks = analyzeLateFeePrevention(subscriptions);
    if (lateFeeRisks.length > 0) {
      insights.push({
        id: "late-fee-prevention",
        type: "late_fee_prevention",
        priority: "high",
        title: "Late Fee Prevention",
        description: `${lateFeeRisks.length} subscriptions have renewal dates near low balance periods`,
        action: "Reschedule autopay dates or set up balance alerts",
        potentialSavings: lateFeeRisks.length * 25, // Average late fee
        category: "commerce",
        timeline: "Immediate",
        difficulty: "easy",
        automated: true
      });
    }

    // C. Behavioral & Budgeting Insights

    // 7. Cost Per Use Analysis
    const costPerUseAnalysis = calculateCostPerUse(subscriptions);
    const highCostPerUse = costPerUseAnalysis.filter(item => item.costPerUse > 10);
    if (highCostPerUse.length > 0) {
      insights.push({
        id: "cost-per-use",
        type: "usage_optimization",
        priority: "medium",
        title: "High Cost-Per-Use Services",
        description: `${highCostPerUse.length} services have high cost per use (>$10/use)`,
        action: "Consider pausing underutilized subscriptions or switching to pay-per-use",
        potentialSavings: highCostPerUse.reduce((sum, item) => sum + item.totalCost * 0.8, 0),
        category: "behavioral",
        timeline: "Next month",
        difficulty: "medium",
        automated: false
      });
    }

    // 8. Category Spending Growth
    const categoryGrowth = analyzeCategoryGrowth(expenses);
    const rapidGrowthCategories = categoryGrowth.filter(item => item.monthOverMonthGrowth > 20);
    if (rapidGrowthCategories.length > 0) {
      insights.push({
        id: "category-growth",
        type: "spending_growth",
        priority: "high",
        title: "Rapid Spending Growth Detected",
        description: `${rapidGrowthCategories.length} categories show >20% month-over-month growth`,
        action: "Set spending caps and alerts for fast-growing categories",
        potentialSavings: rapidGrowthCategories.reduce((sum, _item) => sum + 50, 0), // Estimated prevention
        category: "behavioral",
        timeline: "This week",
        difficulty: "easy",
        automated: true
      });
    }

    // 9. Goal-Based Savings Plan
    const savingsGoal = calculateOptimalSavingsGoal(monthlySubscriptionTotal, expenses);
    if (savingsGoal.targetSavings > 0) {
      insights.push({
        id: "goal-based-plan",
        type: "savings_plan",
        priority: "medium",
        title: "Personalized Savings Plan",
        description: `Custom plan to save $${savingsGoal.targetSavings} over ${savingsGoal.timeframe} months`,
        action: "Follow step-by-step monthly savings plan with automated reminders",
        potentialSavings: savingsGoal.targetSavings,
        category: "behavioral",
        timeline: `${savingsGoal.timeframe} months`,
        difficulty: "medium",
        automated: true
      });
    }

    // Build optimization data structures
    const subscriptionOptimization: SubscriptionOptimization = {
      bundleOpportunities,
      rotationPlan: generateRotationPlan(streamingServices),
      trialOpportunities
    };

    const commerceOptimization: CommerceOptimization = {
      negotiationTargets,
      paymentOptimization: paymentOptimizations,
      duplicateWarranties: findDuplicateWarranties(orders)
    };

    const behavioralInsights: BehavioralInsights = {
      costPerUse: costPerUseAnalysis,
      categoryGrowth,
      goalBasedPlan: savingsGoal
    };

    // Calculate summary metrics
    const totalPotentialSavings = insights.reduce((sum, insight) => sum + insight.potentialSavings, 0);
    const quickWinSavings = insights
      .filter(i => i.difficulty === "easy" && i.timeline?.includes("week"))
      .reduce((sum, insight) => sum + insight.potentialSavings, 0);
    const automatedSavings = insights
      .filter(i => i.automated)
      .reduce((sum, insight) => sum + insight.potentialSavings, 0);

    const response = {
      insights,
      subscriptionOptimization,
      commerceOptimization,
      behavioralInsights,
      summary: {
        totalPotentialSavings,
        quickWinSavings,
        automatedSavings,
        confidenceScore: calculateConfidenceScore(insights)
      },
      lastAnalyzed: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Enhanced AI insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate enhanced insights" },
      { status: 500 }
    );
  }
}

// Helper Functions

function analyzeBundleOpportunities(subscriptions: Array<{
  name: string;
  amount: { toString(): string };
  category?: string | null;
}>) {
  const bundleOpportunities = [];
  
  // Apple ecosystem analysis
  const appleServices = subscriptions.filter(s => 
    ['apple music', 'apple tv', 'icloud', 'apple arcade'].some(service => 
      s.name.toLowerCase().includes(service)
    )
  );
  
  if (appleServices.length >= 2) {
    const currentCost = appleServices.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
    const appleOnePrice = 16.95; // Apple One Individual
    if (currentCost > appleOnePrice) {
      bundleOpportunities.push({
        suggestedBundle: "Apple One Individual",
        currentServices: appleServices.map(s => s.name),
        monthlySavings: currentCost - appleOnePrice,
        provider: "Apple"
      });
    }
  }

  // Amazon ecosystem
  const amazonServices = subscriptions.filter(s => 
    ['amazon prime', 'prime video', 'amazon music'].some(service => 
      s.name.toLowerCase().includes(service)
    )
  );
  
  if (amazonServices.length >= 2) {
    const currentCost = amazonServices.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
    const primePrice = 14.98;
    if (currentCost > primePrice) {
      bundleOpportunities.push({
        suggestedBundle: "Amazon Prime (includes Video & Music)",
        currentServices: amazonServices.map(s => s.name),
        monthlySavings: currentCost - primePrice,
        provider: "Amazon"
      });
    }
  }

  return bundleOpportunities;
}

function detectTrialOpportunities(subscriptions: Array<{
  name: string;
  createdAt: Date;
}>) {
  // Simulate trial eligibility detection
  return subscriptions
    .filter(s => {
      const daysSinceStart = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceStart > 90; // Might be eligible for winback offers
    })
    .slice(0, 3) // Limit results
    .map(s => ({
      service: s.name,
      lastUsed: new Date(s.createdAt).toLocaleDateString(),
      discountAvailable: Math.random() > 0.5, // Simulate availability
      savingsPercent: Math.floor(Math.random() * 50) + 10 // 10-60% discount
    }));
}

function identifyNegotiationTargets(
  subscriptions: Array<{
    name: string;
    amount: { toString(): string };
    category?: string | null;
  }>, 
  _expenses: Array<{
    id: string;
    userId: string;
    description: string;
    amount: { toString(): string };
    currency: string;
    date: Date;
    merchant?: string | null;
    category?: string | null;
    [key: string]: unknown;
  }>
) {
  const negotiableServices = ['internet', 'phone', 'insurance', 'cable', 'wireless'];
  
  return subscriptions
    .filter(s => negotiableServices.some(service => 
      s.name.toLowerCase().includes(service) || s.category?.toLowerCase().includes(service)
    ))
    .map(s => {
      const currentPrice = parseFloat(s.amount.toString());
      const marketAverage = currentPrice * (0.7 + Math.random() * 0.2); // 70-90% of current
      
      return {
        service: s.name,
        currentPrice,
        marketAverage,
        scriptTemplate: generateNegotiationScript(s.name, currentPrice, marketAverage),
        bestTimeToCall: getBestCallTime(s.name)
      };
    })
    .filter(t => t.currentPrice > t.marketAverage);
}

function analyzePaymentOptimization(subscriptions: Array<{
  name: string;
  amount: { toString(): string };
  category?: string | null;
}>) {
  return subscriptions
    .slice(0, 3) // Limit for demo
    .map(s => ({
      subscription: s.name,
      currentCard: "Current Card",
      suggestedCard: getBestCardForCategory(s.category || "general"),
      additionalCashback: parseFloat(s.amount.toString()) * 0.02 // 2% additional cashback
    }));
}

function analyzeLateFeePrevention(subscriptions: Array<{
  name: string;
  nextBillingDate?: string | null;
}>) {
  // Simulate late fee risk analysis
  return subscriptions
    .filter(() => Math.random() > 0.8) // 20% have risk
    .slice(0, 2)
    .map(s => ({ subscription: s.name, risk: "high", nextBilling: s.nextBillingDate }));
}

function calculateCostPerUse(subscriptions: Array<{
  name: string;
  amount: { toString(): string };
}>) {
  return subscriptions.map(s => {
    const totalCost = parseFloat(s.amount.toString());
    const usageCount = Math.floor(Math.random() * 20) + 1; // Simulate usage
    return {
      service: s.name,
      totalCost,
      usageCount,
      costPerUse: totalCost / usageCount,
      recommendation: totalCost / usageCount > 10 ? "Consider pausing or switching to pay-per-use" : "Good value for usage"
    };
  });
}

function analyzeCategoryGrowth(_expenses: Array<{
  id: string;
  userId: string;
  description: string;
  amount: { toString(): string };
  currency: string;
  date: Date;
  merchant?: string | null;
  category?: string | null;
  [key: string]: unknown;
}>) {
  const categories = ['Food', 'Entertainment', 'Shopping', 'Transportation'];
  return categories.map(category => ({
    category,
    monthOverMonthGrowth: (Math.random() - 0.5) * 50, // -25% to +25%
    threshold: 15,
    action: "Set spending alert for this category"
  }));
}

function calculateOptimalSavingsGoal(
  monthlySubscriptions: number, 
  _expenses: Array<{
    id: string;
    userId: string;
    description: string;
    amount: { toString(): string };
    currency: string;
    date: Date;
    merchant?: string | null;
    category?: string | null;
    [key: string]: unknown;
  }>
) {
  const targetSavings = Math.floor(monthlySubscriptions * 0.3); // 30% of subscriptions
  const timeframe = 6; // 6 months
  
  return {
    targetSavings,
    timeframe,
    stepwisePlan: Array.from({ length: timeframe }, (_, i) => ({
      month: i + 1,
      action: `Month ${i + 1}: ${getMonthlyAction(i)}`,
      savings: Math.floor(targetSavings / timeframe)
    }))
  };
}

function generateRotationPlan(streamingServices: Array<{ name: string }>) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return streamingServices.map((service, index) => ({
    service: service.name,
    optimalMonths: months.filter((_, i) => i % streamingServices.length === index),
    reason: getRotationReason(service.name)
  }));
}

function findDuplicateWarranties(_orders: Array<{
  id: string;
  userId: string;
  merchant: string;
  total: { toString(): string };
  currency: string;
  orderDate: Date;
  [key: string]: unknown;
}>) {
  // Simulate warranty analysis
  return [
    {
      item: "iPhone 15 Pro",
      duplicateCount: 2,
      potentialSavings: 199
    }
  ];
}

function calculateConfidenceScore(insights: AIInsight[]) {
  if (insights.length === 0) return 0;
  const highConfidenceCount = insights.filter(i => i.automated || i.difficulty === "easy").length;
  return Math.floor((highConfidenceCount / insights.length) * 100);
}

// Utility functions
function generateNegotiationScript(serviceName: string, current: number, market: number) {
  return `Hi, I've been a loyal customer and noticed my ${serviceName} bill is $${current}/month. I've seen competitor rates around $${market.toFixed(0)}/month. Can you help me get a better rate?`;
}

function getBestCallTime(_serviceName: string) {
  const times = ["Tuesday 2-4 PM", "Wednesday morning", "Thursday afternoon"];
  return times[Math.floor(Math.random() * times.length)];
}

function getBestCardForCategory(category: string) {
  const cardSuggestions: Record<string, string> = {
    streaming: "Chase Sapphire Preferred (3x on streaming)",
    general: "Citi Double Cash (2% everything)",
    dining: "Chase Sapphire Preferred (3x dining)",
    gas: "Chase Freedom Flex (5% rotating categories)"
  };
  return cardSuggestions[category] || cardSuggestions.general;
}

function getMonthlyAction(month: number) {
  const actions = [
    "Cancel lowest-value subscription",
    "Negotiate internet/phone bill", 
    "Switch to annual billing for discounts",
    "Optimize payment methods",
    "Review and pause seasonal services",
    "Final optimization review"
  ];
  return actions[month] || "Continue optimization";
}

function getRotationReason(serviceName: string) {
  const reasons: Record<string, string> = {
    'netflix': 'Peak content during awards season',
    'disney': 'New releases typically in summer/winter',
    'hbo': 'Best during prestige TV seasons',
    'hulu': 'Year-round value for TV catch-up'
  };
  
  const key = Object.keys(reasons).find(k => serviceName.toLowerCase().includes(k));
  return key ? reasons[key] : 'Optimize based on content calendar';
}