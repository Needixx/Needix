"use client";

import { useEffect, useState } from "react";

export type Envelope = {
  id: string;
  name: string;
  monthlyCap: number; // USD
  reserved: Record<string, number>; // YYYY-MM -> amount
};

const KEY = "needix.envelopes.v1";

function monthKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useEnvelopes() {
  const [items, setItems] = useState<Envelope[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items, loaded]);

  function addEnvelope(name: string, monthlyCap: number) {
    const env: Envelope = { id: crypto.randomUUID(), name, monthlyCap, reserved: {} };
    setItems((prev) => [env, ...prev]);
    return env;
  }

  function reserve(envelopeId: string, amount: number, date = new Date()) {
    if (!amount) return;
    const key = monthKey(date);
    setItems((prev) => prev.map((e) => e.id === envelopeId ? { ...e, reserved: { ...e.reserved, [key]: (e.reserved[key] || 0) + amount } } : e));
  }

  function release(envelopeId: string, amount: number, date = new Date()) {
    if (!amount) return;
    const key = monthKey(date);
    setItems((prev) => prev.map((e) => e.id === envelopeId ? { ...e, reserved: { ...e.reserved, [key]: Math.max(0, (e.reserved[key] || 0) - amount) } } : e));
  }

  function getReserved(envelopeId: string, date = new Date()) {
    const key = monthKey(date);
    const e = items.find((x) => x.id === envelopeId);
    return e ? (e.reserved[key] || 0) : 0;
  }

  return { items, addEnvelope, reserve, release, getReserved };
}

