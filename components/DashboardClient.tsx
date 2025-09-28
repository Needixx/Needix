// components/DashboardClient.tsx
"use client";

import { useSubscriptions } from "@/lib/useSubscriptions";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import AddSubscriptionDialog, {
  EditSubscriptionDialog,
  type SubscriptionFormData,
} from "@/components/AddSubscriptionDialog";
import SubscriptionTable from "@/components/SubscriptionTable";
import AIInsightsDashboard from "@/components/AIInsightsDashboard";
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
  const [activeTab, setActiveTab] = useState<'overview' | 'insights'>('overview');

  const canAddSubscription = isPro || subscriptions.length < 2;
  const subscriptionLimit = isPro ? Infinity : 2;

  const handleEdit = (sub: Subscription) => {
    setEditing(sub);
  };

  const handleUpdate = (data: SubscriptionFormData & { id?: string }) => {
    if (!editing || !data.id) return;
    
    update(data.id, {
      name: data.name,
      price: data.price,
      currency: data.currency,
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

  const handleAdd = async (data: SubscriptionFormData) => {
    try {
      await add({
        name: data.name,
        price: data.price,
        currency: data.currency,
        period: data.period,
        nextBillingDate: data.nextBillingDate,
        category: data.category,
        notes: data.notes,
        link: data.link,
        isEssential: data.isEssential,
      });
      
      setShowAddDialog(false);
      toast(`Added ${data.name}`, "success");
    } catch (error) {
      console.error('Error adding subscription:', error);
      toast("Failed to add subscription", "error");
    }
  };

  const handleDelete = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (sub && confirm(`Delete ${sub.name}?`)) {
      deleteSubscription(id);
      toast(`Deleted ${sub.name}`, "success");
    }
  };

  // Check if AI features are enabled
  const getAISettings = () => {
    try {
      const stored = localStorage.getItem("needix_ai");
      return stored ? JSON.parse(stored) : { allowDataAccess: false };
    } catch {
      return { allowDataAccess: false };
    }
  };

  const aiSettings = getAISettings();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60 mt-1">
            {subscriptions.length} of {isPro ? "unlimited" : subscriptionLimit} subscriptions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isPro && subscriptions.length >= 2 && (
            <UpgradeButton>Upgrade for unlimited subscriptions</UpgradeButton>
          )}
          <Button
            onClick={() => setShowAddDialog(true)}
            disabled={!canAddSubscription}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Totals Card */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Monthly Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold text-white">{fmtCurrency(totals.monthly)}</div>
            <div className="text-white/60">Monthly Total</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{fmtCurrency(totals.monthly * 12)}</div>
            <div className="text-white/60">Annual Total</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{subscriptions.length}</div>
            <div className="text-white/60">Active Subscriptions</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-white/20 text-white shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          📊 Overview
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'insights'
              ? 'bg-white/20 text-white shadow-sm'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🤖 AI Insights
          {aiSettings.allowDataAccess && (
            <span className="ml-1 inline-block w-2 h-2 bg-green-400 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Subscriptions Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Your Subscriptions</h2>
            </div>
            <div className="p-6">
              <SubscriptionTable
                items={subscriptions}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>

          {/* Empty State */}
          {subscriptions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-white mb-2">No subscriptions yet</h3>
              <p className="text-white/60 mb-6">
                Add your first subscription to start tracking your monthly expenses
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Add Your First Subscription
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <AIInsightsDashboard />
      )}

      {/* Add Subscription Dialog */}
      <AddSubscriptionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAdd}
      />

      {/* Edit Subscription Dialog */}
      {editing && (
        <EditSubscriptionDialog
          open={true}
          onOpenChange={(open: boolean) => !open && setEditing(null)}
          initial={{
            id: editing.id,
            name: editing.name,
            price: editing.price,
            currency: editing.currency,
            period: editing.period,
            nextBillingDate: editing.nextBillingDate,
            category: editing.category,
            notes: editing.notes,
            link: editing.link,
            isEssential: editing.isEssential,
          }}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}