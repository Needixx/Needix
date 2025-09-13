// components/DashboardClient.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
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
import { useReminders } from "@/lib/useReminders";

function DashboardContent() {
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

  // Reminders/notifications hook
  const { settings, setSettings, permission, requestPermission, sendTest } = useReminders(items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      alert(`Free plan is limited to ${maxSubscriptions} subscriptions. Upgrade to Pro for unlimited tracking!`);
      return;
    }
    add(data);
  }

  // Derived counts
  const activeCount = items.length;
  const renewalsNext30 = (() => {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return items.reduce((count, s) => {
      if (!s.nextBillingDate) return count;
      // Parse as local midnight to avoid TZ issues
      const d = new Date(`${s.nextBillingDate}T00:00:00`);
      if (d >= now && d <= end) return count + 1;
      return count;
    }, 0);
  })();

  // Filters and sorting
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [onlyUpcoming, setOnlyUpcoming] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<"next" | "price_desc" | "name_asc">("next");

  const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[];

  const filtered = items.filter((s) => {
    if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
    if (onlyUpcoming) {
      if (!s.nextBillingDate) return false;
      const d = new Date(`${s.nextBillingDate}T00:00:00`);
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30);
      if (d < now || d > end) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "price_desc") return b.price - a.price;
    if (sortKey === "name_asc") return a.name.localeCompare(b.name);
    // sort by next bill soonest (undefined at end)
    const ad = a.nextBillingDate ? new Date(`${a.nextBillingDate}T00:00:00`).getTime() : Infinity;
    const bd = b.nextBillingDate ? new Date(`${b.nextBillingDate}T00:00:00`).getTime() : Infinity;
    return ad - bd;
  });

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

      <StatsCards 
        monthly={totals.monthly} 
        activeCount={activeCount} 
        renewalsNext30={renewalsNext30}
      />

      {/* Upgrade Banner for Free Users */}
      {!isPro && (
        <div className="mb-6 rounded-2xl border border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                🚀 You&apos;re on the Free Plan
              </h3>
              <p className="text-white/80 mb-2">
                Track up to 2 subscriptions with basic features.
              </p>
              <div className="text-sm text-white/60 mb-3">
                Currently using <span className="font-semibold text-purple-300">{items.length} of {maxSubscriptions}</span> free subscriptions
              </div>
              <div className="text-sm text-purple-300">
                ⭐ Upgrade for unlimited subscriptions, smart reminders, price alerts & more!
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <UpgradeButton 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-semibold transform hover:scale-105 transition-all"
              />
              <div className="text-xs text-center text-white/50">30-day money back guarantee</div>
            </div>
          </div>
        </div>
      )}

      {/* Pro Status Banner replaced by notification center in navbar */}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {canAddSubscription ? (
          <AddSubscriptionDialog onAdd={handleAdd} />
        ) : (
          <div className="flex items-center gap-2">
            <Button 
              disabled 
              className="opacity-50 cursor-not-allowed bg-gray-600"
              title="Free plan limit reached - upgrade to Pro for unlimited subscriptions"
            >
              Add Subscription (Limit Reached)
            </Button>
            <UpgradeButton variant="secondary">
              Upgrade to Pro
            </UpgradeButton>
          </div>
        )}
        
        {isPro ? (
          <ImportCsv onImport={importMany} />
        ) : (
          <div className="flex items-center gap-2">
            <Button disabled className="opacity-50 cursor-not-allowed bg-gray-600">
              Import CSV
            </Button>
            <span className="text-xs text-white/50">(Pro only)</span>
          </div>
        )}
      </div>

      {/* Filters and Sorting */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 p-3">
          <div className="text-xs text-white/60 mb-1">Category</div>
          <select
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All</option>
            {categories.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        </div>
        <label className="rounded-2xl border border-white/10 p-3 flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyUpcoming}
            onChange={(e) => setOnlyUpcoming(e.target.checked)}
          />
          <span className="text-sm">Only next 30 days</span>
        </label>
        <div className="rounded-2xl border border-white/10 p-3">
          <div className="text-xs text-white/60 mb-1">Sort by</div>
          <select
            className="w-full rounded-lg border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as "next" | "price_desc" | "name_asc")}
          >
            <option value="next">Next bill (soonest)</option>
            <option value="price_desc">Price (high → low)</option>
            <option value="name_asc">Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* Reminders settings */}
      <div className="mb-6 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">
              Renewal reminders
            </div>
            <div className="text-xs text-white/70">
              Choose when to be notified before renewals. Permissions: {mounted ? permission : "—"}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              Time
              <input
                type="time"
                className="rounded-lg border border-white/10 bg-neutral-800 px-2 py-1 text-white outline-none"
                value={settings.timeOfDay}
                onChange={(e) => setSettings({ ...settings, timeOfDay: e.target.value || '09:00' })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.leadDays.includes(7)}
                onChange={(e) => {
                  const on = e.target.checked;
                  const next = Array.from(new Set([...(on ? [...settings.leadDays, 7] : settings.leadDays.filter(d => d !== 7))])).sort((a,b)=>a-b);
                  setSettings({ ...settings, leadDays: next });
                }}
              />
              7 days
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.leadDays.includes(3)}
                onChange={(e) => {
                  const on = e.target.checked;
                  const next = Array.from(new Set([...(on ? [...settings.leadDays, 3] : settings.leadDays.filter(d => d !== 3))])).sort((a,b)=>a-b);
                  setSettings({ ...settings, leadDays: next });
                }}
              />
              3 days
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.leadDays.includes(1)}
                onChange={(e) => {
                  const on = e.target.checked;
                  const next = Array.from(new Set([...(on ? [...settings.leadDays, 1] : settings.leadDays.filter(d => d !== 1))])).sort((a,b)=>a-b);
                  setSettings({ ...settings, leadDays: next });
                }}
              />
              1 day
            </label>
            <Button
              onClick={async () => {
                if (permission !== "granted") await requestPermission();
                setSettings({ ...settings, enabled: !settings.enabled });
              }}
              className={settings.enabled ? "bg-green-600 hover:bg-green-700" : undefined}
            >
              {settings.enabled ? "Disable reminders" : "Enable reminders"}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const ok = await sendTest();
                if (!ok && mounted && typeof window !== 'undefined' && !window.isSecureContext) {
                  alert('Browser blocked notifications on an insecure origin. Use http://localhost or HTTPS.');
                }
              }}
            >
              Send test
            </Button>
          </div>
        </div>
      </div>

      <SubscriptionTable
        items={sorted}
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

export default function DashboardClient() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
