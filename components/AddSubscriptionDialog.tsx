"use client";

import { useEffect, useMemo, useState } from "react";
import type { BillingPeriod } from "@/lib/types";
import { Button } from "@/components/ui/Button";

type Preset = {
  label: string;
  name: string;
  price: number;
  period: BillingPeriod;
  category?: string;
  notes?: string;
};

const PRESETS: Preset[] = [
  { label: "Netflix Standard", name: "Netflix", price: 15.49, period: "monthly", category: "Streaming", notes: "Standard plan" },
  { label: "Spotify Premium", name: "Spotify", price: 10.99, period: "monthly", category: "Music" },
  { label: "YouTube Premium", name: "YouTube Premium", price: 13.99, period: "monthly", category: "Video" },
  { label: "Hulu (with ads)", name: "Hulu", price: 7.99, period: "monthly", category: "Streaming" },
  { label: "Amazon Prime Monthly", name: "Amazon Prime", price: 14.99, period: "monthly", category: "Shopping" },
  { label: "ChatGPT Plus", name: "ChatGPT Plus", price: 20, period: "monthly", category: "AI" },
  { label: "Dropbox Plus", name: "Dropbox", price: 11.99, period: "monthly", category: "Cloud storage" },
  { label: "Adobe Creative Cloud", name: "Adobe Creative Cloud", price: 59.99, period: "monthly", category: "Creative" },
  { label: "Microsoft 365 Personal", name: "Microsoft 365", price: 6.99, period: "monthly", category: "Productivity" },
  { label: "Apple iCloud+ 200GB", name: "iCloud+", price: 2.99, period: "monthly", category: "Cloud storage" },
];

const POPULAR_PRICES = [
  1.99, 2.99, 3.99, 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10, 11.99, 12.99, 13.99,
  14.99, 15.99, 19.99, 20, 24.99, 29.99, 49.99, 59.99,
] as const;

const DEFAULT_PRICE: number = POPULAR_PRICES[0] ?? 9.99;

export type SubscriptionFormData = {
  name: string;
  price: number;
  currency: "USD";
  period: BillingPeriod;
  nextBillingDate?: string;
  category?: string;
  notes?: string;
};

type InitialData = Partial<SubscriptionFormData> & { id?: string };

type SubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: InitialData;
  onSave: (data: SubscriptionFormData & { id?: string }) => void;
};

/* Helpers for calendar */
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const startWeekday = (y: number, m: number) => new Date(y, m, 1).getDay(); // 0=Sun..6=Sat

/* A reusable dialog used by both Add and Edit flows */
function SubscriptionDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSave,
}: SubscriptionDialogProps) {
  // form fields
  const [name, setName] = useState<string>(initial?.name ?? "");
  const [priceMode, setPriceMode] = useState<"pick" | "custom">("pick");

  const initialPrice =
    typeof initial?.price === "number" ? Number(initial.price.toFixed(2)) : (POPULAR_PRICES.includes(9.99) ? 9.99 : DEFAULT_PRICE);

  const [pricePick, setPricePick] = useState<number>(initialPrice);
  const [priceCustom, setPriceCustom] = useState<string>(
    typeof initial?.price === "number" && !(POPULAR_PRICES as readonly number[]).includes(Number(initial.price.toFixed(2)))
      ? String(Number(initial.price.toFixed(2)))
      : ""
  );

  const [period, setPeriod] = useState<BillingPeriod>(initial?.period ?? "monthly");
  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");

  // calendar state
  const now = new Date();
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  // If there's an initial nextBillingDate, start the calendar there (clamped to today-or-future for safety)
  const initDate = initial?.nextBillingDate ? new Date(initial.nextBillingDate) : now;
  const startDate = initDate < now ? now : initDate;

  const [calYear, setCalYear] = useState<number>(startDate.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(startDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(
    initial?.nextBillingDate ? new Date(initial.nextBillingDate).getDate() : null
  );

  // When dialog opens in edit mode, rehydrate with the latest initial data
  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setName(initial.name ?? "");
      const rounded = typeof initial.price === "number" ? Number(initial.price.toFixed(2)) : undefined;
      if (typeof rounded === "number" && (POPULAR_PRICES as readonly number[]).includes(rounded)) {
        setPriceMode("pick");
        setPricePick(rounded);
        setPriceCustom("");
      } else if (typeof rounded === "number") {
        setPriceMode("custom");
        setPriceCustom(String(rounded));
        setPricePick(POPULAR_PRICES.includes(9.99) ? 9.99 : DEFAULT_PRICE);
      }
      setPeriod(initial.period ?? "monthly");
      setCategory(initial.category ?? "");
      setNotes(initial.notes ?? "");

      const d = initial.nextBillingDate ? new Date(initial.nextBillingDate) : now;
      const base = d < now ? now : d;
      setCalYear(base.getFullYear());
      setCalMonth(base.getMonth());
      setSelectedDay(initial.nextBillingDate ? d.getDate() : null);
    }
  }, [open, mode, initial]); // eslint-disable-line react-hooks/exhaustive-deps

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

  function applyPreset(p: Preset) {
    setName(p.name);
    setPeriod(p.period);
    setCategory(p.category ?? "");
    setNotes(p.notes ?? "");
    const rounded = Number(p.price.toFixed(2));
    if ((POPULAR_PRICES as readonly number[]).includes(rounded)) {
      setPriceMode("pick");
      setPricePick(rounded);
      setPriceCustom("");
    } else {
      setPriceMode("custom");
      setPriceCustom(String(rounded));
    }
  }

  function handleClose() {
    onOpenChange(false);
  }

  function handleSave() {
    const price =
      priceMode === "pick"
        ? pricePick
        : Number(priceCustom === "" ? NaN : Number(priceCustom).toFixed(2));

    if (!name || !price || Number.isNaN(price)) return;

    let nextBillingDate: string | undefined;
    if (selectedDay) {
      nextBillingDate = new Date(calYear, calMonth, selectedDay).toISOString().slice(0, 10);
    }

    const payload: SubscriptionFormData & { id?: string } = {
      id: initial?.id,
      name,
      price,
      currency: "USD",
      period,
      nextBillingDate,
      category: category || undefined,
      notes: notes || undefined,
    };

    onSave(payload);
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Solid backdrop that fully blocks the page */}
      <div
        className="absolute inset-0 bg-black"
        aria-hidden="true"
      />

      {/* Centered panel */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-neutral-900 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold">
                {mode === "add" ? "🧾 Add subscription" : "🧾 Edit subscription"}
              </h3>
              <p className="text-xs text-white/70">
                Fill details or pick a preset — you can edit later.
              </p>
            </div>
            <button
              aria-label="Close"
              className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={handleClose}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="grid gap-6 p-6 lg:grid-cols-2">
            {/* Left: Form */}
            <div className="space-y-5">
              {/* Presets */}
              <label className="block">
                <div className="mb-1 text-sm text-white/80">⚡ Quick presets</div>
                <select
                  className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (!Number.isNaN(idx) && PRESETS[idx]) applyPreset(PRESETS[idx]);
                    e.currentTarget.selectedIndex = 0;
                  }}
                >
                  <option value="">Choose a preset…</option>
                  {PRESETS.map((p, i) => (
                    <option key={p.label} value={i}>
                      {p.label} — ${p.price.toFixed(2)}/mo
                    </option>
                  ))}
                </select>
              </label>

              {/* Name */}
              <label className="block">
                <div className="mb-1 text-sm text-white/80">Name</div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none placeholder:text-white/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Netflix"
                />
              </label>

              {/* Price (popular / custom) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm text-white/80">💵 Price (USD)</div>
                  <div className="flex gap-2">
                    <select
                      className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none disabled:opacity-60"
                      disabled={priceMode !== "pick"}
                      value={pricePick}
                      onChange={(e) => setPricePick(Number(e.target.value))}
                    >
                      {(POPULAR_PRICES as readonly number[]).map((n) => (
                        <option key={n} value={n}>
                          ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        setPriceMode(priceMode === "pick" ? "custom" : "pick")
                      }
                      className="whitespace-nowrap rounded-xl border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/10"
                      type="button"
                    >
                      {priceMode === "pick" ? "Custom" : "Popular"}
                    </button>
                  </div>
                </label>

                {priceMode === "custom" && (
                  <label className="block">
                    <div className="mb-1 text-sm text-white/80">Custom price ($)</div>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none placeholder:text-white/50"
                      value={priceCustom}
                      onChange={(e) => setPriceCustom(e.target.value)}
                      placeholder="e.g., 12.34"
                    />
                  </label>
                )}
              </div>

              {/* Period & Category */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <div className="mb-1 text-sm text-white/80">Billing period</div>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as BillingPeriod)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>

                <label className="block">
                  <div className="mb-1 text-sm text-white/80">🗂️ Category (optional)</div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none placeholder:text-white/50"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Streaming"
                  />
                </label>
              </div>

              {/* Notes */}
              <label className="block">
                <div className="mb-1 text-sm text-white/80">📝 Notes</div>
                <input
                  className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none placeholder:text-white/50"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details"
                />
              </label>
            </div>

            {/* Right: Inline Calendar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-800 px-3 py-2">
                <button
                  className={`rounded-lg px-2 py-1 text-white/85 hover:bg-white/10 hover:text-white ${
                    !canGoPrevMonth ? "cursor-not-allowed opacity-40 hover:bg-transparent" : ""
                  }`}
                  onClick={goPrevMonth}
                  disabled={!canGoPrevMonth}
                >
                  ←
                </button>
                <div className="text-sm font-medium">{monthLabel}</div>
                <button
                  className="rounded-lg px-2 py-1 text-white/85 hover:bg-white/10 hover:text-white"
                  onClick={goNextMonth}
                >
                  →
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-neutral-800 p-3">
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-white/70">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: start }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}
                  {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    const disabled = isDisabled(day);
                    const selected = selectedDay === day;
                    return (
                      <button
                        key={day}
                        onClick={() => !disabled && setSelectedDay(day)}
                        className={[
                          "aspect-square rounded-lg text-sm",
                          disabled
                            ? "cursor-not-allowed text-white/30"
                            : "text-white hover:bg-white/10",
                          selected ? "bg-white/15 ring-1 ring-white/20" : "",
                        ].join(" ")}
                        disabled={disabled}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-white/70">
                  {selectedDay
                    ? `📅 Next billing date: ${new Date(
                        calYear,
                        calMonth,
                        selectedDay
                      ).toLocaleDateString()}`
                    : "Pick the next billing day (cannot select past days)."}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-neutral-900 px-6 py-4">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{mode === "add" ? "Save" : "Update"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * AddSubscriptionDialog
 * - Uncontrolled convenience wrapper that renders its own trigger button.
 * - Calls `onAdd` when the user saves.
 */
export default function AddSubscriptionDialog({
  onAdd,
}: {
  onAdd: (data: SubscriptionFormData) => void;
}) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add subscription</Button>
      <SubscriptionDialog
        open={open}
        onOpenChange={setOpen}
        mode="add"
        onSave={(d) => {
          // for add, d.id is ignored
          onAdd({
            name: d.name,
            price: d.price,
            currency: "USD",
            period: d.period,
            nextBillingDate: d.nextBillingDate,
            category: d.category,
            notes: d.notes,
          });
        }}
      />
    </>
  );
}

/**
 * EditSubscriptionDialog
 * - Controlled wrapper for editing.
 * - You control `open` and pass `initial` values (including optional `id`).
 * - Calls `onUpdate` with the updated payload (including `id` if provided).
 *
 * Example usage from your dashboard:
 * 
 * <EditSubscriptionDialog
 *   open={isEditOpen}
 *   onOpenChange={setIsEditOpen}
 *   initial={{
 *     id: sub.id,
 *     name: sub.name,
 *     price: sub.price,
 *     period: sub.period,
 *     nextBillingDate: sub.nextBillingDate, // "YYYY-MM-DD"
 *     category: sub.category,
 *     notes: sub.notes,
 *     currency: "USD",
 *   }}
 *   onUpdate={(data) => updateSubscriptionOnServer(data)}
 * />
 */
export function EditSubscriptionDialog({
  open,
  onOpenChange,
  initial,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: InitialData;
  onUpdate: (data: SubscriptionFormData & { id?: string }) => void;
}) {
  return (
    <SubscriptionDialog
      open={open}
      onOpenChange={onOpenChange}
      mode="edit"
      initial={initial}
      onSave={onUpdate}
    />
  );
}
