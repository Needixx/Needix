// components/EnhancedAIInsights.tsx
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

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
  additionalData?: Record<string, any>;
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

interface EnhancedAIData {
  insights: AIInsight[];
  subscriptionOptimization: SubscriptionOptimization;
  commerceOptimization: CommerceOptimization;
  behavioralInsights: BehavioralInsights;
  summary: {
    totalPotentialSavings: number;
    quickWinSavings: number;
    automatedSavings: number;
    confidenceScore: number;
  };
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

export default function EnhancedAIInsights() {
  const [aiData, setAiData] = useState<EnhancedAIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'commerce' | 'behavioral'>('overview');
  const toast = useToast();

  const fetchEnhancedInsights = async () => {
    const aiSettings = getAISettings();
    
    if (!aiSettings.allowDataAccess) {
      setError("AI analysis is disabled. Enable it in Settings > AI & Privacy to see insights.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai/enhanced-insights');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch enhanced insights');
      }
      
      setAiData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnhancedInsights();
  }, []);

  const handleApplyRecommendation = async (insightId: string) => {
    try {
      const response = await fetch('/api/ai/apply-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insightId }),
      });
      
      if (response.ok) {
        toast('Recommendation applied successfully!', 'success');
        fetchEnhancedInsights(); // Refresh data
      } else {
        throw new Error('Failed to apply recommendation');
      }
    } catch (err) {
      toast('Failed to apply recommendation', 'error');
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'subscriptions': return '📱';
      case 'commerce': return '🛒';
      case 'behavioral': return '🧠';
      case 'security': return '🔒';
      case 'budget': return '💰';
      case 'optimization': return '⚡';
      default: return '💡';
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm p-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🤖</div>
            <p className="text-white/70">AI is analyzing your financial patterns...</p>
            <p className="text-white/50 text-sm mt-2">This may take a few seconds</p>
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
            onClick={fetchEnhancedInsights}
            className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-white rounded-lg hover:bg-red-500/30 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!aiData) return null;

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">🤖 Enhanced AI Insights</h2>
            <p className="text-white/60">Advanced analysis with personalized recommendations</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">${aiData.summary.totalPotentialSavings.toFixed(0)}</div>
            <div className="text-sm text-white/60">Total Potential Savings</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xl font-bold text-green-400">${aiData.summary.quickWinSavings.toFixed(0)}</div>
            <div className="text-xs text-white/60">Quick Wins</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xl font-bold text-blue-400">${aiData.summary.automatedSavings.toFixed(0)}</div>
            <div className="text-xs text-white/60">Automated</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xl font-bold text-purple-400">{aiData.summary.confidenceScore}%</div>
            <div className="text-xs text-white/60">Confidence</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
            <div className="text-xl font-bold text-cyan-400">{aiData.insights.length}</div>
            <div className="text-xs text-white/60">Insights</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-1 bg-white/5 rounded-xl border border-white/10">
        {[
          { key: 'overview', label: '📊 Overview', icon: '📊' },
          { key: 'subscriptions', label: '📱 Subscriptions', icon: '📱' },
          { key: 'commerce', label: '🛒 Commerce', icon: '🛒' },
          { key: 'behavioral', label: '🧠 Behavioral', icon: '🧠' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">High-Priority Insights</h3>
          {aiData.insights.filter(i => i.priority === 'high').map(insight => (
            <div key={insight.id} className="rounded-xl border border-red-400/30 bg-red-500/10 backdrop-blur-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getPriorityIcon(insight.priority)}</div>
                  <div>
                    <h4 className="font-semibold text-white">{insight.title}</h4>
                    <p className="text-white/70 text-sm">{insight.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-400">${insight.potentialSavings.toFixed(0)}</div>
                  <div className="text-xs text-white/60">potential savings</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/80">{insight.action}</div>
                {insight.automated ? (
                  <button
                    onClick={() => handleApplyRecommendation(insight.id)}
                    className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-500/30 transition-all"
                  >
                    Apply Automatically
                  </button>
                ) : (
                  <div className="text-xs text-white/50">Manual action required</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Bundle Opportunities */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📦 Bundle Opportunities</h3>
            <div className="space-y-4">
              {aiData.subscriptionOptimization.bundleOpportunities.map((bundle, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white">{bundle.suggestedBundle}</h4>
                    <span className="text-green-400 font-bold">${bundle.monthlySavings}/mo</span>
                  </div>
                  <p className="text-white/70 text-sm mb-2">
                    Bundle: {bundle.currentServices.join(', ')}
                  </p>
                  <div className="text-xs text-white/50">Provider: {bundle.provider}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rotation Strategy */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🔄 Smart Rotation Plan</h3>
            <div className="space-y-3">
              {aiData.subscriptionOptimization.rotationPlan.map((rotation, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">{rotation.service}</span>
                      <div className="text-sm text-white/70">{rotation.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-cyan-400">
                        Active: {rotation.optimalMonths.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trial Re-eligibility */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🎯 Trial & Discount Opportunities</h3>
            <div className="space-y-3">
              {aiData.subscriptionOptimization.trialOpportunities.map((trial, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">{trial.service}</span>
                      <div className="text-sm text-white/70">Last used: {trial.lastUsed}</div>
                    </div>
                    <div className="text-right">
                      {trial.discountAvailable && (
                        <div className="text-green-400 font-medium">{trial.savingsPercent}% off available</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'commerce' && (
        <div className="space-y-6">
          {/* Negotiation Targets */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">💬 Negotiation Opportunities</h3>
            <div className="space-y-4">
              {aiData.commerceOptimization.negotiationTargets.map((target, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-white">{target.service}</h4>
                      <div className="text-sm text-white/70">
                        Current: ${target.currentPrice}/mo | Market avg: ${target.marketAverage}/mo
                      </div>
                    </div>
                    <div className="text-green-400 font-bold">
                      Save ${(target.currentPrice - target.marketAverage).toFixed(0)}/mo
                    </div>
                  </div>
                  <div className="bg-white/5 p-3 rounded border border-white/10 mb-2">
                    <div className="text-xs text-white/60 mb-1">Negotiation Script:</div>
                    <div className="text-sm text-white/80">{target.scriptTemplate}</div>
                  </div>
                  <div className="text-xs text-cyan-400">Best time to call: {target.bestTimeToCall}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Optimization */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">💳 Payment Optimization</h3>
            <div className="space-y-3">
              {aiData.commerceOptimization.paymentOptimization.map((optimization, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">{optimization.subscription}</span>
                      <div className="text-sm text-white/70">
                        Switch from {optimization.currentCard} to {optimization.suggestedCard}
                      </div>
                    </div>
                    <div className="text-green-400 font-medium">
                      +${optimization.additionalCashback.toFixed(2)}/mo cashback
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Duplicate Warranties */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🛡️ Warranty Optimization</h3>
            <div className="space-y-3">
              {aiData.commerceOptimization.duplicateWarranties.map((warranty, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">{warranty.item}</span>
                      <div className="text-sm text-white/70">
                        {warranty.duplicateCount} overlapping warranties found
                      </div>
                    </div>
                    <div className="text-green-400 font-medium">
                      Save ${warranty.potentialSavings.toFixed(0)}/year
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'behavioral' && (
        <div className="space-y-6">
          {/* Cost Per Use Analysis */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📊 Cost Per Use Analysis</h3>
            <div className="space-y-3">
              {aiData.behavioralInsights.costPerUse.map((item, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">{item.service}</span>
                    <span className="text-white font-bold">${item.costPerUse.toFixed(2)}/use</span>
                  </div>
                  <div className="text-sm text-white/70 mb-1">
                    ${item.totalCost}/mo ÷ {item.usageCount} uses
                  </div>
                  <div className="text-sm text-yellow-400">{item.recommendation}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Growth Tracking */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">📈 Spending Growth Alerts</h3>
            <div className="space-y-3">
              {aiData.behavioralInsights.categoryGrowth.map((growth, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">{growth.category}</span>
                    <span className={`font-bold ${growth.monthOverMonthGrowth > growth.threshold ? 'text-red-400' : 'text-green-400'}`}>
                      {growth.monthOverMonthGrowth > 0 ? '+' : ''}{growth.monthOverMonthGrowth.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-sm text-white/70">{growth.action}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Goal-Based Savings Plan */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🎯 Goal-Based Savings Plan</h3>
            <div className="mb-4">
              <div className="text-white/70 text-sm">
                Target: ${aiData.behavioralInsights.goalBasedPlan.targetSavings} over {aiData.behavioralInsights.goalBasedPlan.timeframe} months
              </div>
            </div>
            <div className="space-y-3">
              {aiData.behavioralInsights.goalBasedPlan.stepwisePlan.map((step, idx) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">Month {step.month}</span>
                      <div className="text-sm text-white/70">{step.action}</div>
                    </div>
                    <span className="text-green-400 font-medium">${step.savings}/mo</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center text-white/50 text-xs">
        Last analyzed: {new Date(aiData.lastAnalyzed).toLocaleString()}
      </div>
    </div>
  );
}