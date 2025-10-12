// app/dashboard/subscriptions/page.tsx
"use client";

import { useState } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import AddSubscriptionDialog, { type SubscriptionFormData } from "@/components/AddSubscriptionDialog";
import EditSubscriptionDialog from "@/components/EditSubscriptionDialog";
import SubscriptionTable from "@/components/SubscriptionTable";
import UpgradeButton from "@/components/UpgradeButton";
import { Button } from "@/components/ui/Button";
import { fmtCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { Subscription } from "@/lib/types";

function StatCard({
  title,
  value,
  subtitle,
  gradient,
}: {
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-sm p-6`}
    >
      <div className="text-sm font-medium text-white/70">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{subtitle}</div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { items, remove, update, add, totals } = useSubscriptions();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);

  const canAddSubscription = isPro || items.length < 2;
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
    const sub = items.find((s) => s.id === id);
    if (sub && confirm(`Delete ${sub.name}?`)) {
      void remove(id);
      toast(`Deleted ${sub.name}`, "success");
    }
  };

  const handleAdd = (data: SubscriptionFormData) => {
    void add(data);
    setShowAddDialog(false);
    toast(`Added ${data.name}`, "success");
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-fuchsia-500/15 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-fuchsia-300 bg-clip-text text-transparent mb-2">
              📺 Your Subscriptions
            </h1>
            <p className="text-white/70">
              Track and manage all your recurring payments in one place
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30">
                {items.length} Active
              </span>
              <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm border border-pink-500/30">
                {fmtCurrency(totals.monthly)}/month
              </span>
            </div>
          </div>
        </div>

        {/* Upgrade Banner for Free Users */}
        {!isPro && (
          <div className="mb-6 rounded-xl border border-purple-400/20 bg-gradient-to-r from-purple-400/8 to-pink-400/8 backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-purple-300 mb-2">
                  Free Plan
                </h3>
                <p className="text-white/70 mb-2">Track up to 2 subscriptions with basic features.</p>
                <div className="text-sm text-white/60">
                  Currently using{" "}
                  <span className="font-semibold text-purple-300">
                    {items.length} of {subscriptionLimit}
                  </span>{" "}
                  free subscription slots
                </div>
              </div>
              <UpgradeButton className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Upgrade to Pro
              </UpgradeButton>
            </div>
          </div>
        )}

        {/* Stats Display */}
        {items.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Monthly Total"
              value={fmtCurrency(totals.monthly)}
              subtitle="Recurring payments"
              gradient="from-purple-500/20 to-pink-500/10"
            />
            <StatCard
              title="Active Count"
              value={items.length.toString()}
              subtitle="Tracked subscriptions"
              gradient="from-pink-500/20 to-rose-500/10"
            />
            <StatCard
              title="Average Cost"
              value={items.length > 0 ? fmtCurrency(totals.monthly / items.length) : fmtCurrency(0)}
              subtitle="Per subscription"
              gradient="from-green-400/15 to-emerald-400/10"
            />
            <StatCard
              title="Annual Total"
              value={fmtCurrency(totals.monthly * 12)}
              subtitle="Yearly spending"
              gradient="from-orange-400/15 to-yellow-400/10"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          {canAddSubscription ? (
            <button
              onClick={() => setShowAddDialog(true)}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              + Add Subscription
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                Add Subscription (Limit Reached)
              </Button>
              <UpgradeButton variant="secondary">Upgrade to Pro</UpgradeButton>
            </div>
          )}
        </div>

        {/* Subscriptions Table */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
          <SubscriptionTable items={items} onDelete={handleDelete} onEdit={handleEdit} />
        </div>

        {/* Add Subscription Dialog */}
        {showAddDialog && (
          <AddSubscriptionDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onAdd={handleAdd}
          />
        )}

        {/* Edit Subscription Dialog */}
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
    </div>
  );
}