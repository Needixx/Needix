// components/AnalyticsDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface AnalyticsData {
  totalCustomers: number;
  totalActiveSubscriptions: number;
  totalCancelledSubscriptions: number;
  mrr: number;
  conversionRate: number;
  churnRate: number;
  recentSubscriptions: number;
  avgRevenuePerUser: number;
}

export default function AnalyticsDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchAnalytics();
    }
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/analytics');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error: unknown) {
      console.error('Failed to fetch analytics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Analytics Dashboard</h1>
          <p className="text-white/70">Please sign in to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Analytics</h3>
            <p className="text-white/70">{error}</p>
            {error === 'Unauthorized' && (
              <p className="text-white/50 mt-2 text-sm">
                You need admin access to view analytics.
              </p>
            )}
            <button 
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/70">No analytics data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Needix Analytics
          </h1>
          <button 
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
          >
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Total Customers"
            value={analytics.totalCustomers}
            format="number"
            subtitle="All-time signups"
          />
          <MetricCard 
            title="Active Subscriptions"
            value={analytics.totalActiveSubscriptions}
            format="number"
            subtitle="Currently paying"
          />
          <MetricCard 
            title="Monthly Recurring Revenue"
            value={analytics.mrr}
            format="currency"
            subtitle="Active subscriptions only"
          />
          <MetricCard 
            title="Conversion Rate"
            value={analytics.conversionRate}
            format="percentage"
            subtitle="Customers who subscribe"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Churn Rate"
            value={analytics.churnRate}
            format="percentage"
            subtitle="Cancelled subscriptions"
            isNegative={true}
          />
          <MetricCard 
            title="New Subscriptions (30d)"
            value={analytics.recentSubscriptions}
            format="number"
            subtitle="Last 30 days"
          />
          <MetricCard 
            title="Average Revenue Per User"
            value={analytics.avgRevenuePerUser}
            format="currency"
            subtitle="Monthly per subscriber"
          />
          <MetricCard 
            title="Total Cancellations"
            value={analytics.totalCancelledSubscriptions}
            format="number"
            subtitle="All-time cancellations"
            isNegative={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Business Health</h3>
            <div className="space-y-4">
              <HealthIndicator 
                label="Conversion Rate"
                value={analytics.conversionRate}
                threshold={5} // 5% is decent for SaaS
                format="percentage"
              />
              <HealthIndicator 
                label="Churn Rate"
                value={analytics.churnRate}
                threshold={10} // Under 10% is good
                format="percentage"
                inverse={true}
              />
              <HealthIndicator 
                label="MRR Growth"
                value={analytics.recentSubscriptions * 4.99}
                threshold={50} // $50+ new MRR per month
                format="currency"
              />
            </div>
          </div>
          
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Customer Acquisition:</span>
                <span className="text-white">{analytics.totalCustomers} total</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Subscription Success:</span>
                <span className="text-white">{analytics.totalActiveSubscriptions} active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Monthly Revenue:</span>
                <span className="text-green-400">${analytics.mrr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Annual Revenue Run Rate:</span>
                <span className="text-green-400">${(analytics.mrr * 12).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  format,
  subtitle,
  isNegative = false
}: { 
  title: string; 
  value: number; 
  format: 'number' | 'currency' | 'percentage';
  subtitle?: string;
  isNegative?: boolean;
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toFixed(2)}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toString();
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
      <h3 className="text-sm text-white/70 mb-2">{title}</h3>
      <div className={`text-2xl font-bold ${isNegative ? 'text-red-400' : 'text-white'}`}>
        {formatValue(value)}
      </div>
      {subtitle && (
        <p className="text-xs text-white/50 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

function HealthIndicator({
  label,
  value,
  threshold,
  format,
  inverse = false
}: {
  label: string;
  value: number;
  threshold: number;
  format: 'percentage' | 'currency';
  inverse?: boolean;
}) {
  const isHealthy = inverse ? value < threshold : value >= threshold;
  const formatValue = (val: number) => {
    return format === 'currency' ? `$${val.toFixed(2)}` : `${val.toFixed(1)}%`;
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
          {formatValue(value)}
        </span>
        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
      </div>
    </div>
  );
}