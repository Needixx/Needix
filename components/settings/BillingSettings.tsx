// components/settings/BillingSettings.tsx

import type { BillingInfo } from "@/components/settings/types";
import { Button } from "@/components/ui/Button";

type BasicSubscription = {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: string;
  status?: string;
};

type BasicOrder = {
  id: string;
  name: string;
  total: number;
};

interface BillingSettingsProps {
  billing: BillingInfo;
  isPro: boolean;
  subscriptions: BasicSubscription[];
  orders: BasicOrder[];
}

export default function BillingSettings({ billing, isPro, orders }: BillingSettingsProps) {
  const handleUpgrade = () => {
    window.location.href = '/upgrade';
  };

  const handleManageBilling = () => {
    window.location.href = '/billing';
  };

  const usagePercentage = (billing.usageCount / billing.usageLimit) * 100;

  // Format renewal date
  const formatRenewalDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days until renewal
  const getDaysUntilRenewal = (dateString?: string) => {
    if (!dateString) return null;
    const renewalDate = new Date(dateString);
    const today = new Date();
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renewalDate = formatRenewalDate(billing.renewalDate);
  const daysUntil = getDaysUntilRenewal(billing.renewalDate);

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">💳 Billing & Usage</h2>
        <p className="text-white/60">Manage your subscription plan and monitor usage</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Current Plan</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPro 
                  ? "bg-gradient-to-r from-purple to-cyan text-white" 
                  : "bg-white/20 text-white/80"
              }`}>
                {isPro ? "🚀 Pro Plan" : "🆓 Free Plan"}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                billing.status === "active" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {!isPro ? (
              <Button onClick={handleUpgrade} className="bg-gradient-to-r from-purple to-cyan">
                Upgrade to Pro
              </Button>
            ) : (
              <>
                <Button onClick={handleManageBilling} variant="secondary">
                  Manage Billing
                </Button>
                {/* Renewal Reminder */}
                {renewalDate && isPro && (
                  <div className="text-right">
                    <div className="text-xs text-white/60">Next renewal:</div>
                    <div className={`text-sm font-medium ${
                      daysUntil !== null && daysUntil <= 7 
                        ? "text-yellow-400" 
                        : daysUntil !== null && daysUntil <= 3 
                          ? "text-red-400" 
                          : "text-white/80"
                    }`}>
                      {renewalDate}
                      {daysUntil !== null && daysUntil >= 0 && (
                        <span className="ml-1 text-xs text-white/60">
                          ({daysUntil === 0 ? "Today!" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{billing.usageCount}</div>
            <div className="text-sm text-white/60">Active Subscriptions</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{orders.length}</div>
            <div className="text-sm text-white/60">Total Orders</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">
              {isPro ? "Unlimited" : billing.usageLimit}
            </div>
            <div className="text-sm text-white/60">Subscription Limit</div>
          </div>
        </div>
      </div>

      {/* Usage Progress */}
      {!isPro && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">📊 Usage</h3>
            <span className="text-sm text-white/60">
              {billing.usageCount} / {billing.usageLimit} subscriptions
            </span>
          </div>

          <div className="mb-4">
            <div className="bg-white/20 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  usagePercentage >= 100 
                    ? "bg-red-500" 
                    : usagePercentage >= 80 
                      ? "bg-yellow-500" 
                      : "bg-gradient-to-r from-purple to-cyan"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {usagePercentage >= 100 ? (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-400">⚠️</span>
                <span className="font-medium text-red-400">Limit Reached</span>
              </div>
              <p className="text-sm text-red-300 mb-3">
                You've reached your subscription limit. Upgrade to Pro for unlimited subscriptions.
              </p>
              <Button onClick={handleUpgrade} variant="secondary" size="sm">
                Upgrade Now
              </Button>
            </div>
          ) : (
            <p className="text-sm text-white/60">
              You're using {Math.round(usagePercentage)}% of your subscription limit. 
              {billing.usageLimit - billing.usageCount} slots remaining.
            </p>
          )}
        </div>
      )}

      {/* Plan Comparison */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">📋 Plan Comparison</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className={`border rounded-xl p-6 ${
            !isPro ? "border-purple/40 bg-purple/10" : "border-white/20 bg-white/5"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">🆓 Free Plan</h4>
              {!isPro && <span className="text-xs bg-purple/20 text-purple-300 px-2 py-1 rounded">Current</span>}
            </div>
            <div className="text-2xl font-bold text-white mb-4">$0<span className="text-sm font-normal text-white/60">/month</span></div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Up to 2 subscriptions
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Basic notifications
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Expense tracking
              </li>
              <li className="flex items-center gap-2 text-white/40">
                <span className="text-red-400">✗</span> Unlimited subscriptions
              </li>
              <li className="flex items-center gap-2 text-white/40">
                <span className="text-red-400">✗</span> Advanced analytics
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className={`border rounded-xl p-6 relative ${
            isPro ? "border-cyan/40 bg-cyan/10" : "border-white/20 bg-white/5"
          }`}>
            {!isPro && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple to-cyan text-white text-xs font-medium px-3 py-1 rounded-full">
                  Recommended
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">🚀 Pro Plan</h4>
              {isPro && <span className="text-xs bg-cyan/20 text-cyan-300 px-2 py-1 rounded">Current</span>}
            </div>
            <div className="text-2xl font-bold text-white mb-4">$5<span className="text-sm font-normal text-white/60">/month</span></div>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Unlimited subscriptions
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Advanced notifications
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Detailed analytics
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Export data
              </li>
              <li className="flex items-center gap-2 text-white/80">
                <span className="text-green-400">✓</span> Priority support
              </li>
            </ul>
            {!isPro && (
              <Button 
                onClick={handleUpgrade} 
                className="w-full bg-gradient-to-r from-purple to-cyan"
              >
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}