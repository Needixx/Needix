// components/AddOrderDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type { OrderItem, OrderStatus, OrderCadence } from "@/lib/types-orders";

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

export default function AddOrderDialog({
  order,
  onSave,
  onCancel,
}: {
  order?: OrderItem | null;
  onSave: (order: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"recurring" | "future">("recurring");
  const [status, setStatus] = useState<OrderStatus>("active");
  const [cadence, setCadence] = useState<OrderCadence>("monthly");
  const [category, setCategory] = useState("");
  const [retailer, setRetailer] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [priceCeiling, setPriceCeiling] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calendar state
  const now = new Date();
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  const [calYear, setCalYear] = useState<number>(minYear);
  const [calMonth, setCalMonth] = useState<number>(minMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Populate form if editing
  useEffect(() => {
    if (order) {
      setTitle(order.title);
      setAmount(order.amount?.toString() || "");
      setType(order.type);
      setStatus(order.status);
      setCadence(order.cadence || "monthly");
      setCategory(order.category || "");
      setRetailer(order.retailer || "");
      setProductUrl(order.productUrl || "");
      setPriceCeiling(order.priceCeiling?.toString() || "");
      setCurrentPrice(order.currentPrice?.toString() || "");
      setNotes(order.notes || "");

      // Set up calendar date
      const dateStr = type === 'recurring' ? order.nextDate : order.scheduledDate;
      if (dateStr) {
        const d = new Date(`${dateStr}T00:00:00`);
        const base = d < now ? now : d;
        setCalYear(base.getFullYear());
        setCalMonth(base.getMonth());
        setSelectedDay(d.getDate());
      }
    }
  }, [order, type, now]);

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
    
    if (!title.trim()) return;

    let nextDate: string | undefined;
    let scheduledDate: string | undefined;

    if (selectedDay) {
      const dateString = toLocalYMD(new Date(calYear, calMonth, selectedDay));
      if (type === 'recurring') {
        nextDate = dateString;
      } else {
        scheduledDate = dateString;
      }
    }

    const orderData = {
      title: title.trim(),
      amount: amount ? parseFloat(amount) : undefined,
      type,
      status,
      cadence: type === 'recurring' ? cadence : undefined,
      nextDate,
      scheduledDate,
      category: category.trim() || undefined,
      retailer: retailer.trim() || undefined,
      productUrl: productUrl.trim() || undefined,
      priceCeiling: priceCeiling ? parseFloat(priceCeiling) : undefined,
      currentPrice: currentPrice ? parseFloat(currentPrice) : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(orderData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-2xl font-bold text-white">
          {order ? "Edit Order" : "Add New Order"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📦 Item Name</div>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Office supplies, Groceries"
              required
            />
          </label>

          {/* Amount */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💰 Amount</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </label>

          {/* Order Type */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📋 Order Type</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={type}
              onChange={(e) => {
                setType(e.target.value as "recurring" | "future");
                setSelectedDay(null); // Reset date when type changes
              }}
            >
              <option value="recurring">🔄 Recurring Order</option>
              <option value="future">📅 Future One-time Order</option>
            </select>
          </label>

          {/* Status */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📊 Status</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              <option value="active">✅ Active</option>
              <option value="paused">⏸️ Paused</option>
              <option value="completed">✅ Completed</option>
            </select>
          </label>

          {/* Cadence (for recurring orders) */}
          {type === 'recurring' && (
            <label className="block">
              <div className="mb-2 text-sm font-medium text-white/80">🔄 Frequency</div>
              <select
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50"
                value={cadence} 
                onChange={(e) => setCadence(e.target.value as OrderCadence)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
          )}

          {/* Calendar Section */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">
              📅 {type === 'recurring' ? 'Next Order Date' : 'Scheduled Date'} (optional)
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
                ? `📅 ${type === 'recurring' ? 'Next order' : 'Scheduled'}: ${new Date(
                    calYear,
                    calMonth,
                    selectedDay
                  ).toLocaleDateString()}`
                : `Pick the ${type === 'recurring' ? 'next order' : 'scheduled'} date (cannot select past days).`}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left text-sm text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <span className="font-medium">🔧 Advanced Options</span>
              <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4">
                {/* Category */}
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/80">🏷️ Category</div>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Groceries, Office Supplies"
                  />
                </label>

                {/* Retailer */}
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/80">🏪 Retailer</div>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                    value={retailer}
                    onChange={(e) => setRetailer(e.target.value)}
                    placeholder="e.g., Amazon, Target"
                  />
                </label>

                {/* Product URL */}
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/80">🔗 Product URL</div>
                  <input
                    type="url"
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </label>

                {/* Price Ceiling */}
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/80">📈 Price Ceiling</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                      value={priceCeiling}
                      onChange={(e) => setPriceCeiling(e.target.value)}
                      placeholder="Maximum price"
                    />
                  </div>
                </label>

                {/* Current Price */}
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/80">💲 Current Price</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      placeholder="Current market price"
                    />
                  </div>
                </label>

                {/* Notes */}
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/80">📝 Notes</div>
                  <textarea
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-cyan-500/50 placeholder:text-white/50 resize-none"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Order details, vendor info, special instructions..."
                  />
                </label>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-white/10 py-3 text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3 font-semibold text-white hover:from-cyan-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              {order ? "Update" : "Add"} Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}