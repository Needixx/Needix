// components/EditOrderDialog.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import type { OrderFormData, OrderItem } from "@/lib/types-orders";

const ORDER_CATEGORIES = [
  'Electronics',
  'Home & Garden',
  'Fashion & Apparel',
  'Health & Beauty',
  'Food & Beverages',
  'Books & Media',
  'Sports & Outdoors',
  'Business & Office',
  'Other'
] as const;

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderItem | null;
  onUpdate: (data: OrderFormData & { id: string }) => void;
}

export default function EditOrderDialog({ open, onOpenChange, order, onUpdate }: EditOrderDialogProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    name: "",
    type: "one-time",
    amount: undefined,
    currency: "USD",
    status: "active",
    scheduledDate: undefined,
    nextDate: undefined,
    priceCeiling: undefined,
    currentPrice: undefined,
    vendor: undefined,
    category: undefined,
    notes: undefined,
    isEssential: false,
  });

  // Calendar state
  const now = useMemo(() => new Date(), []);
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  const [calYear, setCalYear] = useState<number>(minYear);
  const [calMonth, setCalMonth] = useState<number>(minMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Initialize form with order data
  useEffect(() => {
    if (order) {
      setFormData({
        name: order.name,
        type: order.type,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        scheduledDate: order.scheduledDate,
        nextDate: order.nextDate,
        priceCeiling: order.priceCeiling,
        currentPrice: order.currentPrice,
        vendor: order.vendor,
        category: order.category,
        notes: order.notes,
        isEssential: order.isEssential || false,
      });

      // Initialize calendar with existing date
      const existingDate = order.type === "recurring" ? order.nextDate : order.scheduledDate;
      if (existingDate) {
        const d = new Date(`${existingDate}T00:00:00`);
        if (d >= now) {
          setCalYear(d.getFullYear());
          setCalMonth(d.getMonth());
          setSelectedDay(d.getDate());
        }
      }
    }
  }, [order, now]);

  const monthLabel = useMemo(
    () =>
      new Date(calYear, calMonth, 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [calYear, calMonth]
  );

  const canGoPrevMonth = calYear > minYear || (calYear === minYear && calMonth > minMonth);

  const goPrevMonth = () => {
    if (!canGoPrevMonth) return;
    const d = new Date(calYear, calMonth, 1);
    d.setMonth(d.getMonth() - 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const goNextMonth = () => {
    const d = new Date(calYear, calMonth, 1);
    d.setMonth(d.getMonth() + 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const start = new Date(calYear, calMonth, 1).getDay();

  const isDisabled = (day: number) => {
    const date = new Date(calYear, calMonth, day);
    return date < now;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;

    let dateField: string | undefined = undefined;
    if (selectedDay) {
      dateField = new Date(calYear, calMonth, selectedDay).toISOString().split('T')[0];
    }

    const submitData: OrderFormData & { id: string } = {
      id: order.id,
      ...formData,
      amount: formData.amount ? Number(formData.amount) : undefined,
      priceCeiling: formData.priceCeiling ? Number(formData.priceCeiling) : undefined,
      currentPrice: formData.currentPrice ? Number(formData.currentPrice) : undefined,
    };

    if (formData.type === "recurring") {
      submitData.nextDate = dateField;
      submitData.scheduledDate = undefined;
    } else {
      submitData.scheduledDate = dateField;
      submitData.nextDate = undefined;
    }

    onUpdate(submitData);
  };

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Edit Order
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📦 Product Name</div>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Protein Powder, Office Chair, MacBook Pro"
              required
            />
          </label>

          {/* Type */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🔄 Order Type</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value as "one-time" | "recurring"})}
            >
              <option value="one-time">One-time purchase</option>
              <option value="recurring">Recurring order</option>
            </select>
          </label>

          {/* Status */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📊 Status</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as "active" | "completed" | "cancelled"})}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          {/* Amount */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💰 Expected Price (optional)</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                value={formData.amount || ""}
                onChange={(e) => setFormData({...formData, amount: e.target.value ? Number(e.target.value) : undefined})}
                placeholder="199.99"
              />
            </div>
          </label>

          {/* Current Price */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💵 Current Market Price (optional)</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                value={formData.currentPrice || ""}
                onChange={(e) => setFormData({...formData, currentPrice: e.target.value ? Number(e.target.value) : undefined})}
                placeholder="179.99"
              />
            </div>
          </label>

          {/* Price Ceiling */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🚨 Price Alert Ceiling (optional)</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                value={formData.priceCeiling || ""}
                onChange={(e) => setFormData({...formData, priceCeiling: e.target.value ? Number(e.target.value) : undefined})}
                placeholder="250.00"
              />
            </div>
            <div className="mt-1 text-xs text-white/60">Get notified when price exceeds this amount</div>
          </label>

          {/* Vendor */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🏪 Vendor (optional)</div>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
              value={formData.vendor || ""}
              onChange={(e) => setFormData({...formData, vendor: e.target.value || undefined})}
              placeholder="e.g., Amazon, Best Buy, Local Store"
            />
          </label>

          {/* Category */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🏷️ Category (optional)</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={formData.category || ""}
              onChange={(e) => setFormData({...formData, category: e.target.value || undefined})}
            >
              <option value="">Select a category</option>
              {ORDER_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          {/* Calendar Section */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">
              📅 {formData.type === "recurring" ? 'Next Order Date' : 'Scheduled Date'} (optional)
            </div>
            
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                disabled={!canGoPrevMonth}
                className={`rounded-lg px-3 py-2 text-sm ${
                  canGoPrevMonth ?
                  "text-white hover:bg-white/10" : "text-white/30 cursor-not-allowed"
                }`}
              >
                ←
              </button>
              <div className="text-center font-medium">{monthLabel}</div>
              <button
                type="button"
                onClick={goNextMonth}
                className="rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10"
              >
                →
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2 text-white/60 font-medium">
                  {d}
                </div>
              ))}

              {Array.from({ length: start }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const selected = day === selectedDay;
                const disabled = isDisabled(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(disabled ? null : day)}
                    className={[
                      "aspect-square rounded-lg text-sm transition-colors",
                      disabled
                        ? "cursor-not-allowed text-white/30"
                        : "text-white hover:bg-white/10",
                      selected ? "bg-cyan-500/20 ring-1 ring-cyan-400/50" : "",
                    ].join(" ")}
                    disabled={disabled}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-white/70 text-center">
              {selectedDay
                ? `📅 ${formData.type === "recurring" ? 'Next order' : 'Scheduled'}: ${new Date(
                    calYear,
                    calMonth,
                    selectedDay
                  ).toLocaleDateString()}`
                : `Pick the ${formData.type === "recurring" ? 'next order' : 'scheduled'} date (cannot select past days).`}
            </div>
          </div>

          {/* Essential Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-neutral-800/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEssential || false}
                onChange={(e) => setFormData({...formData, isEssential: e.target.checked})}
                className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-cyan-500 focus:ring-cyan-500/50"
              />
              <span className="text-white/80">🔴 Essential order (high priority)</span>
            </label>
          </div>

          {/* Notes */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📝 Notes (optional)</div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50 resize-none"
              rows={3}
              value={formData.notes || ""}
              onChange={(e) => setFormData({...formData, notes: e.target.value || undefined})}
              placeholder="Specific model, size, color preferences, etc."
            />
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border border-white/10 py-3 text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white hover:from-cyan-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Update Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}