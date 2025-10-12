// components/EditExpenseDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Expense, ExpenseCategory, ExpenseFrequency } from "@/lib/types/expenses";

/* ---------- constants ---------- */
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Housing",
  "Transportation",
  "Utilities",
  "Insurance",
  "Food & Groceries",
  "Healthcare",
  "Debt Payments",
  "Childcare",
  "Education",
  "Personal Care",
  "Entertainment",
  "Savings & Investments",
  "Other",
];

const EXPENSE_FREQUENCIES: ExpenseFrequency[] = [
  "monthly",
  "weekly",
  "yearly",
  "quarterly",
  "bi-weekly",
  "one-time",
];

/* ---------- helpers ---------- */
type Preferences = { currency?: string };

function getSavedCurrency(fallback: string | undefined): string {
  try {
    const prefs = localStorage.getItem("needix_prefs");
    if (prefs) {
      const json: Preferences = JSON.parse(prefs);
      if (json?.currency && typeof json.currency === "string") return json.currency;
    }
  } catch {}
  return fallback || "USD";
}

function symbolForCurrency(code: string): string {
  try {
    const parts = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? "$";
  } catch {
    return "$";
  }
}

// Format a Date as local YYYY-MM-DD without UTC shifting
function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/* ---------- props ---------- */
interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Expense; // expects full Expense (id required)
  onUpdate: (patch: Partial<Expense> & { id: string }) => void;
}

/* ---------- component ---------- */
export default function EditExpenseDialog({
  open,
  onOpenChange,
  initial,
  onUpdate,
}: EditExpenseDialogProps) {
  // form state
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState<string>(initial?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState<string>(initial?.currency ?? "USD");
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? "Other");
  const [frequency, setFrequency] = useState<ExpenseFrequency>(initial?.frequency ?? "monthly");
  const [isRecurring, setIsRecurring] = useState<boolean>(
    initial?.isRecurring ?? frequency !== "one-time"
  );
  const [isEssential, setIsEssential] = useState<boolean>(initial?.isEssential ?? true);
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");

  // calendar state
  const now = useMemo(() => new Date(), []);
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  const [calYear, setCalYear] = useState<number>(minYear);
  const [calMonth, setCalMonth] = useState<number>(minMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // hydrate when opening / when initial changes
  useEffect(() => {
    if (!open) return;

    setName(initial?.name ?? "");
    setAmount(initial?.amount != null ? String(initial.amount) : "");
    setCurrency(getSavedCurrency(initial?.currency));
    setCategory((initial?.category as ExpenseCategory) ?? "Other");
    setFrequency(initial?.frequency ?? "monthly");
    setIsRecurring(initial?.isRecurring ?? (initial?.frequency !== "one-time"));
    setIsEssential(Boolean(initial?.isEssential));
    setNotes(initial?.notes ?? "");

    // calendar init from due/next date (favor nextPaymentDate if recurring)
    const iso = isRecurring
      ? initial?.nextPaymentDate
      : initial?.dueDate ?? initial?.nextPaymentDate;

    if (iso) {
      const d = new Date(`${iso}T00:00:00`);
      const base = d < now ? now : d;
      setCalYear(base.getFullYear());
      setCalMonth(base.getMonth());
      setSelectedDay(d.getDate());
    } else {
      setCalYear(minYear);
      setCalMonth(minMonth);
      setSelectedDay(null);
    }
  }, [open, initial, now, isRecurring, minMonth, minYear]);

  // derived
  const monthLabel = useMemo(
    () =>
      new Date(calYear, calMonth, 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [calYear, calMonth]
  );

  const totalDays = useMemo(() => new Date(calYear, calMonth + 1, 0).getDate(), [calYear, calMonth]);
  const start = useMemo(() => new Date(calYear, calMonth, 1).getDay(), [calYear, calMonth]);
  const canGoPrevMonth =
    calYear > minYear || (calYear === minYear && calMonth > minMonth);

  const isDisabled = (day: number) => {
    const date = new Date(calYear, calMonth, day);
    // disallow past days
    return date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const currencySymbol = useMemo(() => symbolForCurrency(currency), [currency]);

  // handlers
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

  const onClose = () => onOpenChange(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initial?.id) return;

    let chosenDate: string | undefined;
    if (selectedDay) {
      chosenDate = toLocalYMD(new Date(calYear, calMonth, selectedDay));
    }

    // Patch matches your useExpenses.updateExpense expectations
    const patch: Partial<Expense> & { id: string } = {
      id: initial.id,
      name: name.trim(),
      amount: amount ? parseFloat(amount) : undefined,
      currency,
      category,
      frequency: isRecurring ? frequency : ("one-time" as ExpenseFrequency),
      isRecurring,
      isEssential,
      notes: notes.trim() || undefined,
      // For one-time, map chosen date to dueDate; for recurring, to nextPaymentDate
      ...(isRecurring
        ? { nextPaymentDate: chosenDate }
        : { dueDate: chosenDate }),
    };

    onUpdate(patch);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close (X) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full px-2 py-1 text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          ×
        </button>

        <h2 className="mb-6 text-2xl font-bold text-white">Edit Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💰 Expense Name</div>
            <input
              type="text"
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-white/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rent, Groceries, Car Payment"
              required
            />
          </label>

          {/* Amount w/ currency symbol */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💵 Amount</div>
            <div className="relative">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
                aria-hidden
              >
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-white/10 bg-neutral-800 pl-8 pr-3 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-white/50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </label>

          {/* Category */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">🏷️ Category</div>
            <select
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/50"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          {/* Recurring toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-neutral-800/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsRecurring(checked);
                  // if turning off recurring, set frequency to one-time in UI, but preserve previous choice in state if re-enabled
                  if (!checked) setFrequency("one-time");
                  else if (checked && frequency === "one-time") setFrequency("monthly");
                }}
                className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-green-500 focus:ring-green-500/50"
              />
              <span className="text-white/80">🔄 Recurring expense</span>
            </label>
          </div>

          {/* Frequency (only when recurring) */}
          {isRecurring && (
            <label className="block">
              <div className="mb-2 text-sm font-medium text-white/80">📅 Frequency</div>
              <select
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/50"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)}
              >
                {EXPENSE_FREQUENCIES.filter((f) => f !== "one-time").map((freq) => (
                  <option key={freq} value={freq}>
                    {freq.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Calendar */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">
              📅 {isRecurring ? "Next Payment Date" : "Due Date"} (optional)
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                disabled={!canGoPrevMonth}
                className={`rounded-lg px-3 py-2 text-sm ${
                  canGoPrevMonth
                    ? "text-white hover:bg-white/10"
                    : "text-white/30 cursor-not-allowed"
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

            {/* Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                <div key={`hdr-${i}`} className="py-2 text-white/60 font-medium">
                  {d}
                </div>
              ))}

              {Array.from({ length: start }, (_, i) => (
                <div key={`pad-${i}`} />
              ))}

              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const selected = day === selectedDay;
                const disabled = isDisabled(day);
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => setSelectedDay(disabled ? null : day)}
                    className={[
                      "aspect-square rounded-lg text-sm transition-colors",
                      disabled
                        ? "cursor-not-allowed text-white/30"
                        : "text-white hover:bg-white/10",
                      selected ? "bg-green-500/20 ring-1 ring-green-400/50" : "",
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
                ? `📅 ${isRecurring ? "Next payment" : "Due date"}: ${new Date(
                    calYear,
                    calMonth,
                    selectedDay
                  ).toLocaleDateString()}`
                : `Pick the ${isRecurring ? "next payment" : "due"} date (cannot select past days).`}
            </div>
          </div>

          {/* Essential toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-neutral-800/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-red-500 focus:ring-red-500/50"
              />
              <span className="text-white/80">🔴 Essential expense (rent, utilities, etc.)</span>
            </label>
          </div>

          {/* Notes */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">📝 Notes (optional)</div>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/50 placeholder:text-white/50 resize-none"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, reminders, or notes"
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
              className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-semibold text-white hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
            >
              Update Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
