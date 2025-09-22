// components/OrdersClient.tsx
"use client";

import { useState } from "react";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { Button } from "@/components/ui/Button";
import AddOrderDialog from "@/components/AddOrderDialog";
import UpgradeButton from "@/components/UpgradeButton";
import { fmtCurrency } from "@/lib/format";

// UI-level types (what AddOrderDialog emits)
import type {
  OrderFormData as UIOrderFormData,
  OrderType as UIOrderType,
  OrderStatus as UIOrderStatus,
} from "@/lib/types-orders";

// Hook-level type (what useOrders.add expects)
import type { OrderFormData as HookOrderFormData } from "@/lib/useOrders";

/* ---------- UI -> hook adapters ---------- */

const uiTypeToHook = (t: UIOrderType): HookOrderFormData["type"] =>
  t === "recurring" ? "recurring" : "one-time";

const uiStatusToHook = (
  s?: UIOrderStatus
): HookOrderFormData["status"] | undefined => {
  if (!s) return undefined;
  if (s === "active" || s === "completed" || s === "cancelled") return s;
  return "active";
};

const uiFormToHookForm = (d: UIOrderFormData): HookOrderFormData => ({
  name: d.name,
  type: uiTypeToHook(d.type),
  amount: d.amount,
  currency: d.currency,
  status: uiStatusToHook(d.status),
  scheduledDate: d.scheduledDate,
  nextDate: d.nextDate,
  priceCeiling: d.priceCeiling,
  currentPrice: d.currentPrice,
  vendor: d.vendor,
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
    filter === "all" ? orders : orders.filter((order) => order.status === filter);

  // Calculate stats
  const totalOrderValue = orders.reduce(
    (sum, order) => sum + (order.amount || 0),
    0
  );
  const activeOrders = orders.filter((order) => order.status === "active").length;

  const handleAdd = (orderData: UIOrderFormData) => {
    void add(uiFormToHookForm(orderData)); // explicitly ignore promise
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Upgrade Banner for Free Users */}
      {!isPro && (
        <div className="rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                📦 Free Plan - Order Tracking
              </h3>
              <p className="text-white/80 mb-2">Track up to 2 orders with basic features.</p>
              <div className="text-sm text-white/60 mb-3">
                Currently using{" "}
                <span className="font-semibold text-cyan-300">
                  {orders.length} of {orderLimit}
                </span>{" "}
                free order slots
              </div>
              <div className="text-sm text-cyan-300">
                ⭐ Upgrade for unlimited orders, price tracking & more!
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <UpgradeButton className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-semibold transform hover:scale-105 transition-all" />
              <div className="text-xs text-center text-white/50">30-day money back guarantee</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Display */}
      {orders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Total Order Value</div>
            <div className="text-2xl font-bold text-white">{fmtCurrency(totalOrderValue)}</div>
            <div className="text-xs text-white/60">All tracked orders</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Active Orders</div>
            <div className="text-2xl font-bold text-white">{activeOrders}</div>
            <div className="text-xs text-white/60">Currently tracking</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 p-4">
            <div className="text-sm font-medium text-white/70">This Month</div>
            <div className="text-2xl font-bold text-white">{orders.length}</div>
            <div className="text-xs text-white/60">Orders added</div>
          </div>
        </div>
      )}

      {/* Filter and Add Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Your Orders</h2>
        <div className="flex gap-3">
          {/* Filter Buttons */}
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
            {["all", "active", "completed", "cancelled"].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors capitalize ${
                  filter === filterOption
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>

          {canAddOrder ? (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
            >
              Add Order
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-white/60 text-sm mb-2">
                Free plan limit reached ({orders.length}/{orderLimit})
              </p>
              <UpgradeButton className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700" />
            </div>
          )}
        </div>
      </div>

      {/* Orders Display */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2">
            {filter === "all" ? "No orders yet" : `No ${filter} orders`}
          </h3>
          <p className="text-white/60 mb-6">
            {filter === "all"
              ? "Start tracking your online orders to stay organized."
              : `You don't have any ${filter} orders at the moment.`}
          </p>
          {filter === "all" && canAddOrder && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
            >
              Add Your First Order
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{order.name}</h3>
                  {order.vendor && (
                    <p className="text-white/60 text-sm">{order.vendor}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
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
      )}

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
