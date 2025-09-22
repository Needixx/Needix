// components/DashboardClient.tsx
"use client";

import { useSubscriptions } from "@/lib/useSubscriptions";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import AddSubscriptionDialog, {
  EditSubscriptionDialog,
  type SubscriptionFormData,
} from "@/components/AddSubscriptionDialog";
import SubscriptionTable from "@/components/SubscriptionTable";
import UpgradeButton from "@/components/UpgradeButton";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { fmtCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { Subscription } from "@/lib/types";

export default function DashboardClient() {
  const {
    items: subscriptions,
    remove: deleteSubscription,
    update,
    add,
    totals,
  } = useSubscriptions();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const canAddSubscription = isPro || subscriptions.length < 2;
  const subscriptionLimit = isPro ? Infinity : 2;

  const handleEdit = (sub: Subscription) => {
    setEditing(sub);
  };

  const handleUpdate = (data: SubscriptionFormData & { id?: string }) => {
    if (!data.id) return;
    void update(data.id, {
      name: data.name,
      price: data.price,
      period: data.period,
      nextBillingDate: data.nextBillingDate,
      category: data.category,
      notes: data.notes,
      link: data.link,
      isEssential: data.isEssential,
    });
    setEditing(null);
    toast(`Updated ${data.name}`, "success");
  };

  const handleDelete = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub && confirm(`Delete ${sub.name}?`)) {
      void deleteSubscription(id);
      toast(`Deleted ${sub.name}`, "success");
    }
  };

  const handleAdd = (data: SubscriptionFormData) => {
    void add(data);
    setShowAddDialog(false);
    toast(`Added ${data.name}`, "success");
  };

  return (
    <div className="space-y-6">
      {!isPro && (
        <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                📺 Free Plan - Subscription Tracking
              </h3>
              <p className="text-white/80 mb-2">Track up to 2 subscriptions with basic features.</p>
              <div className="text-sm text-white/60 mb-3">
                Currently using{" "}
                <span className="font-semibold text-purple-300">
                  {subscriptions.length} of {subscriptionLimit}
                </span>{" "}
                free subscription slots
              </div>
              <div className="text-sm text-purple-300">
                ⭐ Upgrade for unlimited subscriptions, price alerts &amp; more!
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <UpgradeButton className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold transform hover:scale-105 transition-all" />
              <div className="text-xs text-center text-white/50">30-day money back guarantee</div>
            </div>
          </div>
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Monthly Total</div>
            <div className="text-2xl font-bold text-white">{fmtCurrency(totals.monthly)}</div>
            <div className="text-xs text-white/60">Recurring subscriptions</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Active Count</div>
            <div className="text-2xl font-bold text-white">{subscriptions.length}</div>
            <div className="text-xs text-white/60">Tracked subscriptions</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Annual Total</div>
            <div className="text-2xl font-bold text-white">{fmtCurrency(totals.monthly * 12)}</div>
            <div className="text-xs text-white/60">Yearly spending</div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Subscriptions</h2>
        {canAddSubscription ? (
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            + Add Subscription
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              disabled
              className="opacity-50 cursor-not-allowed bg-gray-600"
              title="Free plan limit reached - upgrade to Pro for unlimited subscriptions"
            >
              Add Subscription (Limit Reached)
            </Button>
            <UpgradeButton variant="secondary">Upgrade to Pro</UpgradeButton>
          </div>
        )}
      </div>

      {!isPro && !canAddSubscription && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            You&apos;ve reached the free plan limit. Upgrade to Pro to add unlimited subscriptions.
          </p>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
          <p className="text-white/60 mb-6">
            Start tracking your subscriptions to take control of your spending.
          </p>
          {canAddSubscription && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Add Your First Subscription
            </Button>
          )}
        </div>
      ) : (
        <SubscriptionTable items={subscriptions} onDelete={handleDelete} onEdit={handleEdit} />
      )}

      {showAddDialog && (
        <AddSubscriptionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={handleAdd}
        />
      )}

      {editing && (
        <EditSubscriptionDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          initial={{
            id: editing.id,
            name: editing.name,
            price: editing.price,
            period: editing.period,
            nextBillingDate: editing.nextBillingDate,
            category: editing.category,
            notes: editing.notes,
            link: editing.link,
            isEssential: editing.isEssential,
            currency: "USD",
          }}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
