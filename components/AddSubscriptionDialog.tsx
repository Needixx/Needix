// components/AddSubscriptionDialog.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import type { BillingPeriod } from "@/lib/types";

/* ---------------- helpers ---------------- */
const CATEGORIES = [
  "Entertainment",
  "Software",
  "AI Tools",
  "Development",
  "Storage",
  "Shopping",
  "Productivity",
  "Communication",
  "Design",
  "Other",
] as const;

type Preferences = { currency?: string };

function getSavedCurrency(): string {
  try {
    const prefs = localStorage.getItem("needix_prefs");
    if (prefs) {
      const json: Preferences = JSON.parse(prefs);
      if (json?.currency && typeof json.currency === "string") return json.currency;
    }
  } catch {}
  return "USD";
}

function symbolForCurrency(code: string): string {
  try {
    const parts = new Intl.NumberFormat(undefined, { style: "currency", currency: code }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

const getAISettings = () => {
  try {
    const stored = localStorage.getItem("needix_ai");
    return stored ? JSON.parse(stored) : { autoFillForms: false };
  } catch {
    return { autoFillForms: false };
  }
};

/* ---------------- types ---------------- */
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

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: SubscriptionFormData) => void;
}

interface ServiceSuggestion {
  name: string;
  price: number;
  currency: string;
  period: BillingPeriod;
  category: string;
  website: string;
}

/* ===================== Add (Portal) ===================== */
export default function AddSubscriptionDialog({ open, onOpenChange, onAdd }: AddSubscriptionDialogProps) {
  const toast = useToast();

  // Mounted flag for portals (avoids SSR mismatches)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState<string>("Other");
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [isEssential, setIsEssential] = useState(false);

  // currency sync
  useEffect(() => {
    if (open) setCurrency(getSavedCurrency());
  }, [open]);

  // AI auto-fill state
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<ServiceSuggestion | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

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
  const canGoNextMonth = calYear < minYear + 2;

  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const start = new Date(calYear, calMonth, 1).getDay();

  const isDisabled = (day: number) => {
    const date = new Date(calYear, calMonth, day);
    return date < now;
  };

  // AI auto-fill
  const fetchServiceSuggestion = async (serviceName: string) => {
    const aiSettings = getAISettings();
    if (!aiSettings.autoFillForms || !serviceName.trim() || serviceName.length < 3) {
      setSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    setIsLoadingSuggestion(true);
    try {
      const response = await fetch("/api/ai/service-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName }),
      });
      const data = await response.json();

      if (data.suggestion) {
        setSuggestion(data.suggestion);
        setShowSuggestion(true);
      } else {
        setSuggestion(null);
        setShowSuggestion(false);
      }
    } catch (e) {
      console.error("service-info error:", e);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchServiceSuggestion(name);
    }, 500);
    return () => clearTimeout(t);
  }, [name]);

  const applySuggestion = () => {
    if (!suggestion) return;
    setPrice(String(suggestion.price));
    setCurrency(suggestion.currency);
    setPeriod(suggestion.period);
    setCategory(suggestion.category);
    setLink(suggestion.website);
    setShowSuggestion(false);
    toast("Auto-fill applied! ✨", "success");
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCurrency(getSavedCurrency());
    setCategory("Other");
    setPeriod("monthly");
    setNotes("");
    setLink("");
    setIsEssential(false);
    setSelectedDay(null);
    setCalYear(minYear);
    setCalMonth(minMonth);
    setSuggestion(null);
    setShowSuggestion(false);
  };

  const onClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let nextBillingDate: string | undefined = undefined;
    if (selectedDay) {
      nextBillingDate = new Date(calYear, calMonth, selectedDay).toISOString().split("T")[0];
    }
    onAdd({ name, price: parseFloat(price), currency, period, nextBillingDate, category, notes, link, isEssential });
    resetForm();
  };

  // Close on backdrop click
  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !mounted) return null;

  const currencySymbol = symbolForCurrency(currency);

  const dialog = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Close (X) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          ×
        </button>

        <h2 className="mb-6 text-2xl font-bold text-white">Add New Subscription</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name with AI auto-fill */}
          <label className="block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">📺 Service Name</span>
              {isLoadingSuggestion && <span className="text-xs text-purple-400">🤖 Looking up...</span>}
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Netflix, Spotify, Adobe Creative Cloud"
              required
            />

            {showSuggestion && suggestion && (
              <div className="mt-2 rounded-lg border border-purple/20 bg-gradient-to-r from-purple/10 to-cyan/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">🤖 Auto-fill suggestion</div>
                    <div className="text-xs text-white/60">
                      {symbolForCurrency(suggestion.currency)}
                      {suggestion.price}/{suggestion.period} • {suggestion.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="rounded-lg bg-gradient-to-r from-purple to-cyan px-3 py-1 text-xs text-white hover:shadow-lg transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </label>

          {/* Price with currency prefix */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💰 Price</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" aria-hidden>
                {currencySymbol}
              </span>
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

          {/* Billing Period */}
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
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          {/* Next Billing Date */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">📅 Next Billing Date (Optional)</div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={!canGoPrevMonth}
                onClick={() => {
                  if (!canGoPrevMonth) return;
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else {
                    setCalMonth((m) => m - 1);
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
                  if (!canGoNextMonth) return;
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
                className="p-2 text-white/70 hover:text-white disabled:opacity-30"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                <div key={`hdr-${i}-${d}`} className="p-2 text-xs font-medium text-white/50">
                  {d}
                </div>
              ))}

              {Array.from({ length: start }, (_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const disabled = isDisabled(day);
                const selected = selectedDay === day;
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedDay(selected ? null : day)}
                    className={`p-2 rounded-lg transition-colors ${
                      disabled
                        ? "text-white/20 cursor-not-allowed"
                        : selected
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Website */}
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
              className="w-full resize-none rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-purple-500/50 placeholder:text-white/50"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </label>

          {/* Essential */}
          <label className="flex cursor-pointer items-center space-x-3">
            <input
              type="checkbox"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-neutral-800 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-sm text-white/80">⭐ Mark as Essential</span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 py-3 text-white/80 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 transform rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-700 hover:scale-105"
            >
              Add Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render via portal to escape any parent stacking contexts (navbars, transforms, etc.)
  return createPortal(dialog, document.body);
}
