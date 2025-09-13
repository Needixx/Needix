"use client";

import { useEffect, useMemo, useState } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22Z" fill="currentColor"/>
      <path d="M19 17H5c1.5-1.5 2.5-3 2.5-6V9a4.5 4.5 0 1 1 9 0v2c0 3 1 4.5 2.5 6Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

export default function NotificationCenter() {
  const { items } = useSubscriptions();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatches by delaying dynamic counts to client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const upcoming = useMemo(() => {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    return items
      .filter((s) => s.nextBillingDate)
      .map((s) => ({
        id: s.id,
        name: s.name,
        date: new Date(`${s.nextBillingDate}T00:00:00`),
      }))
      .filter((x) => x.date >= now && x.date <= end)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 15);
  }, [items]);

  const count = mounted ? upcoming.length : 0;

  return (
    <div className="relative">
      <button
        className="relative rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white/80 hover:bg-white/10"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl p-3 z-50">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Notifications</div>
            <button className="text-white/50 hover:text-white text-xs" onClick={() => setOpen(false)}>Close</button>
          </div>
          {count === 0 ? (
            <div className="text-sm text-white/60">No upcoming renewals in the next 30 days.</div>
          ) : (
            <ul className="max-h-80 overflow-auto divide-y divide-white/10">
              {upcoming.map((u) => (
                <li key={u.id} className="py-2 text-sm flex items-center justify-between">
                  <span className="truncate pr-2">{u.name}</span>
                  <span className="text-white/60">{u.date.toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 text-xs text-white/50">Shows renewals within 30 days.</div>
        </div>
      )}
    </div>
  );
}
