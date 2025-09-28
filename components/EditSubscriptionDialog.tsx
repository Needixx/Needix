// components/EditSubscriptionDialog.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import type { BillingPeriod } from "@/lib/types";

export type SubscriptionFormData = {
  name: string;
  price: number;
  currency: string;
  period: BillingPeriod;
  nextBillingDate?: string;
  category?: string;
  notes?: string;
  link?: string;
  isEssential: boolean;
};

type InitialData = Partial<SubscriptionFormData> & { id?: string };

interface EditSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InitialData;
  onUpdate: (data: SubscriptionFormData & { id?: string }) => void;
}

const CATEGORIES = [
  'Entertainment', 'Software', 'AI Tools', 'Development', 'Storage', 
  'Shopping', 'Productivity', 'Communication', 'Design', 'Other'
] as const;

export function EditSubscriptionDialog({ open, onOpenChange, initial, onUpdate }: EditSubscriptionDialogProps) {
  const toast = useToast();
  
  // Form state
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price?.toString() || "");
  const [currency, setCurrency] = useState(initial?.currency || "USD");
  const [category, setCategory] = useState<string>(initial?.category || 'Other');
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

  // Initialize form with initial data
  useEffect(() => {
    if (initial) {
      setName(initial.name || "");
      setPrice(initial.price?.toString() || "");
      setCurrency(initial.currency || "USD");
      setCategory(initial.category || 'Other');
      setPeriod(initial.period || 'monthly');
      setNotes(initial.notes || "");
      setLink(initial.link || "");
      setIsEssential(initial.isEssential || false);

      // Initialize calendar with existing date
      if (initial.nextBillingDate) {
        const d = new Date(`${initial.nextBillingDate}T00:00:00`);
        if (d >= now) {
          setCalYear(d.getFullYear());
          setCalMonth(d.getMonth());
          setSelectedDay(d.getDate());
        }
      }
    }
  }, [initial, now]);

  const monthLabel = useMemo(
    () =>
      new Date(calYear, calMonth, 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [calYear, calMonth]
  );

  const canGoPrevMonth = calYear > minYear || (calYear === minYear && calMonth > minMonth);
  const canGoNextMonth = calYear < minYear + 2;

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
      currency,
      period,
      nextBillingDate,
      category: category,
      notes,
      link,
      isEssential,
    });
  };

  const onClose = () => {
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
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
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

          {/* Next Billing Date Calendar */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">📅 Next Billing Date (Optional)</div>
            
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={!canGoPrevMonth}
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear(calYear - 1);
                  } else {
                    setCalMonth(calMonth - 1);
                  }
                }}
                className="p-2 text-white/70 hover:text-white disabled:opacity-30"
              >
                ←
              </button>
              <span className="text-white font-medium">{monthLabel}</span>
              <button
                type="button"
                disabled={!canGoNextMonth}
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear(calYear + 1);
                  } else {
                    setCalMonth(calMonth + 1);
                  }
                }}
                className="p-2 text-white/70 hover:text-white disabled:opacity-30"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="p-2 text-white/50 font-medium">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for padding */}
              {Array.from({ length: start }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {/* Calendar days */}
              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const disabled = isDisabled(day);
                const selected = selectedDay === day;
                
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedDay(selected ? null : day)}
                    className={`p-2 rounded-lg transition-colors ${
                      disabled
                        ? 'text-white/20 cursor-not-allowed'
                        : selected
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Website Link */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🔗 Website (Optional)</div>
            <input
              type="url"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://netflix.com"
            />
          </label>

          {/* Notes */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📝 Notes (Optional)</div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50 resize-none"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </label>

          {/* Essential Toggle */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-neutral-800 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
            />
            <span className="text-sm text-white/80">⭐ Mark as Essential</span>
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
              Update Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}