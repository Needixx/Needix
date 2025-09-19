// components/AddSubscriptionDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import type { BillingPeriod } from "@/lib/types";

const SUBSCRIPTION_CATEGORIES = [
  'Streaming',
  'Music',
  'Software',
  'Cloud Storage',
  'News & Media',
  'Gaming',
  'Productivity',
  'Design Tools',
  'VPN & Security',
  'Communication',
  'Education',
  'Fitness',
  'Finance',
  'Other'
];

const BILLING_PERIODS: BillingPeriod[] = [
  'monthly',
  'yearly',
  'weekly',
  'custom'
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

export default function AddSubscriptionDialog({
  onClose,
}: {
  onClose: () => void;
}) {
  const { add } = useSubscriptions();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState('Other');
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");

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
    
    if (!name.trim() || !price.trim()) return;

    let nextBillingDate: string | undefined;
    if (selectedDay) {
      nextBillingDate = toLocalYMD(new Date(calYear, calMonth, selectedDay));
    }

    const subscriptionData = {
      name: name.trim(),
      price: parseFloat(price),
      currency,
      period,
      nextBillingDate,
      category: category || undefined,
      notes: notes.trim() || undefined,
      link: link.trim() || undefined,
    };

    add(subscriptionData);
    onClose();
  };

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
              {BILLING_PERIODS.map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
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
              {SUBSCRIPTION_CATEGORIES.map(cat => (
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

interface EditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InitialData;
  onUpdate: (data: SubscriptionFormData & { id?: string }) => void;
}

export function EditSubscriptionDialog({ open, onOpenChange, initial, onUpdate }: EditProps) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState(initial?.category || 'Other');
  const [period, setPeriod] = useState<BillingPeriod>(initial?.period || 'monthly');
  const [notes, setNotes] = useState(initial?.notes || "");
  const [link, setLink] = useState(initial?.link || "");

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
    
    if (!name.trim() || !price.trim()) return;

    let nextBillingDate: string | undefined;
    if (selectedDay) {
      nextBillingDate = toLocalYMD(new Date(calYear, calMonth, selectedDay));
    }

    onUpdate({
      id: initial?.id,
      name: name.trim(),
      price: parseFloat(price),
      currency: "USD",
      period,
      nextBillingDate,
      category: category || undefined,
      notes: notes.trim() || undefined,
      link: link.trim() || undefined,
    });

    onOpenChange(false);
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
              {BILLING_PERIODS.map(p => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
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
              {SUBSCRIPTION_CATEGORIES.map(cat => (
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}