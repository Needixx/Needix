// app/dashboard/orders/page.tsx

"use client";

import { useState } from "react";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { Button } from "@/components/ui/Button";
import { fmtCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import OrdersTable from "@/components/OrdersTable";
import UpgradeButton from "@/components/UpgradeButton";
import AddOrderDialog from "@/components/AddOrderDialog";
import EditOrderDialog from "@/components/EditOrderDialog";
import { debug } from "@/lib/debug";

// Type imports for conversion
import type {
  OrderFormData as UIOrderFormData,
  OrderType as UIOrderType,
  OrderStatus as UIOrderStatus,
} from "@/lib/types-orders";
import type { OrderFormData as HookOrderFormData } from "@/lib/useOrders";

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

/* ---------- UI -> hook adapters ---------- */
const uiTypeToHook = (t: UIOrderType): "one-time" | "subscription" => {
  // UI types: "recurring" | "future" | "one-time"
  // Hook types: "one-time" | "subscription" 
  if (t === "recurring") return "subscription";
  return "one-time"; // Maps both "future" and "one-time" to "one-time"
};

const uiStatusToHook = (
  s: UIOrderStatus
): "active" | "completed" | "cancelled" => {
  // UI types: "active" | "paused" | "completed" | "cancelled"
  // Hook types: "active" | "completed" | "cancelled"
  if (s === "paused") return "active"; // Map paused to active
  return s as "active" | "completed" | "cancelled";
};

const uiFormToHookForm = (d: UIOrderFormData): HookOrderFormData => ({
  name: d.name,
  vendor: d.vendor || d.name, // Use name as vendor if vendor not provided
  type: uiTypeToHook(d.type),
  amount: d.amount || 0,
  currency: d.currency,
  category: d.category,
  scheduledDate: d.scheduledDate,
  nextDate: d.nextDate,
  notes: d.notes,
  isEssential: d.isEssential,
  priceCeiling: d.priceCeiling,
  currentPrice: d.currentPrice,
});

export default function OrdersPage() {
  const { items: orders, remove, update, markCompleted, totals, add } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [filter, setFilter] = useState<string>("all");

  // Check if user can add more orders
  const canAddOrder = isPro || orders.length < 2;

  const filteredOrders = filter === "all" ?
    orders : orders.filter((order) => order.status === filter);

  const handleEdit = (order: any) => {
    setEditingOrder(order);
  };

  const handleDelete = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (order && confirm(`Delete ${order.name}?`)) {
      void remove(id);
      toast(`Deleted ${order.name}`, "success");
    }
  };

  const handleMarkCompleted = async (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (order) {
      await markCompleted(id);
      toast(`${order.name} marked as completed!`, "success");
    }
  };

  // Handler for adding orders
  const handleAdd = async (orderData: UIOrderFormData) => {
    try {
      debug.log('🔄 handleAdd called with:', orderData);
      
      // Convert UI form data to hook form data
      const hookFormData = uiFormToHookForm(orderData);
      debug.log('🔄 Converted to hook format:', hookFormData);
      
      // Add the order
      await add(hookFormData);
      
      // Close the dialog
      setShowAddDialog(false);
      
      // Show success toast
      toast(`Added ${orderData.name}`, "success");
      
      debug.log('✅ Order added successfully');
    } catch (error) {
      console.error('❌ Error adding order:', error);
      toast("Failed to add order", "error");
    }
  };

  // Handler for updating orders
  const handleUpdate = async (orderData: UIOrderFormData & { id: string }) => {
    try {
      debug.log('🔄 handleUpdate called with:', orderData);
      
      // Convert UI form data to hook form data and add the status field
      const hookFormData = uiFormToHookForm(orderData);
      
      // Add the status field manually since it's not in the hook's OrderFormData type
      // but the update function can accept it as part of Partial<OrderItem>
      const updateData = {
        ...hookFormData,
        status: uiStatusToHook(orderData.status)
      };
      
      debug.log('🔄 Converted to hook format with status:', updateData);
      
      // Update the order using the hook's update function
      await update(orderData.id, updateData);
      
      // Close the dialog
      setEditingOrder(null);
      
      // Show success toast
      toast(`Updated ${orderData.name}`, "success");
      
      debug.log('✅ Order updated successfully');
    } catch (error) {
      console.error('❌ Error updating order:', error);
      toast("Failed to update order", "error");
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Active Orders"
            value={totals.active.toString()}
            subtitle="Planned purchases"
            gradient="from-blue-600/20 to-cyan-600/20"
          />
          <StatCard
            title="Completed This Month"
            value={fmtCurrency(totals.monthly)}
            subtitle={`${totals.completed} orders completed`}
            gradient="from-green-600/20 to-emerald-600/20"
          />
          <StatCard
            title="Total Orders"
            value={orders.length.toString()}
            subtitle="All time"
            gradient="from-purple-600/20 to-pink-600/20"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center gap-3">
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
                  Free plan: {orders.length}/2 orders
                </span>
                <UpgradeButton size="sm" />
              </div>
            )}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
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
        </div>

        {/* Orders Table */}
        <OrdersTable
          orders={filteredOrders}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMarkCompleted={handleMarkCompleted}
        />

        {/* Instructions */}
        {orders.length === 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-white mb-2">How Orders Work</h3>
            <div className="text-white/70 text-sm space-y-2 max-w-md mx-auto">
              <p>• Add orders you're planning to make</p>
              <p>• Orders start as "Active" (planned)</p>
              <p>• Click "Complete Order" when you actually make the purchase</p>
              <p>• Only completed orders count toward your monthly spending totals</p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AddOrderDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onAdd={handleAdd}
      />

      <EditOrderDialog
        order={editingOrder}
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}