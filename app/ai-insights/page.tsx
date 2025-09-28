// app/ai-insights/page.tsx
"use client";

import { useState } from "react";
import EnhancedAIInsights from "@/components/EnhancedAIInsights";
import AIInsightsDashboard from "@/components/AIInsightsDashboard";

export default function AIInsightsPage() {
  const [viewMode, setViewMode] = useState<'enhanced' | 'standard'>('enhanced');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🤖 AI Financial Insights</h1>
              <p className="text-white/60">Advanced AI analysis of your financial patterns and optimization opportunities</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-white/5 rounded-xl border border-white/10 p-1">
              <button
                onClick={() => setViewMode('enhanced')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'enhanced'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                🚀 Enhanced AI
              </button>
              <button
                onClick={() => setViewMode('standard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'standard'
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                📊 Standard
              </button>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm">💰</span>
                </div>
                <span className="font-medium text-white">Smart Savings</span>
              </div>
              <p className="text-white/60 text-sm">AI identifies bundle opportunities, negotiation targets, and optimal payment strategies</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🔄</span>
                </div>
                <span className="font-medium text-white">Auto Optimization</span>
              </div>
              <p className="text-white/60 text-sm">Automated rotation plans, payment optimization, and spending alerts</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-lg flex items-center justify-center">
                  <span className="text-sm">🎯</span>
                </div>
                <span className="font-medium text-white">Goal-Based Plans</span>
              </div>
              <p className="text-white/60 text-sm">Personalized savings goals with step-by-step monthly action plans</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {viewMode === 'enhanced' ? (
            <EnhancedAIInsights />
          ) : (
            <AIInsightsDashboard />
          )}
        </div>

        {/* AI Capabilities Footer */}
        <div className="mt-12 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
          <h3 className="text-xl font-semibold text-white mb-6">🧠 AI Analysis Capabilities</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Subscription Intelligence */}
            <div className="space-y-3">
              <h4 className="font-medium text-purple-300">📱 Subscription Intelligence</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>• Bundle arbitrage detection (Apple One, Prime, etc.)</li>
                <li>• Smart streaming rotation strategies</li>
                <li>• Trial re-eligibility & winback offers</li>
                <li>• Prorated refund timing optimization</li>
              </ul>
            </div>

            {/* Commerce Optimization */}
            <div className="space-y-3">
              <h4 className="font-medium text-cyan-300">🛒 Commerce Optimization</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>• ISP/phone/insurance price negotiation</li>
                <li>• Late fee risk prevention</li>
                <li>• Warranty/AppleCare overlap detection</li>
                <li>• Credit card cashback optimization</li>
                <li>• Price-drop protection claims</li>
              </ul>
            </div>

            {/* Behavioral Analysis */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-300">🧠 Behavioral Analysis</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>• Cost-per-use calculations</li>
                <li>• Category spending growth alerts</li>
                <li>• Want vs. need classification</li>
                <li>• Goal-based savings plans</li>
                <li>• Seasonal service optimization</li>
              </ul>
            </div>

            {/* Data Quality */}
            <div className="space-y-3">
              <h4 className="font-medium text-yellow-300">📊 Data Quality</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>• Unknown recurring pattern detection</li>
                <li>• Merchant normalization</li>
                <li>• Receipt parsing gap identification</li>
                <li>• Broken payment monitoring</li>
              </ul>
            </div>

            {/* Market Intelligence */}
            <div className="space-y-3">
              <h4 className="font-medium text-orange-300">📈 Market Intelligence</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>• Competitor price analysis</li>
                <li>• Bundle vs. individual comparisons</li>
                <li>• Student/family discount eligibility</li>
                <li>• Market rate benchmarking</li>
              </ul>
            </div>

            {/* Security & Safety */}
            <div className="space-y-3">
              <h4 className="font-medium text-red-300">🔒 Security & Safety</h4>
              <ul className="space-y-1 text-sm text-white/70">
                <li>• Suspicious transaction detection</li>
                <li>• Duplicate service identification</li>
                <li>• Payment failure prevention</li>
                <li>• Privacy-first analysis</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔐</span>
              <span className="font-medium text-white">Privacy & Security</span>
            </div>
            <p className="text-white/70 text-sm">
              All AI analysis is performed with your explicit consent and can be disabled at any time in Settings → AI & Privacy. 
              Your financial data is processed securely and never shared with third parties. Analysis occurs locally where possible, 
              with encrypted transmission for cloud-based insights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}