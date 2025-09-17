// components/OrdersClient.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import type { OrderItem, OrderStatus } from "@/lib/types-orders";
import AddOrderDialog from "@/components/AddOrderDialog";
import { Button } from "@/components/ui/Button";
import UpgradeButton from "@/components/UpgradeButton";
import { useToast } from "@/components/ui/Toast";

function ymdToDate(s?: string) { return s ? new Date(`${s}T00:00:00`) : null; }

export default function OrdersClient() {
  const { items, add, update, remove } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();

  const [filters, setFilters] = useState<{ 
    type: "all" | "recurring" | "future"; 
    status: "all" | OrderStatus; 
    category: string; 
    retailer: string; 
  }>({ 
    type: "all", 
    status: "all", 
    category: "all", 
    retailer: "" 
  });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OrderItem | null>(null);

  // Calculate limits
  const canAddOrder = isPro || items.length < 2;
  const orderLimit = isPro ? Infinity : 2;

  const categories = useMemo(() => 
    Array.from(new Set(items.map(i => i.category).filter(Boolean))) as string[], 
    [items]
  );

  const retailers = useMemo(() => 
    Array.from(new Set(items.map(i => i.retailer).filter(Boolean))) as string[], 
    [items]
  );

  const filtered = useMemo(() => items.filter((i) => {
    if (filters.type !== 'all' && i.type !== filters.type) return false;
    if (filters.status !== 'all' && i.status !== filters.status) return false;
    if (filters.category !== 'all' && i.category !== filters.category) return false;
    if (filters.retailer && (i.retailer || '').toLowerCase().indexOf(filters.retailer.toLowerCase()) < 0) return false;
    if (query && i.title.toLowerCase().indexOf(query.toLowerCase()) < 0) return false;
    return true;
  }), [items, filters, query]);

  function onSave(data: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editing) {
      update(editing.id, data);
      toast('Order updated', 'success');
    } else {
      if (!canAddOrder) {
        toast(`Free plan is limited to ${orderLimit} orders. Upgrade to Pro for unlimited orders.`, 'error');
        return;
      }
      add(data);
      toast('Order added', 'success');
    }
    setOpen(false);
    setEditing(null);
  }

  function placeOrder(o: OrderItem) {
    if (o.productUrl) {
      try { window.open(o.productUrl, '_blank'); } catch {}
    }
    if (o.amount) {
      toast(`Order placed for $${o.amount.toFixed(2)}`, 'success');
    }
  }

  // Calculate counts for display
  const counts = useMemo(() => ({
    active: items.filter(i => i.status === 'active').length,
    paused: items.filter(i => i.status === 'paused').length,
    completed: items.filter(i => i.status === 'completed').length,
  }), [items]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Smart Orders</h1>
        <p className="text-white/70">
          Set price targets and get notified when items hit your budget
        </p>
        {!isPro && (
          <p className="text-cyan-300 text-sm mt-1">
            Using {items.length} of {orderLimit} free orders
          </p>
        )}
      </div>

      {/* Upgrade Banner for Free Users */}
      {!isPro && (
        <div className="mb-6 rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                📦 Free Plan - Smart Orders
              </h3>
              <p className="text-white/80 mb-2">
                Track up to 2 orders with basic features.
              </p>
              <div className="text-sm text-white/60 mb-3">
                Currently using <span className="font-semibold text-cyan-300">{items.length} of {orderLimit}</span> free order slots
              </div>
              <div className="text-sm text-cyan-300">
                ⭐ Upgrade for unlimited orders, price alerts & more!
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <UpgradeButton 
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-semibold transform hover:scale-105 transition-all"
              />
              <div className="text-xs text-center text-white/50">30-day money back guarantee</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Controls */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input 
            className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50" 
            placeholder="Search orders" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <select 
            className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50" 
            value={filters.type} 
            onChange={(e) => setFilters({ ...filters, type: e.target.value as "all" | "recurring" | "future" })}
          >
            <option value="all">All types</option>
            <option value="recurring">Recurring</option>
            <option value="future">Future</option>
          </select>
          <select 
            className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50" 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value as "all" | OrderStatus })}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          <select 
            className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50" 
            value={filters.category} 
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="all">All categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input 
            className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/50" 
            placeholder="Filter by retailer" 
            value={filters.retailer} 
            onChange={(e) => setFilters({ ...filters, retailer: e.target.value })} 
          />
        </div>

        {/* Add Order Button */}
        <div className="flex flex-wrap gap-3">
          {canAddOrder ? (
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
            >
              + Add Order
            </Button>
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
        </div>

        {/* Status counts */}
        <div className="text-white/60 text-sm">
          Active {counts.active} • Paused {counts.paused} • Completed {counts.completed}
          {!isPro && (
            <span className="ml-4 text-cyan-300">
              Using {items.length} of {orderLimit} free orders
            </span>
          )}
        </div>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-8 text-center text-white/70">
            {items.length === 0 ? 
              "No orders yet. Add your first order to get started!" :
              "No orders match your current filters."
            }
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => {
              const nextDate = o.nextDate ? ymdToDate(o.nextDate) : o.scheduledDate ? ymdToDate(o.scheduledDate) : null;
              const days = nextDate ? Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
              const isOverdue = days != null && days < 0;
              const isDueSoon = days != null && days >= 0 && days <= 7;

              return (
                <div key={o.id} className="rounded-2xl border border-white/10 bg-neutral-900/50 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white">{o.title}</h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${
                          o.status === 'active' ? 'bg-green-500/20 text-green-300' :
                          o.status === 'paused' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {o.status}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-cyan-500/20 text-cyan-300">
                          {o.type}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                        {o.amount && (
                          <span>💰 ${o.amount.toFixed(2)}</span>
                        )}
                        {o.category && (
                          <span>🏷️ {o.category}</span>
                        )}
                        {o.retailer && (
                          <span>🏪 {o.retailer}</span>
                        )}
                        {o.cadence && (
                          <span>🔄 {o.cadence}</span>
                        )}
                        {nextDate && (
                          <span className={
                            isOverdue ? 'text-red-400' : 
                            isDueSoon ? 'text-yellow-400' : 
                            'text-white/60'
                          }>
                            📅 {isOverdue ? `${Math.abs(days!)} days overdue` :
                             isDueSoon ? `Due in ${days} days` :
                             `Next: ${nextDate.toLocaleDateString()}`}
                          </span>
                        )}
                      </div>
                      
                      {o.notes && (
                        <p className="mt-2 text-sm text-white/50">{o.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {o.productUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => placeOrder(o)}
                        >
                          🔗 Open
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditing(o);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete "${o.title}"?`)) {
                            remove(o.id);
                            toast('Order deleted', 'success');
                          }
                        }}
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog */}
        {open && (
          <AddOrderDialog
            order={editing}
            onSave={onSave}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        )}
      </div>
    </main>
  );
}