// components/AddSubscriptionDialog.tsx

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
  link?: string;
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

// Format a Date as local YYYY-MM-DD without UTC conversion
function toLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
      ? String(initial.price)
      : ""
  );
  const [period, setPeriod] = useState<BillingPeriod>(initial?.period ?? "monthly");
  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [link, setLink] = useState<string>(initial?.link ?? "");
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");

  // calendar state
  const now = new Date();
  const minYear = now.getFullYear();
  const minMonth = now.getMonth();

  const [calYear, setCalYear] = useState<number>(minYear);
  const [calMonth, setCalMonth] = useState<number>(minMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Reset form when dialog opens or mode/initial changes
  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      if (typeof initial?.price === "number") {
        const rounded = Number(initial.price.toFixed(2));
        if ((POPULAR_PRICES as readonly number[]).includes(rounded)) {
          setPriceMode("pick");
          setPricePick(rounded);
          setPriceCustom("");
        } else {
          setPriceMode("custom");
          setPriceCustom(String(rounded));
          setPricePick(POPULAR_PRICES.includes(9.99) ? 9.99 : DEFAULT_PRICE);
        }
      } else {
        setPriceMode("pick");
        setPricePick(POPULAR_PRICES.includes(9.99) ? 9.99 : DEFAULT_PRICE);
      }
      setPeriod(initial?.period ?? "monthly");
      setCategory(initial?.category ?? "");
      setLink(initial?.link ?? "");
      setNotes(initial?.notes ?? "");

      // Parse stored date-only strings as local dates to avoid off-by-one
      const d = initial?.nextBillingDate
        ? new Date(`${initial.nextBillingDate}T00:00:00`)
        : now;
      const base = d < now ? now : d;
      setCalYear(base.getFullYear());
      setCalMonth(base.getMonth());
      setSelectedDay(initial?.nextBillingDate ? d.getDate() : null);
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
    setLink("");
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
      // Save as local date string (YYYY-MM-DD) to avoid timezone shifts
      nextBillingDate = toLocalYMD(new Date(calYear, calMonth, selectedDay));
    }

    const payload: SubscriptionFormData & { id?: string } = {
      id: initial?.id,
      name,
      price,
      currency: "USD",
      period,
      nextBillingDate,
      category: category || undefined,
      link: link || undefined,
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

      {/* Centered panel - Mobile optimized */}
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-md sm:max-w-3xl max-h-[95vh] overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-neutral-900 px-4 sm:px-6 py-4">
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

          {/* Body - Mobile-first layout */}
          <div className="p-4 sm:p-6">
            <div className="space-y-5">
              {/* Presets - Enhanced mobile visibility */}
              <label className="block">
                <div className="mb-2 text-sm font-medium text-white/80">⚡ Quick presets</div>
                <select
                  className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none text-base"
                  aria-label="Quick presets for popular services"
                  title="Select a preset to auto-fill subscription details"
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
              <label className="block" htmlFor="sub-name">
                <div className="mb-2 text-sm font-medium text-white/80">Name</div>
                <input
                  id="sub-name"
                  name="sub-name"
                  className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none placeholder:text-white/50 text-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Netflix"
                />
              </label>

              {/* Price */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-white/80">💵 Price (USD)</div>
                  <button
                    onClick={() =>
                      setPriceMode(priceMode === "pick" ? "custom" : "pick")
                    }
                    className="rounded-lg border border-white/10 px-3 py-1 text-sm text-white hover:bg-white/10"
                    type="button"
                  >
                    {priceMode === "pick" ? "Custom" : "Popular"}
                  </button>
                </div>
                
                {priceMode === "pick" ? (
                  <select
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none text-base"
                    id="sub-price-pick"
                    name="sub-price-pick"
                    aria-label="Select popular price"
                    title="Choose from popular subscription prices"
                    value={pricePick}
                    onChange={(e) => setPricePick(Number(e.target.value))}
                  >
                    {(POPULAR_PRICES as readonly number[]).map((n) => (
                      <option key={n} value={n}>
                        ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none placeholder:text-white/50 text-base"
                    id="sub-price-custom"
                    name="sub-price-custom"
                    value={priceCustom}
                    onChange={(e) => setPriceCustom(e.target.value)}
                    placeholder="e.g., 12.34"
                  />
                )}
              </div>

              {/* Period, Category & Manage Link */}
              <div className="grid grid-cols-1 gap-4">
                <label className="block" htmlFor="sub-period">
                  <div className="mb-2 text-sm font-medium text-white/80">Billing period</div>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none text-base"
                    id="sub-period"
                    name="sub-period"
                    aria-label="Select billing period"
                    title="Choose how often you're billed"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as BillingPeriod)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>

                <label className="block" htmlFor="sub-category">
                  <div className="mb-2 text-sm font-medium text-white/80">🗂️ Category (optional)</div>
                  <input
                    id="sub-category"
                    name="sub-category"
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none placeholder:text-white/50 text-base"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Streaming"
                  />
                </label>
                <label className="block">
                  <div className="mb-2 text-sm font-medium text-white/80">🔗 Manage link (optional)</div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none placeholder:text-white/50 text-base"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://provider.com/account/plan"
                  />
                  <div className="mt-1 text-xs text-white/50">Add a quick link to manage/cancel this subscription.</div>
                </label>
              </div>

              {/* Notes */}
              <label className="block" htmlFor="sub-notes">
                <div className="mb-2 text-sm font-medium text-white/80">📝 Notes</div>
                <textarea
                  id="sub-notes"
                  name="sub-notes"
                  className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-3 text-white outline-none placeholder:text-white/50 resize-none text-base"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details"
                />
              </label>

              {/* Calendar - Mobile optimized */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-white/80">📅 Next billing date (optional)</div>
                
                {/* Month navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={goPrevMonth}
                    disabled={!canGoPrevMonth}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      canGoPrevMonth ? "text-white hover:bg-white/10" : "text-white/30 cursor-not-allowed"
                    }`}
                  >
                    ←
                  </button>
                  <div className="text-center font-medium">{monthLabel}</div>
                  <button
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
                        onClick={() => setSelectedDay(disabled ? null : day)}
                        className={[
                          "aspect-square rounded-lg text-sm transition-colors",
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

                <div className="text-xs text-white/70 text-center">
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

          {/* Footer - Sticky on mobile */}
          <div className="sticky bottom-0 z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-white/10 bg-neutral-900 p-4 sm:px-6">
            <Button variant="ghost" onClick={handleClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              {mode === "add" ? "Save" : "Update"}
            </Button>
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
 */
export function EditSubscriptionDialog({
  open,
  onOpenChange,
  initial,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: InitialData;
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
