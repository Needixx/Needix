// components/AIInsightsDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Insight {
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  potentialSavings: number;
  category: string;
}

interface InsightsSummary {
  totalMonthly: number;
  totalAnnual: number;
  subscriptionCount: number;
  orderCount: number;
  expenseCount: number;
  totalItemCount: number;
  totalOrderValue?: number;
  monthlySubscriptionTotal?: number;
  monthlyExpenseTotal?: number;
  topCategories?: Array<{
    name: string;
    count: number;
    total: number;
    types?: string[];
  }>;
  message: string;
}

interface AIInsightsData {
  insights: Insight[];
  summary: InsightsSummary;
  lastAnalyzed: string;
}

const getAISettings = () => {
  try {
    const stored = localStorage.getItem("needix_ai");
    return stored ? JSON.parse(stored) : { allowDataAccess: false };
  } catch {
    return { allowDataAccess: false };
  }
};

export default function AIInsightsDashboard() {
  const { isPro, isLoading: proCheckLoading } = useSubscriptionLimit();
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchInsights = async () => {
    // Wait for Pro check to complete
    if (proCheckLoading) {
      return;
    }

    // PRO CHECK FIRST
    if (!isPro) {
      console.log('[AI Insights] User is not Pro, showing upgrade message');
      setError("AI Insights is a Pro feature. Upgrade to access!");
      setLoading(false);
      return;
    }

    const aiSettings = getAISettings();
    
    if (!aiSettings.allowDataAccess) {
      console.log('[AI Insights] AI data access is disabled');
      setError("AI analysis is disabled. Enable it in Settings > AI & Privacy to see insights.");
      setLoading(false);
      return;
    }

    try {
      console.log('[AI Insights] Fetching insights data...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/insights');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }
      
      console.log('[AI Insights] Successfully loaded insights');
      setInsights(data);
    } catch (err) {
      console.error('[AI Insights] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      toast('Failed to load AI insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when Pro check is complete
    if (!proCheckLoading) {
      console.log('[AI Insights] Pro check complete, isPro:', isPro);
      fetchInsights();
    }
  }, [isPro, proCheckLoading]);

  // Show loading while checking Pro status
  if (proCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-white/60">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🤖</div>
          <p className="text-white/60">Analyzing your financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Insights</h3>
          <p className="text-white/70 mb-6">{error}</p>
          {error.includes('Pro feature') ? (
            <Link href="/pricing">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                Upgrade to Pro
              </Button>
            </Link>
          ) : error.includes('disabled') ? (
            <Link href="/dashboard/settings">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                Enable AI Analysis
              </Button>
            </Link>
          ) : (
            <Button onClick={fetchInsights} className="bg-gradient-to-r from-purple-500 to-pink-500">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-white/60">No insights data available</p>
          <Button onClick={fetchInsights} className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500">
            Load Insights
          </Button>
        </div>
      </div>
    );
  }

  const totalPotentialSavings = insights.insights.reduce((sum, insight) => sum + insight.potentialSavings, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400/30 bg-red-500/10';
      case 'medium': return 'border-orange-400/30 bg-orange-500/10';
      case 'low': return 'border-yellow-400/30 bg-yellow-500/10';
      default: return 'border-white/10 bg-white/5';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">🔴 High Priority</span>;
      case 'medium': return <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">🟡 Medium Priority</span>;
      case 'low': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">🟢 Low Priority</span>;
      default: return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'subscriptions': return '📺';
      case 'orders': return '📦';
      case 'expenses': return '💰';
      case 'budget': return '📊';
      default: return '💡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'subscriptions': return 'bg-purple-500/20 text-purple-300';
      case 'orders': return 'bg-cyan-500/20 text-cyan-300';
      case 'expenses': return 'bg-green-500/20 text-green-300';
      case 'budget': return 'bg-orange-500/20 text-orange-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Debug info - remove after confirming it works */}
      {process.env.NODE_ENV === 'development' && (
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-300">
          <strong>Debug:</strong> isPro={String(isPro)}, proCheckLoading={String(proCheckLoading)}
        </div>
      )}

      {/* Summary Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">🤖 AI Financial Analysis</h2>
            <p className="text-sm text-white/60">
              Last analyzed: {new Date(insights.lastAnalyzed).toLocaleString()}
            </p>
          </div>
          <button
            onClick={fetchInsights}
            className="px-3 py-1 bg-white/10 border border-white/20 text-white text-sm rounded-lg hover:bg-white/20 transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{insights.summary.totalItemCount || 0}</div>
            <div className="text-xs text-white/60">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-300">{insights.summary.subscriptionCount || 0}</div>
            <div className="text-xs text-white/60">Subscriptions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-300">{insights.summary.orderCount || 0}</div>
            <div className="text-xs text-white/60">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">{insights.summary.expenseCount || 0}</div>
            <div className="text-xs text-white/60">Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${(insights.summary.totalMonthly || 0).toFixed(0)}</div>
            <div className="text-xs text-white/60">Monthly Recurring</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${totalPotentialSavings.toFixed(0)}</div>
            <div className="text-xs text-white/60">Potential Savings</div>
          </div>
        </div>

        <p className="text-white/70 text-sm">{insights.summary.message || 'AI analysis complete'}</p>
      </div>

      {/* Breakdown by Type */}
      {(insights.summary.monthlySubscriptionTotal || insights.summary.monthlyExpenseTotal || insights.summary.totalOrderValue) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.summary.monthlySubscriptionTotal !== undefined && insights.summary.monthlySubscriptionTotal > 0 && (
            <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-300">Monthly Subscriptions</p>
                  <p className="text-2xl font-bold text-white">${insights.summary.monthlySubscriptionTotal.toFixed(0)}</p>
                </div>
                <div className="text-2xl">📺</div>
              </div>
            </div>
          )}
          
          {insights.summary.monthlyExpenseTotal !== undefined && insights.summary.monthlyExpenseTotal > 0 && (
            <div className="rounded-xl border border-green-400/20 bg-green-500/10 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-white">${insights.summary.monthlyExpenseTotal.toFixed(0)}</p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </div>
          )}

          {insights.summary.totalOrderValue !== undefined && insights.summary.totalOrderValue > 0 && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-300">Total Order Value</p>
                  <p className="text-2xl font-bold text-white">${insights.summary.totalOrderValue.toFixed(0)}</p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Categories */}
      {insights.summary.topCategories && insights.summary.topCategories.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Top Spending Categories</h3>
          <div className="space-y-3">
            {insights.summary.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'}</span>
                  <div>
                    <span className="text-white font-medium">{category.name}</span>
                    {category.types && category.types.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {category.types.map(type => (
                          <span key={type} className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(type)}`}>
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">${category.total.toFixed(0)}</div>
                  <div className="text-xs text-white/60">{category.count} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights List */}
      {insights.insights.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">💡 Personalized Recommendations</h3>
          
          {insights.insights.map((insight, index) => (
            <div key={index} className={`rounded-2xl border backdrop-blur-sm p-6 ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{getCategoryIcon(insight.category)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{insight.title}</h4>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    <p className="text-white/70 text-sm mb-3">{insight.description}</p>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-sm text-white/80">
                        <span className="font-medium">💡 Action:</span> {insight.action}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-green-400">${insight.potentialSavings.toFixed(0)}</div>
                  <div className="text-xs text-white/60">potential savings</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-white mb-2">You're Doing Great!</h3>
          <p className="text-white/60">
            No optimization opportunities found at the moment. Your finances are looking good!
          </p>
        </div>
      )}
    </div>
  );
}