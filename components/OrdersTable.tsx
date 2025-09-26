// components/OrdersTable.tsx - With Complete Order functionality
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { fmtCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { OrderItem } from "@/lib/useOrders";

interface OrdersTableProps {
  orders: OrderItem[];
  onEdit: (order: OrderItem) => void;
  onDelete: (id: string) => void;
  onMarkCompleted: (id: string) => void;
}

export default function OrdersTable({ orders, onEdit, onDelete, onMarkCompleted }: OrdersTableProps) {
  const toast = useToast();
  const [completingOrder, setCompletingOrder] = useState<string | null>(null);

  const handleCompleteOrder = async (order: OrderItem) => {
    if (order.status === 'completed') return;
    
    setCompletingOrder(order.id);
    try {
      await onMarkCompleted(order.id);
      toast(`${order.name} marked as completed!`, "success");
    } catch (error) {
      console.error('Failed to complete order:', error);
      toast("Failed to complete order", "error");
    } finally {
      setCompletingOrder(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟦';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '⚪';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="text-4xl mb-4">📦</div>
        <h3 className="text-lg font-semibold text-white mb-2">No orders yet</h3>
        <p className="text-white/60">Add your first order to start tracking your purchases.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Orders */}
      {orders.filter(order => order.status === 'active').length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            🟦 Active Orders ({orders.filter(order => order.status === 'active').length})
          </h3>
          <div className="grid gap-3">
            {orders
              .filter(order => order.status === 'active')
              .map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{order.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status}
                        </span>
                        {order.isEssential && (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                            Essential
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <span className="font-medium text-lg text-white">
                          {fmtCurrency(order.amount || 0, order.currency)}
                        </span>
                        {order.vendor && <span>from {order.vendor}</span>}
                        {order.scheduledDate && <span>scheduled for {order.scheduledDate}</span>}
                      </div>
                      {order.notes && (
                        <p className="text-sm text-white/60 mt-2">{order.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => handleCompleteOrder(order)}
                        disabled={completingOrder === order.id}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        size="sm"
                      >
                        {completingOrder === order.id ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Completing...
                          </div>
                        ) : (
                          <>✅ Complete Order</>
                        )}
                      </Button>
                      <Button
                        onClick={() => onEdit(order)}
                        variant="ghost"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onDelete(order.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Completed Orders */}
      {orders.filter(order => order.status === 'completed').length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            ✅ Completed Orders ({orders.filter(order => order.status === 'completed').length})
          </h3>
          <div className="grid gap-3">
            {orders
              .filter(order => order.status === 'completed')
              .map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-green-500/20 bg-green-500/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white">{order.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status}
                        </span>
                        {order.isEssential && (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                            Essential
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <span className="font-medium text-lg text-green-300">
                          {fmtCurrency(order.amount || 0, order.currency)}
                        </span>
                        {order.vendor && <span>from {order.vendor}</span>}
                        {order.scheduledDate && <span>completed on {order.scheduledDate}</span>}
                      </div>
                      {order.notes && (
                        <p className="text-sm text-white/60 mt-2">{order.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => onEdit(order)}
                        variant="ghost"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => onDelete(order.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Cancelled Orders */}
      {orders.filter(order => order.status === 'cancelled').length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            ❌ Cancelled Orders ({orders.filter(order => order.status === 'cancelled').length})
          </h3>
          <div className="grid gap-3">
            {orders
              .filter(order => order.status === 'cancelled')
              .map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-white line-through">{order.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)} {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/50">
                        <span className="font-medium text-lg line-through">
                          {fmtCurrency(order.amount || 0, order.currency)}
                        </span>
                        {order.vendor && <span>from {order.vendor}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        onClick={() => onDelete(order.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}