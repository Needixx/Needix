// lib/useOrders.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { OrderItem, OrderCadence, OrderFormData } from "@/lib/types-orders";

const KEY = "needix.orders.v1";

function isOrderArray(x: unknown): x is OrderItem[] {
  return Array.isArray(x);
}

// Define legacy order type for migration
interface LegacyOrderItem {
  id: string;
  type?: string;
  title?: string;
  name?: string;
  category?: string;
  retailer?: string;
  vendor?: string;
  productUrl?: string;
  amount?: number;
  priceCeiling?: number;
  currentPrice?: number;
  status?: string;
  cadence?: OrderCadence;
  nextDate?: string;
  scheduledDate?: string;
  usage?: { packSize?: number; unitsPerDay?: number };
  leadTimeDays?: number;
  envelopeId?: string;
  notes?: string;
  isEssential?: boolean;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to migrate old order format to new format
function migrateOrderItem(item: LegacyOrderItem): OrderItem {
  return {
    id: item.id,
    name: item.name || item.title || "Untitled Order",
    vendor: item.vendor || item.retailer,
    type: item.type === "future" ? "one-time" : (item.type as "recurring" | "one-time") || "one-time",
    status: (item.status as "active" | "paused" | "completed" | "cancelled") || "active",
    currency: item.currency || "USD",
    isEssential: item.isEssential ?? false,
    category: item.category,
    productUrl: item.productUrl,
    amount: item.amount,
    priceCeiling: item.priceCeiling,
    currentPrice: item.currentPrice,
    cadence: item.cadence,
    nextDate: item.nextDate,
    scheduledDate: item.scheduledDate,
    usage: item.usage,
    leadTimeDays: item.leadTimeDays,
    envelopeId: item.envelopeId,
    notes: item.notes,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function isLegacyOrderArray(x: unknown): x is LegacyOrderItem[] {
  return Array.isArray(x) && x.every(item => 
    typeof item === 'object' && 
    item !== null && 
    'id' in item && 
    'createdAt' in item
  );
}

export function useOrders() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isLegacyOrderArray(parsed)) {
          // Migrate old format to new format
          const migrated = parsed.map(migrateOrderItem);
          setItems(migrated);
          // Save migrated data back to localStorage
          localStorage.setItem(KEY, JSON.stringify(migrated));
        } else if (isOrderArray(parsed)) {
          setItems(parsed);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setItems([]);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error saving orders:", error);
    }
  }, [items, loaded]);

  function persist(next: OrderItem[]) {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Error persisting orders:", error);
    }
  }

  function add(formData: OrderFormData) {
    const rec: OrderItem = {
      id: crypto.randomUUID(),
      name: formData.name,
      type: formData.type,
      amount: formData.amount,
      currency: formData.currency || "USD",
      status: formData.status || "active",
      scheduledDate: formData.scheduledDate,
      nextDate: formData.nextDate,
      priceCeiling: formData.priceCeiling,
      currentPrice: formData.currentPrice,
      vendor: formData.vendor,
      category: formData.category,
      notes: formData.notes,
      isEssential: formData.isEssential ?? false,
      cadence: formData.cadence,
      productUrl: formData.productUrl,
      usage: formData.usage,
      leadTimeDays: formData.leadTimeDays,
      envelopeId: formData.envelopeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist([rec, ...items]);
  }

  function update(id: string, patch: Partial<OrderFormData & { id: string }>) {
    persist(
      items.map((i) =>
        i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i,
      ),
    );
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id));
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

  function skipNext(id: string) {
    const it = items.find((i) => i.id === id);
    if (!it || it.type !== "recurring" || !it.cadence || !it.nextDate) return;
    const d = new Date(`${it.nextDate}T00:00:00`);
    advanceByCadence(d, it.cadence);
    update(id, { nextDate: toYMD(d) });
  }

  const counts = useMemo(
    () => ({
      active: items.filter((i) => i.status === "active").length,
      paused: items.filter((i) => i.status === "paused").length,
      completed: items.filter((i) => i.status === "completed").length,
      cancelled: items.filter((i) => i.status === "cancelled").length,
    }),
    [items],
  );

  return { items, add, update, remove, skipNext, counts };
}