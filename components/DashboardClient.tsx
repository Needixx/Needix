// components/DashboardClient.tsx
"use client";

import { useSubscriptions } from "@/lib/useSubscriptions";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import AddSubscriptionDialog from "@/components/AddSubscriptionDialog";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function DashboardClient() {
  const { items: subscriptions, remove: deleteSubscription } = useSubscriptions();
  const { isPro, canAddSubscription } = useSubscriptionLimit();
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Add Subscription Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Subscriptions</h2>
        <Button
          onClick={() => setShowAddDialog(true)}
          disabled={!canAddSubscription}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          + Add Subscription
        </Button>
      </div>

      {/* Limit Warning */}
      {!isPro && !canAddSubscription && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            You&apos;ve reached the free plan limit. Upgrade to Pro to add unlimited subscriptions.
          </p>
        </div>
      )}

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
          <p className="text-white/60 mb-6">
            Start tracking your subscriptions to take control of your spending.
          </p>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            Add Your First Subscription
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{subscription.name}</h3>
                <button
                  onClick={() => deleteSubscription(subscription.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Delete subscription"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Price:</span>
                  <span className="font-medium">${subscription.price}/{subscription.period}</span>
                </div>
                
                {subscription.nextBillingDate && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Next billing:</span>
                    <span>{new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                {subscription.category && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Category:</span>
                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                      {subscription.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subscription Dialog */}
      {showAddDialog && (
        <AddSubscriptionDialog 
          onClose={() => setShowAddDialog(false)} 
        />
      )}
    </div>
  );
}