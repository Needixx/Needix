// components/AddSubscriptionDialog.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSubscriptions } from "@/lib/useSubscriptions";
import type { Subscription, BillingPeriod } from "@/lib/types";

export type SubscriptionFormData = {
  name: string;
  price: number;
  currency: "USD";
  period: BillingPeriod;
  nextBillingDate?: string;
  category?: string;
  link?: string;
  notes?: string;
};

type InitialData = Partial<SubscriptionFormData> & { id?: string };

interface Props {
  onClose: () => void;
}

export default function AddSubscriptionDialog({ onClose }: Props) {
  const { add } = useSubscriptions();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    period: "monthly" as BillingPeriod,
    nextBillingDate: "",
    category: "",
    notes: "",
    link: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      return;
    }

    add({
      name: formData.name,
      price: parseFloat(formData.price),
      currency: "USD",
      period: formData.period,
      nextBillingDate: formData.nextBillingDate || undefined,
      category: formData.category || undefined,
      notes: formData.notes || undefined,
      link: formData.link || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg border border-white/20 p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Subscription</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Netflix, Spotify, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="9.99"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Period
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as BillingPeriod })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Next Billing Date
            </label>
            <input
              type="date"
              value={formData.nextBillingDate}
              onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Entertainment, Productivity, etc."
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
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Add Subscription
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// EditSubscriptionDialog component
interface EditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InitialData;
  onUpdate: (data: SubscriptionFormData & { id?: string }) => void;
}

export function EditSubscriptionDialog({ open, onOpenChange, initial, onUpdate }: EditProps) {
  const [formData, setFormData] = useState({
    name: initial?.name || "",
    price: initial?.price?.toString() || "",
    period: initial?.period || ("monthly" as BillingPeriod),
    nextBillingDate: initial?.nextBillingDate || "",
    category: initial?.category || "",
    notes: initial?.notes || "",
    link: initial?.link || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      return;
    }

    onUpdate({
      id: initial?.id,
      name: formData.name,
      price: parseFloat(formData.price),
      currency: "USD",
      period: formData.period,
      nextBillingDate: formData.nextBillingDate || undefined,
      category: formData.category || undefined,
      notes: formData.notes || undefined,
      link: formData.link || undefined,
    });

    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg border border-white/20 p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Subscription</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Period
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as BillingPeriod })}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Next Billing Date
            </label>
            <input
              type="date"
              value={formData.nextBillingDate}
              onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-gray-700 hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}