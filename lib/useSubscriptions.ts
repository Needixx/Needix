// lib/useSubscriptions.ts - FINAL DATABASE VERSION
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Subscription, BillingPeriod } from '@/lib/types';

const KEY = 'needix-subscriptions';

/** Backend subscription shape with isEssential */
type ApiSubscription = {
  id: string;
  name: string;
  amount: number | string;
  currency: string;
  interval: string;
  nextBillingAt?: string | null;
  category?: string | null;
  notes?: string | null;
  vendorUrl?: string | null;
  isEssential: boolean;  // ✅ Now included from backend
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

        const localData = localStorage.getItem(KEY);
        if (localData) {
          try {
            const parsed = JSON.parse(localData) as Subscription[];
            setItems(parsed);
          } catch (e) {
            console.error('Error parsing local subscriptions:', e);
          }
        }

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
              nextBillingDate: sub.nextBillingAt ? new Date(sub.nextBillingAt).toISOString().split('T')[0] : undefined,
              category: sub.category ?? undefined,
              notes: sub.notes ?? undefined,
              link: sub.vendorUrl ?? undefined,
              isEssential: Boolean(sub.isEssential),  // ✅ Use actual database value
              createdAt: sub.createdAt,
              updatedAt: sub.updatedAt,
            }));
            setItems(convertedData);
            localStorage.setItem(KEY, JSON.stringify(convertedData));
          }
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
        if (s.period === "monthly") return s.price;
        if (s.period === "yearly") return s.price / 12;
        if (s.period === "weekly") return s.price * (52 / 12);
        return s.price;
      })
      .reduce((a, b) => a + b, 0);
    return { monthly };
  }, [items]);

  const persist = (next: Subscription[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const add = async (subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subscription.name,
          amount: subscription.price,
          currency: subscription.currency,
          interval: mapPeriodToInterval(subscription.period),
          nextBillingAt: subscription.nextBillingDate ? 
            new Date(subscription.nextBillingDate).toISOString() : null,
          category: subscription.category,
          notes: subscription.notes,
          vendorUrl: subscription.link,
          isEssential: subscription.isEssential || false,  // ✅ Send to database
          status: 'active'
        })
      });

      if (!response.ok) throw new Error('Failed to create subscription');

      const created = (await response.json()) as ApiSubscription;

      const newSub: Subscription = {
        ...subscription,
        id: created.id,
        isEssential: Boolean(created.isEssential),  // ✅ Use database value
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      const updated = [...items, newSub];
      persist(updated);
      return created;
    } catch (error) {
      console.error('Error adding subscription:', error);
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
      if (!response.ok) console.error('Failed to delete subscription from backend');
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
          nextBillingAt: patch.nextBillingDate ? new Date(patch.nextBillingDate).toISOString() : undefined,
          category: patch.category,
          notes: patch.notes,
          vendorUrl: patch.link,
          isEssential: patch.isEssential,  // ✅ Send to database
        })
      });
      if (!response.ok) console.error('Failed to update subscription in backend');
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
            nextBillingDate: sub.nextBillingAt ? new Date(sub.nextBillingAt).toISOString().split('T')[0] : undefined,
            category: sub.category ?? undefined,
            notes: sub.notes ?? undefined,
            link: sub.vendorUrl ?? undefined,
            isEssential: Boolean(sub.isEssential),  // ✅ Use database value
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
          }));
          setItems(convertedData);
          localStorage.setItem(KEY, JSON.stringify(convertedData));
        }
      }
    } catch (error) {
      console.error('Error refreshing subscriptions:', error);
    }
  };

  return { items, totals, add, remove, update, importMany, loading, refresh };
}

function mapIntervalToPeriod(interval: string): BillingPeriod {
  switch (interval) {
    case 'weekly': return 'weekly';
    case 'yearly': return 'yearly';
    case 'custom': return 'custom';
    default: return 'monthly';
  }
}

function mapPeriodToInterval(period: BillingPeriod): string {
  switch (period) {
    case 'weekly': return 'weekly';
    case 'yearly': return 'yearly';
    case 'custom': return 'custom';
    default: return 'monthly';
  }
}