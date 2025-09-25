// lib/useSubscriptions.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Subscription, BillingPeriod } from '@/lib/types';

const KEY = 'needix-subscriptions';

/** Backend subscription shape (what our API returns) */
type ApiSubscription = {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  interval: string; // 'monthly' | 'yearly' | 'weekly' | 'custom'
  nextBillingAt?: string | null;
  nextBillingDate?: string | null;
  category?: string | null;
  notes?: string | null;
  vendorUrl?: string | null;
  isEssential?: boolean;
  createdAt: string;
  updatedAt: string;
};

export function useSubscriptions() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1) seed from localStorage so UI isn't empty while we fetch
        const localData = localStorage.getItem(KEY);
        if (localData) {
          try {
            const parsed = JSON.parse(localData) as Subscription[];
            setItems(parsed);
          } catch (e) {
            console.error('Error parsing local subscriptions:', e);
          }
        }

        // 2) fetch from backend and normalize
        const response = await fetch('/api/subscriptions');
        if (response.ok) {
          const backendData = (await response.json()) as ApiSubscription[];
          if (Array.isArray(backendData)) {
            const convertedData = backendData.map((sub) => ({
              id: sub.id,
              name: sub.name,
              price: Number(sub.amount),
              currency: sub.currency,
              period: mapIntervalToPeriod(sub.interval),
              nextBillingDate: normalizeToDateString(sub.nextBillingAt, sub.nextBillingDate),
              category: sub.category ?? undefined,
              notes: sub.notes ?? undefined,
              link: sub.vendorUrl ?? undefined,
              isEssential: Boolean(sub.isEssential),
              createdAt: sub.createdAt,
              updatedAt: sub.updatedAt,
            }));
            setItems(convertedData);
            localStorage.setItem(KEY, JSON.stringify(convertedData));
          }
        } else {
          const text = await response.text().catch(() => '');
          console.warn('GET /api/subscriptions failed:', response.status, text);
        }
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const totals = useMemo(() => {
    const monthly = items
      .map((s) => {
        if (s.period === 'monthly') return s.price;
        if (s.period === 'yearly') return s.price / 12;
        if (s.period === 'weekly') return s.price * (52 / 12);
        return s.price;
      })
      .reduce((a, b) => a + b, 0);
    return { monthly };
  }, [items]);

  const persist = (next: Subscription[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  /** Create a subscription (shows real backend error if it fails) */
  const add = async (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const body = {
        name: subscription.name,
        amount: subscription.price,
        currency: subscription.currency,
        interval: mapPeriodToInterval(subscription.period),
        // send both to be compatible with either server field
        nextBillingAt: subscription.nextBillingDate
          ? new Date(subscription.nextBillingDate).toISOString()
          : null,
        nextBillingDate: subscription.nextBillingDate ?? null,
        category: subscription.category ?? null,
        notes: subscription.notes ?? null,
        vendorUrl: subscription.link ?? null,
        isEssential: Boolean(subscription.isEssential),
      };

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => '');
        throw new Error(
          `Failed to create subscription (${response.status}): ${message || 'No details'}`
        );
      }

      const created = (await response.json()) as ApiSubscription;

      const newSub: Subscription = {
        ...subscription,
        id: created.id,
        isEssential: Boolean(created.isEssential),
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      const updated = [...items, newSub];
      persist(updated);
      return created;
    } catch (error) {
      console.error('Error adding subscription:', error);
      // fail-soft to local cache so the UI continues to work offline
      const newSub: Subscription = {
        ...subscription,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([...items, newSub]);
      return newSub;
    }
  };

  const remove = async (id: string) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.warn('DELETE /api/subscriptions failed:', response.status, text);
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
    persist(items.filter((s) => s.id !== id));
  };

  const update = async (id: string, patch: Partial<Subscription>) => {
    try {
      const response = await fetch(`/api/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: patch.name,
          amount: patch.price,
          currency: patch.currency,
          interval: patch.period ? mapPeriodToInterval(patch.period) : undefined,
          nextBillingAt: patch.nextBillingDate
            ? new Date(patch.nextBillingDate).toISOString()
            : undefined,
          nextBillingDate: patch.nextBillingDate ?? undefined,
          category: patch.category,
          notes: patch.notes,
          vendorUrl: patch.link,
          isEssential: patch.isEssential,
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.warn('PATCH /api/subscriptions failed:', response.status, text);
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
    }

    const next = items.map((s) =>
      s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s
    );
    persist(next);
  };

  const importMany = (subs: Subscription[]) => {
    persist([...subs, ...items]);
  };

  const refresh = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const backendData = (await response.json()) as ApiSubscription[];
        if (Array.isArray(backendData)) {
          const convertedData = backendData.map((sub) => ({
            id: sub.id,
            name: sub.name,
            price: Number(sub.amount),
            currency: sub.currency,
            period: mapIntervalToPeriod(sub.interval),
            nextBillingDate: normalizeToDateString(sub.nextBillingAt, sub.nextBillingDate),
            category: sub.category ?? undefined,
            notes: sub.notes ?? undefined,
            link: sub.vendorUrl ?? undefined,
            isEssential: Boolean(sub.isEssential),
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
          }));
          setItems(convertedData);
          localStorage.setItem(KEY, JSON.stringify(convertedData));
        }
      } else {
        const text = await response.text().catch(() => '');
        console.warn('GET /api/subscriptions (refresh) failed:', response.status, text);
      }
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
    }
  };

  return { items, totals, add, remove, update, importMany, loading, refresh };
}

/** Helpers */

function mapIntervalToPeriod(interval: string): BillingPeriod {
  switch (interval) {
    case 'weekly':
      return 'weekly';
    case 'yearly':
      return 'yearly';
    case 'custom':
      return 'custom';
    default:
      return 'monthly';
  }
}

function mapPeriodToInterval(period: BillingPeriod): string {
  switch (period) {
    case 'weekly':
      return 'weekly';
    case 'yearly':
      return 'yearly';
    case 'custom':
      return 'custom';
    default:
      return 'monthly';
  }
}

/** Prefer a YYYY-MM-DD. We accept either nextBillingAt (ISO) or nextBillingDate (YYYY-MM-DD). */
function normalizeToDateString(
  nextBillingAt?: string | null,
  nextBillingDate?: string | null
): string | undefined {
  if (nextBillingDate) return nextBillingDate;
  if (nextBillingAt) {
    const d = new Date(nextBillingAt);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return undefined;
}
