// app/dashboard/ai-insights/page.tsx
"use client";

import AIInsightsDashboard from "@/components/AIInsightsDashboard";

export default function AIInsightsPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent mb-2">
              🤖 AI Financial Insights
            </h1>
            <p className="text-white/70">
              Get personalized recommendations to optimize your subscriptions, orders, expenses, and overall financial health
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30">
                📺 Subscriptions
              </span>
              <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm border border-cyan-500/30">
                📦 Orders
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30">
                💰 Expenses
              </span>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm border border-orange-500/30">
                📊 Budget Analysis
              </span>
            </div>
          </div>
        </div>

        {/* AI Insights Dashboard */}
        <AIInsightsDashboard />
      </div>
    </div>
  );
}