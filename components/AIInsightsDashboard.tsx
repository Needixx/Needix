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
}

interface InsightsSummary {
  totalMonthly: number;
  totalAnnual: number;
  subscriptionCount: number;
  topCategories: Array<{
    name: string;
    count: number;
    total: number;
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
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500/20 to-orange-500/20 border-red-500/40';
      case 'medium': return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40';
      case 'low': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/40';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-500/40';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple/20 to-cyan/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-white/60">Analyzing your subscriptions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple/20 to-cyan/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-white/60 mb-4">{error}</p>
          {error.includes('disabled') && (
            <button
              onClick={() => window.location.href = '/settings?tab=ai'}
              className="px-4 py-2 bg-gradient-to-r from-purple to-cyan text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
            >
              Enable AI Analysis
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const totalPotentialSavings = insights.insights.reduce((sum, insight) => sum + insight.potentialSavings, 0);

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple/20 to-cyan/20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              <p className="text-sm text-white/60">
                Last analyzed: {new Date(insights.lastAnalyzed).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            className="px-3 py-1 bg-white/10 border border-white/20 text-white text-sm rounded-lg hover:bg-white/20 transition-all"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{insights.summary.subscriptionCount}</div>
            <div className="text-xs text-white/60">Active Subscriptions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${insights.summary.totalMonthly.toFixed(0)}</div>
            <div className="text-xs text-white/60">Monthly Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${insights.summary.totalAnnual.toFixed(0)}</div>
            <div className="text-xs text-white/60">Annual Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${totalPotentialSavings.toFixed(0)}</div>
            <div className="text-xs text-white/60">Potential Savings</div>
          </div>
        </div>

        <p className="text-white/70 text-sm">{insights.summary.message}</p>
      </div>

      {/* Insights List */}
      {insights.insights.length > 0 ? (
        <div className="space-y-4">
          {insights.insights.map((insight, index) => (
            <div
              key={index}
              className={`bg-gradient-to-r ${getPriorityColor(insight.priority)} backdrop-blur-sm rounded-xl border p-5`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">{getPriorityIcon(insight.priority)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-semibold">{insight.title}</h4>
                    {insight.potentialSavings > 0 && (
                      <div className="text-green-400 font-medium text-sm">
                        💰 Save ${insight.potentialSavings.toFixed(0)}
                      </div>
                    )}
                  </div>
                  <p className="text-white/80 text-sm mb-3">{insight.description}</p>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-xs text-white/60 mb-1">💡 Recommended Action:</div>
                    <div className="text-white/90 text-sm">{insight.action}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-8 text-center">
          <div className="text-4xl mb-3">✨</div>
          <h4 className="text-white font-semibold mb-2">All Optimized!</h4>
          <p className="text-white/60">Your subscriptions look well-managed. Check back as you add more services.</p>
        </div>
      )}

      {/* Top Categories */}
      {insights.summary.topCategories.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            📊 Spending by Category
          </h4>
          <div className="space-y-3">
            {insights.summary.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple to-cyan rounded text-white text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <span className="text-white">{category.name}</span>
                  <span className="text-white/60 text-sm">({category.count} service{category.count !== 1 ? 's' : ''})</span>
                </div>
                <div className="text-white font-medium">${category.total.toFixed(2)}/mo</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}