// components/AIInsightsDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

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
  topCategories: Array<{
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

// Check if AI analysis is enabled
const getAISettings = () => {
  try {
    const stored = localStorage.getItem("needix_ai");
    return stored ? JSON.parse(stored) : { allowDataAccess: false };
  } catch {
    return { allowDataAccess: false };
  }
};

export default function AIInsightsDashboard() {
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchInsights = async () => {
    const aiSettings = getAISettings();
    
    if (!aiSettings.allowDataAccess) {
      setError("AI analysis is disabled. Enable it in Settings > AI & Privacy to see insights.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/insights');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch insights');
      }
      
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🤖</div>
            <p className="text-white/70">Analyzing your financial data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/15 to-pink-500/10 backdrop-blur-sm p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-white mb-2">AI Analysis Unavailable</h3>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={fetchInsights}
            className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-white rounded-lg hover:bg-red-500/30 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const totalPotentialSavings = insights.insights.reduce((sum, insight) => sum + insight.potentialSavings, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400/30 bg-red-500/10';
      case 'medium': return 'border-yellow-400/30 bg-yellow-500/10';
      case 'low': return 'border-green-400/30 bg-green-500/10';
      default: return 'border-white/20 bg-white/5';
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
            <div className="text-2xl font-bold text-white">{insights.summary.totalItemCount}</div>
            <div className="text-xs text-white/60">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-300">{insights.summary.subscriptionCount}</div>
            <div className="text-xs text-white/60">Subscriptions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-300">{insights.summary.orderCount}</div>
            <div className="text-xs text-white/60">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">{insights.summary.expenseCount}</div>
            <div className="text-xs text-white/60">Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${insights.summary.totalMonthly.toFixed(0)}</div>
            <div className="text-xs text-white/60">Monthly Recurring</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${totalPotentialSavings.toFixed(0)}</div>
            <div className="text-xs text-white/60">Potential Savings</div>
          </div>
        </div>

        <p className="text-white/70 text-sm">{insights.summary.message}</p>
      </div>

      {/* Breakdown by Type */}
      {(insights.summary.monthlySubscriptionTotal || insights.summary.monthlyExpenseTotal || insights.summary.totalOrderValue) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.summary.monthlySubscriptionTotal && (
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
          
          {insights.summary.monthlyExpenseTotal && (
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

          {insights.summary.totalOrderValue && (
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
      {insights.summary.topCategories.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Top Spending Categories</h3>
          <div className="space-y-3">
            {insights.summary.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍'}</span>
                  <div>
                    <span className="text-white font-medium">{category.name}</span>
                    {category.types && (
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
          <h3 className="text-lg font-semibold text-white">💡 Optimization Opportunities</h3>
          {insights.insights.map((insight, index) => (
            <div
              key={index}
              className={`rounded-2xl border backdrop-blur-sm p-6 ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getCategoryIcon(insight.category)}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{insight.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        insight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {insight.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(insight.category)}`}>
                        {insight.category.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                {insight.potentialSavings > 0 && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      ${insight.potentialSavings.toFixed(0)}
                    </div>
                    <div className="text-xs text-white/60">potential savings</div>
                  </div>
                )}
              </div>
              
              <p className="text-white/80 mb-3">{insight.description}</p>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-sm text-white/90">
                  <span className="font-medium">💡 Recommended Action:</span> {insight.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-semibold text-white mb-2">Great Financial Health!</h3>
          <p className="text-white/70">
            No optimization opportunities found. Your spending patterns look well-balanced.
          </p>
        </div>
      )}
    </div>
  );
}