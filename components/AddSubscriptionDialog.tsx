// components/AddSubscriptionDialog.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import type { BillingPeriod } from "@/lib/types";

const CATEGORIES = [
  'Entertainment',
  'Productivity',
  'News & Media',
  'Business',
  'Health & Fitness',
  'Education',
  'Gaming',
  'Other'
] as const;

export type SubscriptionFormData = {
  name: string;
  price: number;
  currency: "USD";
  period: BillingPeriod;
  nextBillingDate?: string;
  category?: string;
  link?: string;
  notes?: string;
  isEssential?: boolean;
};

interface AddProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: SubscriptionFormData) => void;
}

export default function AddSubscriptionDialog({ open, onOpenChange, onAdd }: AddProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [_currency, _setCurrency] = useState("USD");
  const [category, setCategory] = useState('Other');
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [isEssential, setIsEssential] = useState(false);

  // Calendar state
  const now = useMemo(() => new Date(), []);
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
    
    let nextBillingDate: string | undefined = undefined;
    if (selectedDay) {
      nextBillingDate = new Date(calYear, calMonth, selectedDay).toISOString().split('T')[0];
    }

    onAdd({
      name,
      price: parseFloat(price),
      currency: "USD",
      period,
      nextBillingDate,
      category: category,
      notes,
      link,
      isEssential,
    });

    // Reset form
    setName("");
    setPrice("");
    setCategory('Other');
    setPeriod('monthly');
    setNotes("");
    setLink("");
    setIsEssential(false);
    setSelectedDay(null);
    setCalYear(minYear);
    setCalMonth(minMonth);
  };

  const onClose = () => {
    onOpenChange(false);
    // Reset form when closing
    setName("");
    setPrice("");
    setCategory('Other');
    setPeriod('monthly');
    setNotes("");
    setLink("");
    setIsEssential(false);
    setSelectedDay(null);
    setCalYear(minYear);
    setCalMonth(minMonth);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Add New Subscription
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📺 Service Name</div>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix, Spotify, Adobe Creative Cloud"
              required
            />
          </label>

          {/* Price */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💰 Price</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.99"
                required
              />
            </div>
          </label>

          {/* Period */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🔄 Billing Period</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50"
              value={period}
              onChange={(e) => setPeriod(e.target.value as BillingPeriod)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          {/* Category */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🏷️ Category</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          {/* Calendar Section */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">
              📅 Next Billing Date (optional)
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
                      selected ? "bg-purple-500/20 ring-1 ring-purple-400/50" : "",
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
                ? `📅 Next billing: ${new Date(
                    calYear,
                    calMonth,
                    selectedDay
                  ).toLocaleDateString()}`
                : "Pick the next billing date (cannot select past days)."}
            </div>
          </div>

          {/* Essential Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-neutral-800/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-purple-500 focus:ring-purple-500/50"
              />
              <span className="text-white/80">🔴 Essential subscription (cannot live without)</span>
            </label>
          </div>

          {/* Cancellation Link */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🔗 Cancellation Link (optional)</div>
            <input
              type="url"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://netflix.com/cancelplan"
            />
          </label>

          {/* Notes */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📝 Notes (optional)</div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50 resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Premium plan, family subscription, etc."
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
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              Add Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// EditSubscriptionDialog component (updated with new design)
type InitialData = Partial<SubscriptionFormData> & { id?: string };

interface EditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InitialData;
  onUpdate: (data: SubscriptionFormData & { id?: string }) => void;
}

export function EditSubscriptionDialog({ open, onOpenChange, initial, onUpdate }: EditProps) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [_currency, _setCurrency] = useState("USD");
  const [category, setCategory] = useState(initial?.category || 'Other');
  const [period, setPeriod] = useState<BillingPeriod>(initial?.period || 'monthly');
  const [notes, setNotes] = useState(initial?.notes || "");
  const [link, setLink] = useState(initial?.link || "");
  const [isEssential, setIsEssential] = useState(initial?.isEssential || false);

  // Calendar state
  const now = useMemo(() => new Date(), []);
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  const [calYear, setCalYear] = useState<number>(minYear);
  const [calMonth, setCalMonth] = useState<number>(minMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Initialize calendar with existing date
  useEffect(() => {
    if (initial?.nextBillingDate) {
      const d = new Date(`${initial.nextBillingDate}T00:00:00`);
      if (d >= now) {
        setCalYear(d.getFullYear());
        setCalMonth(d.getMonth());
        setSelectedDay(d.getDate());
      }
    }
  }, [initial?.nextBillingDate, now]);

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
    
    let nextBillingDate: string | undefined = undefined;
    if (selectedDay) {
      nextBillingDate = new Date(calYear, calMonth, selectedDay).toISOString().split('T')[0];
    }

    onUpdate({
      id: initial?.id,
      name,
      price: parseFloat(price),
      currency: "USD",
      period,
      nextBillingDate,
      category: category,
      notes,
      link,
      isEssential,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-2xl font-bold text-white">
          Edit Subscription
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📺 Service Name</div>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix, Spotify, Adobe Creative Cloud"
              required
            />
          </label>

          {/* Price */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💰 Price</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="9.99"
                required
              />
            </div>
          </label>

          {/* Period */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🔄 Billing Period</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50"
              value={period}
              onChange={(e) => setPeriod(e.target.value as BillingPeriod)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          {/* Category */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🏷️ Category</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          {/* Calendar Section */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">
              📅 Next Billing Date (optional)
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
                      selected ? "bg-purple-500/20 ring-1 ring-purple-400/50" : "",
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
                ? `📅 Next billing: ${new Date(
                    calYear,
                    calMonth,
                    selectedDay
                  ).toLocaleDateString()}`
                : "Pick the next billing date (cannot select past days)."}
            </div>
          </div>

          {/* Essential Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-neutral-800/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-purple-500 focus:ring-purple-500/50"
              />
              <span className="text-white/80">🔴 Essential subscription (cannot live without)</span>
            </label>
          </div>

          {/* Cancellation Link */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🔗 Cancellation Link (optional)</div>
            <input
              type="url"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://netflix.com/cancelplan"
            />
          </label>

          {/* Notes */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📝 Notes (optional)</div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50 resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Premium plan, family subscription, etc."
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
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              Update Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}