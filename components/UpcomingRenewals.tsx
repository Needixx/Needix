// components/UpcomingRenewals.tsx
"use client";

import { useMemo, useState } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { Button } from "@/components/ui/Button";
import { fmtCurrency } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";

// Helper function to parse date strings as local dates (avoiding timezone shifts)
function parseLocalDate(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2]!, 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  return new Date(year, month, day);
}

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
      const d = parseLocalDate(s.nextBillingDate);
      return d >= now && d <= end;
    });
  }, [items, hideNoDate, category, query, windowDays]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    return arr.sort((a, b) => {
      if (sortKey === "name_asc") return a.name.localeCompare(b.name);
      if (sortKey === "price_desc") return b.price - a.price;
      const ad = a.nextBillingDate
        ? parseLocalDate(a.nextBillingDate).getTime()
        : Number.POSITIVE_INFINITY;
      const bd = b.nextBillingDate
        ? parseLocalDate(b.nextBillingDate).getTime()
        : Number.POSITIVE_INFINITY;
      return sortKey === "date_desc" ? bd - ad : ad - bd;
    });
  }, [filtered, sortKey]);

  function snooze(sub: typeof items[0], days: number) {
    const base = sub.nextBillingDate
      ? parseLocalDate(sub.nextBillingDate)
      : new Date();
    base.setDate(base.getDate() + days);
    update(sub.id, { nextBillingDate: toLocalYMD(base) });
    toast(`Snoozed ${sub.name} by ${days}d`, "success");
  }

  function onDelete(id: string) {
    const sub = items.find((s) => s.id === id);
    if (sub && confirm(`Delete ${sub.name}?`)) {
      remove(id);
      toast(`Deleted ${sub.name}`, "success");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="mb-2 text-2xl font-bold text-white">Upcoming Renewals</h2>
        <p className="text-white/70">
          Manage your subscription renewal dates and track upcoming payments
        </p>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Window Selection */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Window:</label>
            <select
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-1 text-white focus:ring-2 focus:ring-green-500/50"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-1 text-white focus:ring-2 focus:ring-green-500/50"
            >
              <option value="all">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-white/70">Sort:</label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              className="rounded-lg border border-white/10 bg-neutral-800 px-3 py-1 text-white focus:ring-2 focus:ring-green-500/50"
            >
              <option value="date_asc">Date (earliest first)</option>
              <option value="date_desc">Date (latest first)</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="price_desc">Price (high to low)</option>
            </select>
          </div>

          {/* Hide No Date Toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hideNoDate}
              onChange={(e) => setHideNoDate(e.target.checked)}
              className="rounded border-white/20 bg-neutral-700 text-green-500 focus:ring-green-500/50"
            />
            <span className="text-sm text-white/70">Hide items without dates</span>
          </label>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search subscriptions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-neutral-800 px-4 py-2 text-white placeholder-white/40 focus:ring-2 focus:ring-green-500/50"
        />
      </div>

      {/* Results */}
      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-neutral-800/50 p-6 text-center">
            <p className="text-white/70">No subscriptions found matching your criteria.</p>
          </div>
        ) : (
          sorted.map((sub) => {
            const dueDate = sub.nextBillingDate ? parseLocalDate(sub.nextBillingDate) : null;
            const daysUntil = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            
            return (
              <div
                key={sub.id}
                className="rounded-lg border border-white/10 bg-neutral-800/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{sub.name}</h3>
                      {sub.category && (
                        <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70">
                          {sub.category}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm">
                      <span className="text-green-400">{fmtCurrency(sub.price)}</span>
                      <span className="text-white/60">·</span>
                      <span className="text-white/60">{sub.period}</span>
                      {dueDate && (
                        <>
                          <span className="text-white/60">·</span>
                          <span className={`font-medium ${
                            daysUntil !== null && daysUntil <= 3 ? 'text-red-400' :
                            daysUntil !== null && daysUntil <= 7 ? 'text-yellow-400' :
                            'text-white/70'
                          }`}>
                            {daysUntil !== null ? (
                              daysUntil === 0 ? 'Due today' :
                              daysUntil === 1 ? 'Due tomorrow' :
                              daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                              `Due in ${daysUntil} days`
                            ) : 'No date set'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Snooze Buttons */}
                    {dueDate && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => snooze(sub, 7)}
                          className="text-xs"
                        >
                          +7d
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => snooze(sub, 30)}
                          className="text-xs"
                        >
                          +30d
                        </Button>
                      </>
                    )}
                    
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(sub.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}