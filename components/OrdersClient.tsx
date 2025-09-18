// components/OrdersClient.tsx
"use client";

import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import AddOrderDialog from "@/components/AddOrderDialog";
import UpgradeButton from "@/components/UpgradeButton";
import { fmtCurrency } from "@/lib/format";

export default function OrdersClient() {
  const { items: orders, remove } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const [showAddDialog, setShowAddDialog] = useState(false);
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
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 font-semibold transform hover:scale-105 transition-all"
              />
              <div className="text-xs text-center text-white/50">30-day money back guarantee</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Display */}
      {orders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Total Orders</div>
            <div className="text-2xl font-bold text-white">{orders.length}</div>
            <div className="text-xs text-white/60">Tracked orders</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-green-500/20 to-emerald-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Active Orders</div>
            <div className="text-2xl font-bold text-white">{activeOrders}</div>
            <div className="text-xs text-white/60">Currently active</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-4">
            <div className="text-sm font-medium text-white/70">Total Value</div>
            <div className="text-2xl font-bold text-white">{fmtCurrency(totalOrderValue)}</div>
            <div className="text-xs text-white/60">All orders combined</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Your Orders</h2>
          <p className="text-white/60 text-sm">Track your online purchases and deliveries</p>
          {!isPro && (
            <p className="text-cyan-300 text-sm mt-1">
              Using {orders.length} of {orderLimit} free orders
            </p>
          )}
        </div>
        {canAddOrder ? (
          <Button
            onClick={() => setShowAddDialog(true)}
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "paused", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === status
                ? "bg-cyan-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
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
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
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
              className="bg-white/5 rounded-lg border border-white/10 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{order.title}</h3>
                  {order.retailer && <p className="text-white/60 text-sm">{order.retailer}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    order.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                    order.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {order.status}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${order.title}?`)) {
                        remove(order.id);
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
                    <span className="font-medium">{fmtCurrency(order.amount)}</span>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Order Dialog */}
      {showAddDialog && (
        <AddOrderDialog 
          onClose={() => setShowAddDialog(false)} 
        />
      )}
    </div>
  );
}