// components/AddOrderDialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useOrders } from "@/lib/useOrders";
import type { OrderType, OrderCadence } from "@/lib/types-orders";

interface Props {
  onClose: () => void;
}

export default function AddOrderDialog({ onClose }: Props) {
  const { add } = useOrders();
  const [formData, setFormData] = useState({
    title: "",
    type: "recurring" as OrderType,
    amount: "",
    retailer: "",
    category: "",
    cadence: "monthly" as OrderCadence,
    nextDate: "",
    scheduledDate: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      return;
    }

    add({
      title: formData.title,
      type: formData.type,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      retailer: formData.retailer || undefined,
      category: formData.category || undefined,
      status: "active",
      cadence: formData.type === "recurring" ? formData.cadence : undefined,
      nextDate: formData.type === "recurring" ? formData.nextDate || undefined : undefined,
      scheduledDate: formData.type === "future" ? formData.scheduledDate || undefined : undefined,
      notes: formData.notes || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg border border-white/20 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Add Order</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Item Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Paper towels, Coffee, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Order Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as OrderType })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="recurring">Recurring Order</option>
              <option value="future">Future Order</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Retailer
              </label>
              <input
                type="text"
                value={formData.retailer}
                onChange={(e) => setFormData({ ...formData, retailer: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Amazon, Walmart, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="25.99"
              />
            </div>
          </div>

          {formData.type === "recurring" && (
            <>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.cadence}
                  onChange={(e) => setFormData({ ...formData, cadence: e.target.value as OrderCadence })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Next Order Date
                </label>
                <input
                  type="date"
                  value={formData.nextDate}
                  onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </>
          )}

          {formData.type === "future" && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Scheduled Date
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Household, Food, etc."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Add Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}