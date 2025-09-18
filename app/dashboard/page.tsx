// app/dashboard/page.tsx
"use client";

import { useState } from "react";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import AddOrderDialog from "@/components/AddOrderDialog";
import EditOrderDialog from "@/components/EditOrderDialog";
import UpgradeButton from "@/components/UpgradeButton";
import { Button } from "@/components/ui/Button";
import { fmtCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { OrderItem } from "@/lib/types-orders";

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
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-sm p-6`}>
      <div className="text-sm font-medium text-white/70">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{subtitle}</div>
    </div>
  );
}

export default function OrdersPage() {
  const { items: orders, remove, update } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Check if user can add more orders
  const canAddOrder = isPro || orders.length < 2;
  const orderLimit = isPro ? Infinity : 2;

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(order => order.status === filter);

  // Calculate stats
  const totalOrderValue = orders.reduce((sum, order) => sum + (order.amount || 0), 0);
  const activeOrders = orders.filter(order => order.status === 'active').length;

  const handleEdit = (order: OrderItem) => {
    setEditingOrder(order);
  };

  const handleUpdate = (updatedOrder: Partial<OrderItem>) => {
    if (!editingOrder) return;
    update(editingOrder.id, updatedOrder);
    setEditingOrder(null);
    toast(`Updated ${updatedOrder.title || editingOrder.title}`, "success");
  };

  const handleDelete = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (order && confirm(`Delete ${order.title}?`)) {
      remove(id);
      toast(`Deleted ${order.title}`, "success");
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Futuristic Background - Multiple Layers */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-blue-500/4 to-transparent -z-10" />
      
      <main className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Your Orders</h1>
          <p className="text-white/70">
            Track your online purchases and deliveries
          </p>
          {!isPro && (
            <p className="text-cyan-300 text-sm mt-1">
              Using {orders.length} of {orderLimit} free orders
            </p>
          )}
        </div>

        {/* Upgrade Banner for Free Users */}
        {!isPro && (
          <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/8 to-blue-400/8 backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-2">
                  📦 Free Plan - Order Tracking
                </h3>
                <p className="text-white/80 mb-2">
                  Track up to 2 orders with basic features.
                </p>
                <div className="text-sm text-white/60 mb-3">
                  Currently using <span className="font-semibold text-cyan-300">{orders.length} of {orderLimit}</span> free order slots
                </div>
                <div className="text-sm text-cyan-300">
                  ⭐ Upgrade for unlimited orders, price tracking & more!
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <UpgradeButton 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 font-semibold transform hover:scale-105 transition-all"
                />
                <div className="text-xs text-center text-white/50">30-day money back guarantee</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Orders"
            value={orders.length.toString()}
            subtitle="Tracked orders"
            gradient="from-cyan-400/15 to-blue-400/10"
          />
          <StatCard
            title="Active Orders"
            value={activeOrders.toString()}
            subtitle="Currently active"
            gradient="from-green-400/15 to-emerald-400/10"
          />
          <StatCard
            title="Total Value"
            value={fmtCurrency(totalOrderValue)}
            subtitle="All orders combined"
            gradient="from-purple-400/15 to-pink-400/10"
          />
          <StatCard
            title="Average Value"
            value={orders.length > 0 ? fmtCurrency(totalOrderValue / orders.length) : fmtCurrency(0)}
            subtitle="Per order"
            gradient="from-orange-400/15 to-yellow-400/10"
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          {canAddOrder ? (
            <button
              onClick={() => setShowAddDialog(true)}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg hover:from-cyan-400 hover:to-blue-400 transition-all transform hover:scale-105"
            >
              + Add Order
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                disabled 
                className="opacity-50 cursor-not-allowed bg-gray-600"
                title="Free plan limit reached - upgrade to Pro for unlimited orders"
              >
                Add Order (Limit Reached)
              </Button>
              <UpgradeButton variant="secondary">
                Upgrade to Pro
              </UpgradeButton>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["all", "active", "paused", "completed"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === status
                    ? "bg-cyan-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </h3>
            <p className="text-white/60 mb-6">
              {filter === "all" 
                ? "Start tracking your online orders to stay organized."
                : `You don't have any ${filter} orders at the moment.`
              }
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
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5 text-white/70">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Amount</th>
                  <th className="px-4 py-3 text-left font-medium">Next/Scheduled</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-white/10">
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.title}</div>
                      {order.retailer && (
                        <div className="text-xs text-white/50">{order.retailer}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize">{order.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-400/20 text-green-300' :
                        order.status === 'active' ? 'bg-blue-400/20 text-blue-300' :
                        order.status === 'paused' ? 'bg-yellow-400/20 text-yellow-300' :
                        'bg-red-400/20 text-red-300'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.amount ? fmtCurrency(order.amount) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {order.nextDate && (
                        <div>{new Date(order.nextDate).toLocaleDateString()}</div>
                      )}
                      {order.scheduledDate && (
                        <div>{new Date(order.scheduledDate).toLocaleDateString()}</div>
                      )}
                      {!order.nextDate && !order.scheduledDate && "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg border border-white/10 px-2 py-1 text-white/80 hover:bg-white/10"
                          onClick={() => handleEdit(order)}
                          title="Edit order"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="rounded-lg border border-red-400/30 px-2 py-1 text-red-300 hover:bg-red-400/10"
                          onClick={() => handleDelete(order.id)}
                          title="Delete order"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Order Dialog */}
        {showAddDialog && (
          <AddOrderDialog 
            onClose={() => setShowAddDialog(false)} 
          />
        )}

        {/* Edit Order Dialog */}
        {editingOrder && (
          <EditOrderDialog
            order={editingOrder}
            onSave={handleUpdate}
            onCancel={() => setEditingOrder(null)}
          />
        )}
      </main>
    </div>
  );
}