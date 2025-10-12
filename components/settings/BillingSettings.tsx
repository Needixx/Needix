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
              <Button onClick={handleUpgrade} variant="primary" size="sm">
                🚀 Upgrade to Pro
              </Button>
            ) : (
              <Button onClick={handleManageBilling} variant="secondary" size="sm">
                Manage Billing
              </Button>
            )}
          </div>
        </div>

        {/* Usage Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">Monthly Usage</span>
            <span className="text-sm text-white/60">
              {billing.usageCount} / {billing.usageLimit === 999 ? "Unlimited" : billing.usageLimit}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                usagePercentage >= 90 
                  ? "bg-gradient-to-r from-red-500 to-red-400" 
                  : usagePercentage >= 70 
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-400" 
                    : "bg-gradient-to-r from-green-500 to-green-400"
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {usagePercentage >= 90 && !isPro && (
            <p className="text-xs text-red-400 mt-2">
              ⚠️ You're approaching your usage limit. Consider upgrading to Pro for unlimited access.
            </p>
          )}
        </div>

        {/* Renewal Info */}
        {isPro && billing.renewalDate && (
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">Next Billing Date</h4>
                <p className="text-sm text-white/60">
                  {renewalDate}
                  {daysUntil !== null && (
                    <span className="ml-2">
                      ({daysUntil > 0 ? `in ${daysUntil} days` : daysUntil === 0 ? "Today" : `${Math.abs(daysUntil)} days ago`})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-2xl">📅</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}