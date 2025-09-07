// components/DashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import AddSubscriptionDialog, {
  EditSubscriptionDialog,
  type SubscriptionFormData,
} from "@/components/AddSubscriptionDialog";
import ImportCsv from "@/components/ImportCsv";
import SubscriptionTable from "@/components/SubscriptionTable";
import StatsCards from "@/components/StatsCards";
import UpgradeButton from "@/components/UpgradeButton";
import { Button } from "@/components/ui/Button";
import type { Subscription } from "@/lib/types";

export default function DashboardClient() {
  const { items, add, remove, update, importMany, totals } = useSubscriptions();
  const { isPro, canAddSubscription, maxSubscriptions, updateSubscriptionCount } = useSubscriptionLimit();
  const searchParams = useSearchParams();

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Check for success parameter
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessMessage(true);
      // Hide message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  // Update subscription count when items change
  useEffect(() => {
    updateSubscriptionCount(items.length);
  }, [items.length, updateSubscriptionCount]);

  function handleStartEdit(sub: Subscription) {
    setEditingSub(sub);
    setIsEditOpen(true);
  }

  async function handleUpdate(data: SubscriptionFormData & { id?: string }) {
    if (!data.id) return;
    await update(data.id, {
      name: data.name,
      price: data.price,
      period: data.period,
      nextBillingDate: data.nextBillingDate,
      category: data.category,
      notes: data.notes,
    });
    setIsEditOpen(false);
    setEditingSub(null);
  }

  function handleAdd(data: SubscriptionFormData) {
    if (!canAddSubscription) {
      alert(`You've reached the limit of ${maxSubscriptions} subscriptions. Upgrade to Pro for unlimited subscriptions!`);
      return;
    }
    add(data);
  }

  return (
    <>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-cyan-500/10 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400 text-lg">✓</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Welcome to Needix Pro!</h3>
              <p className="text-white/70">You now have unlimited subscriptions, smart reminders, and all Pro features.</p>
            </div>
          </div>
        </div>
      )}

      <StatsCards monthly={totals.monthly} />

      {/* Upgrade Banner for Free Users */}
      {!isPro && (
        <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                🚀 Unlock Full Potential with Needix Pro
              </h3>
              <p className="text-white/70">
                Get unlimited subscriptions, smart reminders, price alerts, and detailed analytics.
              </p>
              <div className="mt-2 text-sm text-white/60">
                Currently using {items.length} of {maxSubscriptions} free subscriptions
              </div>
            </div>
            <UpgradeButton 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold"
            />
          </div>
        </div>
      )}

      {/* Pro Status Banner */}
      {isPro && (
        <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-sm p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 text-lg">⭐</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                Needix Pro Active
              </h3>
              <p className="text-white/70">
                Unlimited subscriptions • Smart reminders • Price alerts • Analytics
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canAddSubscription ? (
          <AddSubscriptionDialog onAdd={handleAdd} />
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              disabled 
              className="opacity-50 cursor-not-allowed"
              title={`Upgrade to Pro for unlimited subscriptions`}
            >
              Add subscription (Limit reached)
            </Button>
            <UpgradeButton size="sm" variant="secondary">
              Upgrade for unlimited
            </UpgradeButton>
          </div>
        )}
        
        {isPro && <ImportCsv onImport={importMany} />}
        {!isPro && (
          <div className="flex items-center gap-2">
            <Button disabled className="opacity-50 cursor-not-allowed">
              Import CSV (Pro only)
            </Button>
          </div>
        )}
      </div>

      <SubscriptionTable
        items={items}
        onDelete={remove}
        onEdit={handleStartEdit}
      />

      {editingSub && (
        <EditSubscriptionDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          initial={{
            id: editingSub.id,
            name: editingSub.name,
            price: editingSub.price,
            period: editingSub.period,
            nextBillingDate: editingSub.nextBillingDate,
            category: editingSub.category,
            notes: editingSub.notes,
            currency: "USD",
          }}
          onUpdate={handleUpdate}
        />
      )}
    </>
  );
}