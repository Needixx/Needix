// app/dashboard/orders/page.tsx

"use client";

import { useState, useMemo } from "react";
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

// ----- Types -----
import type {
  OrderFormData as UIOrderFormData,
  OrderType as UIOrderType,
  OrderStatus as UIOrderStatus,
  OrderItem as UIOrderItem, // UI-layer type (EditOrderDialog expects this)
} from "@/lib/types-orders";
import type {
  OrderFormData as HookOrderFormData,
  OrderItem as HookOrderItem, // hook-layer type (what useOrders returns)
} from "@/lib/useOrders";

// For places where we know items include an id
type OrderRow = HookOrderItem & { id: string };

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

/* ---------- UI <> hook adapters ---------- */
const uiTypeToHook = (t: UIOrderType): "one-time" | "subscription" => {
  // UI has: "recurring" | "future" | "one-time"
  // Hook expects: "one-time" | "subscription"
  return t === "recurring" ? "subscription" : "one-time";
};

const hookTypeToUI = (t: "one-time" | "subscription"): UIOrderType => {
  // Map hook back to UI for Edit dialog
  return t === "subscription" ? "recurring" : "one-time";
};

const uiStatusToHook = (s: UIOrderStatus): "active" | "completed" | "cancelled" => {
  // UI includes "paused"; hook does not. Treat paused as active.
  return s === "paused" ? "active" : (s as "active" | "completed" | "cancelled");
};

const uiFormToHookForm = (d: UIOrderFormData): HookOrderFormData => ({
  name: d.name,
  vendor: d.vendor || d.name,
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

/* ---------- Mobile helpers (presentation only) ---------- */
function formatDateMaybe(d?: string | null): string {
  if (!d) return "—";
  const parsed = new Date(`${d}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: OrderRow["status"] }) {
  const map: Record<OrderRow["status"], string> = {
    active: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    completed: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    cancelled: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  };
  const cls = map[status] ?? "bg-white/10 text-white/70 border-white/20";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs border ${cls}`}>{status[0].toUpperCase() + status.slice(1)}</span>;
}

function TypeBadge({ type }: { type: OrderRow["type"] }) {
  const label = type === "subscription" ? "Recurring" : "One-time";
  return <span className="rounded-full px-2 py-0.5 text-xs border border-white/15 text-white/70">{label}</span>;
}

function InfoTile({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "right";
}) {
  return (
    <div className={`rounded-lg border border-white/5 bg-white/[0.04] p-3 ${align === "right" ? "text-right" : ""}`}>
      <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function MobileOrderCard({
  order,
  onEdit,
  onDelete,
  onMarkCompleted,
}: {
  order: OrderRow;
  onEdit: (o: OrderRow) => void;
  onDelete: (id: string) => void;
  onMarkCompleted: (id: string) => void;
}) {
  const {
    id,
    name,
    vendor,
    category,
    amount,
    currentPrice,
    priceCeiling,
    type,
    status,
    nextDate,
    scheduledDate,
  } = order;

  const displayAmount =
    typeof amount === "number" ? amount : typeof currentPrice === "number" ? currentPrice : 0;

  const primaryDate = type === "subscription" ? nextDate : scheduledDate;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{name || "Untitled order"}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {vendor ? <span className="text-white/70">{vendor}</span> : null}
            {category ? <span className="text-white/50">• {category}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <TypeBadge type={type} />
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Amount + Date */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoTile
          label={type === "subscription" ? "Next charge" : "Scheduled for"}
          value={formatDateMaybe(primaryDate ?? null)}
        />
        <InfoTile label="Amount" value={fmtCurrency(displayAmount)} align="right" />
      </div>

      {/* Optional price details */}
      {typeof currentPrice === "number" || typeof priceCeiling === "number" ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {typeof currentPrice === "number" && (
            <InfoTile label="Current price" value={fmtCurrency(currentPrice)} />
          )}
          {typeof priceCeiling === "number" && (
            <InfoTile label="Price ceiling" value={fmtCurrency(priceCeiling)} align="right" />
          )}
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => onEdit(order)}>Edit</Button>
          {status !== "completed" && status !== "cancelled" && (
            <Button
              onClick={() => onMarkCompleted(id)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Complete
            </Button>
          )}
        </div>
        <Button variant="secondary" onClick={() => onDelete(id)}>
          Delete
        </Button>
      </div>
    </article>
  );
}

export default function OrdersPage() {
  const { items: orders, remove, update, markCompleted, totals, add } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Check if user can add more orders
  const canAddOrder = isPro || orders.length < 2;

  const filteredOrders = filter === "all" ? orders : orders.filter((order) => order.status === filter);

  const handleEdit = (order: OrderRow) => {
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
      debug.log("🔄 handleAdd called with:", orderData);
      const hookFormData = uiFormToHookForm(orderData);
      debug.log("🔄 Converted to hook format:", hookFormData);
      await add(hookFormData);
      setShowAddDialog(false);
      toast(`Added ${orderData.name}`, "success");
      debug.log("✅ Order added successfully");
    } catch (error) {
      console.error("❌ Error adding order:", error);
      toast("Failed to add order", "error");
    }
  };

  // Handler for updating orders
  const handleUpdate = async (orderData: UIOrderFormData & { id: string }) => {
    try {
      debug.log("🔄 handleUpdate called with:", orderData);
      const hookFormData = uiFormToHookForm(orderData);
      const updateData = { ...hookFormData, status: uiStatusToHook(orderData.status) };
      debug.log("🔄 Converted to hook format with status:", updateData);
      await update(orderData.id, updateData);
      setEditingOrder(null);
      toast(`Updated ${orderData.name}`, "success");
      debug.log("✅ Order updated successfully");
    } catch (error) {
      console.error("❌ Error updating order:", error);
      toast("Failed to update order", "error");
    }
  };

  // === adapt hook item -> UI item for EditOrderDialog (type union fix) ===
  const uiEditingOrder: UIOrderItem | null = useMemo(() => {
    if (!editingOrder) return null;
    // Map the minimal fields the dialog typically uses; spread keeps extra props if tolerated
    return {
      ...(editingOrder as unknown as Record<string, unknown>),
      type: hookTypeToUI(editingOrder.type), // "subscription" -> "recurring"
      // status union is compatible ("active" | "completed" | "cancelled") with UI type
    } as unknown as UIOrderItem;
  }, [editingOrder]);

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

        {/* Mobile cards (md:hidden) */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredOrders.map((o) => (
            <MobileOrderCard
              key={o.id}
              order={o as OrderRow}
              onEdit={setEditingOrder}
              onDelete={handleDelete}
              onMarkCompleted={handleMarkCompleted}
            />
          ))}
          {filteredOrders.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-white mb-2">No matching orders</h3>
              <p className="text-white/70 text-sm">Try a different filter or add a new order.</p>
            </div>
          )}
        </div>

        {/* Desktop table (unchanged) */}
        <div className="hidden md:block">
          <OrdersTable
            orders={filteredOrders}
            onEdit={(o) => setEditingOrder(o as OrderRow)}
            onDelete={handleDelete}
            onMarkCompleted={handleMarkCompleted}
          />
        </div>

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

      {/* Pass the UI-shaped item into the dialog (fixes union mismatch) */}
      <EditOrderDialog
        order={uiEditingOrder}
        open={!!uiEditingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
