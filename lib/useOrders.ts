"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderItem, OrderStatus, OrderCadence } from "@/lib/types-orders";

const KEY = "needix.orders.v1";

export function useOrders() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  function persist(next: OrderItem[]) {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }

  function add(item: Omit<OrderItem, "id" | "createdAt" | "updatedAt">) {
    const rec: OrderItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist([rec, ...items]);
  }

  function update(id: string, patch: Partial<OrderItem>) {
    persist(items.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i)));
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id));
  }

  function skipNext(id: string) {
    const it = items.find((i) => i.id === id);
    if (!it || it.type !== "recurring" || !it.cadence || !it.nextDate) return;
    const d = new Date(`${it.nextDate}T00:00:00`);
    advanceByCadence(d, it.cadence);
    update(id, { nextDate: toYMD(d) });
  }

  const counts = useMemo(() => ({
    active: items.filter((i) => i.status === "active").length,
    paused: items.filter((i) => i.status === "paused").length,
    completed: items.filter((i) => i.status === "completed").length,
  }), [items]);

  return { items, add, update, remove, skipNext, counts };
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function advanceByCadence(d: Date, c: OrderCadence) {
  if (c === "daily") d.setDate(d.getDate() + 1);
  else if (c === "weekly") d.setDate(d.getDate() + 7);
  else if (c === "monthly") d.setMonth(d.getMonth() + 1);
  else if (c === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (c === "yearly") d.setFullYear(d.getFullYear() + 1);
}

