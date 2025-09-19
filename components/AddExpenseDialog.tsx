// components/AddExpenseDialog.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import type { Expense, ExpenseCategory, ExpenseFrequency } from "@/lib/types/expenses";

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Housing',
  'Transportation', 
  'Utilities',
  'Insurance',
  'Food & Groceries',
  'Healthcare',
  'Debt Payments',
  'Childcare',
  'Education',
  'Personal Care',
  'Entertainment',
  'Savings & Investments',
  'Other'
];

const EXPENSE_FREQUENCIES: ExpenseFrequency[] = [
  'monthly',
  'weekly',
  'yearly',
  'quarterly',
  'bi-weekly',
  'one-time'
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

export default function AddExpenseDialog({
  expense,
  onSave,
  onCancel,
}: {
  expense?: Expense | null;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
  const [frequency, setFrequency] = useState<ExpenseFrequency>("monthly");
  const [isRecurring, setIsRecurring] = useState(true);
  const [isEssential, setIsEssential] = useState(true);
  const [notes, setNotes] = useState("");

  // Calendar state
  const now = useMemo(() => new Date(), []);
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  const [calYear, setCalYear] = useState<number>(minYear);
  const [calMonth, setCalMonth] = useState<number>(minMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Populate form if editing existing expense
  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setAmount(expense.amount.toString());
      setCurrency(expense.currency);
      setCategory(expense.category);
      setFrequency(expense.frequency);
      setIsRecurring(expense.isRecurring);
      setIsEssential(expense.isEssential);
      setNotes(expense.notes || "");

      // Set up calendar date
      if (expense.nextPaymentDate) {
        const d = new Date(`${expense.nextPaymentDate}T00:00:00`);
        const base = d < now ? now : d;
        setCalYear(base.getFullYear());
        setCalMonth(base.getMonth());
        setSelectedDay(d.getDate());
      }
    }
  }, [expense, now]);

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
    
    if (!name.trim() || !amount.trim()) return;

    let nextPaymentDate: string | undefined;
    if (selectedDay) {
      nextPaymentDate = toLocalYMD(new Date(calYear, calMonth, selectedDay));
    }

    const expenseData = {
      name: name.trim(),
      amount: parseFloat(amount),
      currency,
      category,
      frequency,
      nextPaymentDate,
      isRecurring,
      isEssential,
      notes: notes.trim() || undefined,
    };

    onSave(expenseData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-neutral-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 text-2xl font-bold text-white">
          {expense ? "Edit Expense" : "Add New Expense"}
        </h2>
        
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

          {/* Amount */}
          <label className="block">
            <div className="mb-2 text-sm font-medium text-white/80">💵 Amount</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
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
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>

          {/* Recurring Toggle */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-neutral-800/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-neutral-700 text-green-500 focus:ring-green-500/50"
              />
              <span className="text-white/80">🔄 Recurring expense</span>
            </label>
          </div>

          {/* Frequency (only for recurring) */}
          {isRecurring && (
            <label className="block">
              <div className="mb-2 text-sm font-medium text-white/80">📅 Frequency</div>
              <select
                className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-green-500/50"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)}
              >
                {EXPENSE_FREQUENCIES.filter(f => f !== 'one-time').map(freq => (
                  <option key={freq} value={freq}>
                    {freq.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Calendar Section */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/80">
              📅 {isRecurring ? 'Next Payment Date' : 'Due Date'} (optional)
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
                ? `📅 ${isRecurring ? 'Next payment' : 'Due date'}: ${new Date(
                    calYear,
                    calMonth,
                    selectedDay
                  ).toLocaleDateString()}`
                : `Pick the ${isRecurring ? 'next payment' : 'due'} date (cannot select past days).`}
            </div>
          </div>

          {/* Essential Toggle */}
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
              onClick={onCancel}
              className="flex-1 rounded-xl border border-white/10 py-3 text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-3 font-semibold text-white hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105"
            >
              {expense ? "Update" : "Add"} Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}