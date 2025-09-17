// components/OrdersClient.tsx
"use client";

import { useOrders } from "@/lib/useOrders";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import AddOrderDialog from "@/components/AddOrderDialog";

export default function OrdersClient() {
  const { items: orders } = useOrders();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filteredOrders = filter === "all" 
    ? orders 
    : orders.filter(order => order.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Your Orders</h2>
          <p className="text-white/60 text-sm">Track your online purchases and deliveries</p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          + Add Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "active", "paused", "completed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === status
                ? "bg-purple-600 text-white"
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
          {filter === "all" && (
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  order.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                  order.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {order.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {order.amount && (
                  <div>
                    <span className="text-white/60 block">Price</span>
                    <span className="font-medium">${order.amount}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-white/60 block">Type</span>
                  <span>{order.type}</span>
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