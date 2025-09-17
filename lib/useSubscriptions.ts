// lib/useSubscriptions.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Subscription } from "@/lib/types";

const KEY = "needix.subscriptions.v1";

export function useSubscriptions() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  // Listen for changes from other hook instances (same tab) and other tabs
  useEffect(() => {
    function reload() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
    }
    const internal = () => reload();
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) reload(); };
    window.addEventListener("needix:subscriptions-changed", internal as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("needix:subscriptions-changed", internal as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!loaded) return; // avoid overwriting stored data on first mount
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  function persist(next: Subscription[]) {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("needix:subscriptions-changed"));
    } catch {}
  }

  function add(sub: Omit<Subscription, "id" | "createdAt" | "updatedAt">) {
    const next: Subscription = {
      ...sub,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist([next, ...items]);
  }

  function remove(id: string) {
    persist(items.filter((s) => s.id !== id));
  }

  function update(id: string, patch: Partial<Subscription>) {
    const next = items.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s));
    persist(next);
  }

  function importMany(subs: Subscription[]) {
    persist([...subs, ...items]);
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
