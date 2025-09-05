"use client";

import { useEffect, useMemo, useState } from "react";
import type { Subscription } from "@/lib/types";

const KEY = "needix.subscriptions.v1";

export function useSubscriptions() {
  const [items, setItems] = useState<Subscription[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  function add(sub: Omit<Subscription, "id" | "createdAt" | "updatedAt">) {
    setItems((prev) => [
      {
        ...sub,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  function update(id: string, patch: Partial<Subscription>) {
    setItems((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s))
    );
  }

  function importMany(subs: Subscription[]) {
    setItems((prev) => [...subs, ...prev]);
  }

  const totals = useMemo(() => {
    const monthly = items
      .map((s) => {
        if (s.period === "monthly") return s.price;
        if (s.period === "yearly") return s.price / 12;
        if (s.period === "weekly") return s.price * (52 / 12);
        return s.price; // custom: treat as monthly for now
      })
      .reduce((a, b) => a + b, 0);
    return { monthly };
  }, [items]);

  return { items, add, remove, update, importMany, totals };
}
