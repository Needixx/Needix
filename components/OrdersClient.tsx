// components/OrdersClient.tsx
"use client";

import { useState } from "react";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { Button } from "@/components/ui/Button";
import AddOrderDialog from "@/components/AddOrderDialog";
import UpgradeButton from "@/components/UpgradeButton";
import { fmtCurrency } from "@/lib/format";
import { debug } from "@/lib/debug";

// UI-level types (what AddOrderDialog emits)
import type {
  OrderFormData as UIOrderFormData,
  OrderType as UIOrderType,
} from "@/lib/types-orders";

// Hook-level type (what useOrders.add expects)
import type { OrderFormData as HookOrderFormData } from "@/lib/useOrders";

/* ---------- UI -> hook adapters ---------- */

const uiTypeToHook = (t: UIOrderType): HookOrderFormData["type"] =>
  t === "recurring" ? "subscription" : "one-time";

const uiFormToHookForm = (d: UIOrderFormData): HookOrderFormData => ({
  name: d.name,
  type: uiTypeToHook(d.type),
  amount: d.amount || 0,
  currency: d.currency,
  vendor: d.vendor || d.name,
  scheduledDate: d.scheduledDate,
  nextDate: d.nextDate,
  priceCeiling: d.priceCeiling,
  currentPrice: d.currentPrice,
  category: d.category,
  notes: d.notes,
  isEssential: d.isEssential,
});

/* ---------------------------------------- */

export default function OrdersClient() {
  const { items: orders, remove, add } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Check if user can add more orders
  const canAddOrder = isPro || orders.length < 2;
  const orderLimit = isPro ? Infinity : 2;

  const filteredOrders =
    filter === "all" ?
      orders : orders.filter((order) => order.status === filter);

  const handleAdd = async (orderData: UIOrderFormData) => {
    try {
      debug.log('Adding order:', orderData);
      const hookFormData = uiFormToHookForm(orderData);
      await add(hookFormData);
      setShowAddDialog(false);
    } catch (error) {
      debug.error('Error adding order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📦</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Orders
            </h1>
          </div>
          <p className="text-white/60 text-lg">
            Track your planned purchases and mark them as completed when purchased
          </p>
        </div>

        {/* Add Button */}
        <div className="mb-8">
          {canAddOrder ? (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              + Add Order
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">
                Free plan: {orders.length}/{orderLimit} orders
              </span>
              <UpgradeButton size="sm" />
            </div>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-white/70">Filter:</span>
          <div className="flex rounded-lg border border-white/20 overflow-hidden">
            {["all", "active", "completed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 text-sm capitalize transition-colors ${
                  filter === status
                    ? "bg-white/20 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {order.name}
                  </h3>
                  <p className="text-white/60">{order.vendor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium border ${
                      order.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "active"
                        ? "bg-blue-500/20 text-blue-400"
                        : order.status === "cancelled"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {order.status}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${order.name}?`)) {
                        void remove(order.id); // explicitly ignore promise
                      }
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {order.amount && (
                  <div>
                    <span className="text-white/60 block">Price</span>
                    <span className="font-medium">
                      {fmtCurrency(order.amount)}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-white/60 block">Type</span>
                  <span className="capitalize">{order.type}</span>
                </div>

                {order.nextDate && (
                  <div>
                    <span className="text-white/60 block">Next Date</span>
                    <span>{new Date(order.nextDate).toLocaleDateString()}</span>
                  </div>
                )}

                {order.scheduledDate && (
                  <div>
                    <span className="text-white/60 block">Scheduled</span>
                    <span>{new Date(order.scheduledDate).toLocaleDateString()}</span>
                  </div>
                )}

                {order.category && (
                  <div>
                    <span className="text-white/60 block">Category</span>
                    <span>{order.category}</span>
                  </div>
                )}

                {order.priceCeiling && (
                  <div>
                    <span className="text-white/60 block">Price Alert</span>
                    <span>{fmtCurrency(order.priceCeiling)}</span>
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="mt-3 p-3 rounded-lg bg-white/5">
                  <span className="text-white/60 text-sm block mb-1">Notes</span>
                  <p className="text-white/80 text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Orders Yet</h3>
            <p className="text-white/70 text-sm">
              Add your first order to get started!
            </p>
          </div>
        )}
      </div>

      {/* Add Order Dialog */}
      {showAddDialog && (
        <AddOrderDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}