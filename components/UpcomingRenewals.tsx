"use client";

import { useMemo, useState } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import type { Subscription } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { fmtCurrency } from "@/lib/format";
import {
  EditSubscriptionDialog,
  type SubscriptionFormData,
} from "@/components/AddSubscriptionDialog";
import { useToast } from "@/components/ui/Toast";

function toLocalYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function UpcomingRenewals() {
  const { items, update, remove } = useSubscriptions();
  const toast = useToast();

  // UI state
  const [windowDays, setWindowDays] = useState<number>(30);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [hideNoDate, setHideNoDate] = useState(false);
  const [sortKey, setSortKey] = useState<
    "date_asc" | "date_desc" | "name_asc" | "price_desc"
  >("date_asc");

  const [editing, setEditing] = useState<Subscription | null>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((i) => i.category)
            .filter((c): c is string => typeof c === "string" && c.length > 0),
        ),
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + windowDays);

    return items.filter((s) => {
      if (hideNoDate && !s.nextBillingDate) return false;
      if (category !== "all" && s.category !== category) return false;
      if (query && !s.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (!s.nextBillingDate) return true; // allow when not hiding
      const d = new Date(`${s.nextBillingDate}T00:00:00`);
      return d >= now && d <= end;
    });
  }, [items, hideNoDate, category, query, windowDays]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    return arr.sort((a, b) => {
      if (sortKey === "name_asc") return a.name.localeCompare(b.name);
      if (sortKey === "price_desc") return b.price - a.price;
      const ad = a.nextBillingDate
        ? new Date(`${a.nextBillingDate}T00:00:00`).getTime()
        : Number.POSITIVE_INFINITY;
      const bd = b.nextBillingDate
        ? new Date(`${b.nextBillingDate}T00:00:00`).getTime()
        : Number.POSITIVE_INFINITY;
      return sortKey === "date_desc" ? bd - ad : ad - bd;
    });
  }, [filtered, sortKey]);

  function snooze(sub: Subscription, days: number) {
    const base = sub.nextBillingDate
      ? new Date(`${sub.nextBillingDate}T00:00:00`)
      : new Date();
    base.setDate(base.getDate() + days);
    update(sub.id, { nextBillingDate: toLocalYMD(base) });
    toast(`Snoozed ${sub.name} by ${days}d`, "success");
  }

  function onUpdate(data: SubscriptionFormData & { id?: string }) {
    if (!data.id) return;
    update(data.id, {
      name: data.name,
      price: data.price,
      period: data.period,
      nextBillingDate: data.nextBillingDate,
      category: data.category,
      notes: data.notes,
    });
    setEditing(null);
    toast(`Updated ${data.name}`, "success");
  }

  const nowRef = new Date();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
          value={String(windowDays)}
          onChange={(e) => setWindowDays(Number(e.target.value))}
        >
          <option value="7">Next 7 days</option>
          <option value="14">Next 14 days</option>
          <option value="30">Next 30 days</option>
          <option value="60">Next 60 days</option>
        </select>
        <select
          className="rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-800 px-3 py-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideNoDate}
              onChange={(e) => setHideNoDate(e.target.checked)}
            />
            Hide without date
          </label>
          <select
            className="bg-transparent outline-none text-sm"
            value={sortKey}
            onChange={(e) =>
              setSortKey(
                e.target.value as
                  | "date_asc"
                  | "date_desc"
                  | "name_asc"
                  | "price_desc",
              )
            }
          >
            <option value="date_asc">Soonest first</option>
            <option value="date_desc">Latest first</option>
            <option value="name_asc">Name A→Z</option>
            <option value="price_desc">Price high→low</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-3 py-2 text-left font-normal">Name</th>
              <th className="px-3 py-2 text-left font-normal">Next bill</th>
              <th className="px-3 py-2 text-left font-normal">Price</th>
              <th className="px-3 py-2 text-left font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const date = s.nextBillingDate
                ? new Date(`${s.nextBillingDate}T00:00:00`)
                : null;
              const days =
                date !== null
                  ? Math.ceil((date.getTime() - nowRef.getTime()) / 86400000)
                  : null;
              const daysLabel =
                days === null
                  ? null
                  : days >= 0
                  ? `in ${days} day${days === 1 ? "" : "s"}`
                  : `${Math.abs(days)} days ago`;

              return (
                <tr key={s.id} className="border-t border-white/10">
                  <td className="px-3 py-2">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-white/50">
                      {s.category || "Uncategorized"}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {date ? (
                      <div>
                        <div>{date.toLocaleDateString()}</div>
                        {daysLabel && (
                          <div className="text-xs text-white/50">
                            {daysLabel}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-white/50">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {fmtCurrency(s.price, s.currency)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => snooze(s, 1)}>
                        Snooze 1d
                      </Button>
                      <Button variant="secondary" onClick={() => snooze(s, 3)}>
                        3d
                      </Button>
                      <Button variant="secondary" onClick={() => snooze(s, 7)}>
                        7d
                      </Button>
                      <Button variant="ghost" onClick={() => setEditing(s)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Delete ${s.name}?`)) {
                            remove(s.id);
                            toast(`Deleted ${s.name}`, "success");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-white/60"
                >
                  No renewals match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditSubscriptionDialog
          open
          onOpenChange={(o) => {
            if (!o) setEditing(null);
          }}
          initial={{
            id: editing.id,
            name: editing.name,
            price: editing.price,
            period: editing.period,
            nextBillingDate: editing.nextBillingDate,
            category: editing.category,
            notes: editing.notes,
            currency: "USD",
          }}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
