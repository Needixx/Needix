// components/AddOrderDialog.tsx
"use client";

import { useState, useMemo } from "react";
import { useOrders } from "@/lib/useOrders";
import type { OrderType, OrderCadence } from "@/lib/types-orders";

const ORDER_CATEGORIES = [
  'Electronics',
  'Household',
  'Food & Groceries',
  'Health & Beauty',
  'Clothing & Accessories',
  'Books & Media',
  'Sports & Outdoors',
  'Home & Garden',
  'Office Supplies',
  'Pet Supplies',
  'Auto & Tools',
  'Baby & Kids',
  'Other'
];

const ORDER_CADENCES: OrderCadence[] = [
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
];

/* Calendar helper functions */
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const startWeekday = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0=Sun..6=Sat

// Format a Date as local YYYY-MM-DD without UTC conversion
function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
    category: "Other",
    cadence: "monthly" as OrderCadence,
    notes: "",
  });

  // Calendar state
  const now = new Date();
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  const [calYear, setCalYear] = useState<number>(minYear);
  const [calMonth, setCalMonth] = useState<number>(minMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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
    setSelectedDay(null);
  };

  const goNextMonth = () => {
    const d = new Date(calYear, calMonth, 1);
    d.setMonth(d.getMonth() + 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setSelectedDay(null);
  };

  const totalDays = daysInMonth(calYear, calMonth);
  const start = startWeekday(calYear, calMonth);
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  function isDisabled(day: number) {
    if (calYear < todayY) return true;
    if (calYear === todayY && calMonth < todayM) return true;
    if (calYear === todayY && calMonth === todayM && day < todayD) return true;
    return false;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) {
      return;
    }

    let dateField: string | undefined;
    if (selectedDay) {
      dateField = toLocalYMD(new Date(calYear, calMonth, selectedDay));
    }

    add({
      title: formData.title,
      type: formData.type,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      retailer: formData.retailer || undefined,
      category: formData.category || undefined,
      status: "active",
      cadence: formData.type === "recurring" ? formData.cadence : undefined,
      nextDate: formData.type === "recurring" ? dateField : undefined,
      scheduledDate: formData.type === "future" ? dateField : undefined,
      notes: formData.notes || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-2xl font-bold text-white">Add Order</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📦 Item Name</div>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
              placeholder="e.g., Paper towels, Dog food, Protein powder"
              required
            />
          </label>

          {/* Order Type */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🔄 Order Type</div>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as OrderType })}
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="recurring">🔁 Recurring Order</option>
              <option value="future">📅 Future Order</option>
            </select>
          </label>

          {/* Amount and Retailer */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-2 text-sm font-medium text-white/80">💰 Amount</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                  placeholder="25.99"
                />
              </div>
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-medium text-white/80">🏪 Retailer</div>
              <input
                type="text"
                value={formData.retailer}
                onChange={(e) => setFormData({ ...formData, retailer: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                placeholder="Amazon, Walmart, etc."
              />
            </label>
          </div>

          {/* Frequency (only for recurring orders) */}
          {formData.type === "recurring" && (
            <label className="block">
              <div className="mb-2 text-sm font-medium text-white/80">⏰ Frequency</div>
              <select
                value={formData.cadence}
                onChange={(e) => setFormData({ ...formData, cadence: e.target.value as OrderCadence })}
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {ORDER_CADENCES.map(freq => (
                  <option key={freq} value={freq}>
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Category */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🏷️ Category</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
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

          {/* Notes */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📝 Notes (optional)</div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50 resize-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Brand preferences, size, special instructions, etc."
            />
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-3 text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white hover:from-cyan-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              Add Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}