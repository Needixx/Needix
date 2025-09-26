// lib/useOrders.ts - Updated with improved workflow
'use client';

import { useState, useEffect, useMemo } from 'react';
import { OrderStatus } from '@/lib/types';

const KEY = 'needix-orders';

export interface OrderFormData {
  name: string;
  type: 'one-time' | 'recurring';
  amount?: number;
  currency?: string;
  status?: OrderStatus;
  scheduledDate?: string;
  nextDate?: string;
  priceCeiling?: number;
  currentPrice?: number;
  vendor?: string;
  category?: string;
  notes?: string;
  isEssential?: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  vendor?: string;
  type: 'recurring' | 'one-time';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currency: string;
  isEssential: boolean;
  category?: string;
  productUrl?: string;
  amount?: number;
  priceCeiling?: number;
  currentPrice?: number;
  cadence?: string;
  nextDate?: string;
  scheduledDate?: string;
  usage?: string;
  leadTimeDays?: number;
  envelopeId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by our Orders API */
type ApiOrder = {
  id: string;
  merchant: string;
  currency: string;
  category?: string | null;
  total: number | string;
  orderDate?: string | null;
  status?: 'active' | 'completed' | 'cancelled';
  notes?: string | null;
  isEssential: boolean;
  createdAt: string;
  updatedAt: string;
};

export function useOrders() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate totals - only include completed orders
  const totals = useMemo(() => {
    const completedOrders = items.filter(order => order.status === 'completed');
    const monthly = completedOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    return { monthly, completed: completedOrders.length, active: items.filter(o => o.status === 'active').length };
  }, [items]);

  const persist = (next: OrderItem[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const localData = localStorage.getItem(KEY);
        if (localData) {
          try {
            const parsed = JSON.parse(localData) as OrderItem[];
            setItems(parsed);
          } catch (e) {
            console.error('Error parsing local orders:', e);
          }
        }

        const response = await fetch('/api/orders');
        if (response.ok) {
          const backendData = (await response.json()) as ApiOrder[];
          if (Array.isArray(backendData)) {
            const convertedData = backendData.map((order) => ({
              id: order.id,
              name: order.merchant,
              vendor: order.merchant,
              type: 'one-time' as const,
              // Use actual status from API, default to 'active' for new orders
              status: (order.status || 'active') as 'active' | 'completed' | 'cancelled',
              currency: order.currency,
              isEssential: Boolean(order.isEssential),
              category: order.category ?? undefined,
              amount: Number(order.total),
              scheduledDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : undefined,
              notes: order.notes ?? undefined,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
            }));
            setItems(convertedData);
            localStorage.setItem(KEY, JSON.stringify(convertedData));
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const add = async (formData: OrderFormData) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: formData.name,
          total: formData.amount || 0,
          currency: formData.currency || 'USD',
          orderDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : new Date().toISOString(),
          status: 'active', // Always start as active
          category: formData.category,
          notes: formData.notes,
          isEssential: formData.isEssential || false,
          items: []
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const created = (await response.json()) as ApiOrder;

      const newOrder: OrderItem = {
        id: created.id,
        name: formData.name,
        vendor: formData.vendor,
        type: formData.type,
        status: 'active', // Always start as active
        currency: formData.currency || 'USD',
        isEssential: Boolean(created.isEssential),
        category: formData.category,
        amount: formData.amount,
        priceCeiling: formData.priceCeiling,
        currentPrice: formData.currentPrice,
        scheduledDate: formData.scheduledDate,
        nextDate: formData.nextDate,
        notes: formData.notes,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      const updated = [...items, newOrder];
      persist(updated);
      return created;
    } catch (error) {
      console.error('Error adding order:', error);
      const newOrder: OrderItem = {
        id: crypto.randomUUID(),
        name: formData.name,
        vendor: formData.vendor,
        type: formData.type,
        status: 'active', // Always start as active
        currency: formData.currency || 'USD',
        isEssential: formData.isEssential || false,
        category: formData.category,
        amount: formData.amount,
        priceCeiling: formData.priceCeiling,
        currentPrice: formData.currentPrice,
        scheduledDate: formData.scheduledDate,
        nextDate: formData.nextDate,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([...items, newOrder]);
      return newOrder;
    }
  };

  const remove = async (id: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (!response.ok) console.error('Failed to delete order from backend');
    } catch (error) {
      console.error('Error deleting order:', error);
    }
    persist(items.filter((item) => item.id !== id));
  };

  // New method to mark order as completed
  const markCompleted = async (id: string) => {
    await update(id, { status: 'completed' });
  };

  const update = async (id: string, patch: Partial<OrderItem>) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: patch.name,
          total: patch.amount,
          currency: patch.currency,
          orderDate: patch.scheduledDate ? new Date(patch.scheduledDate).toISOString() : undefined,
          status: patch.status,
          category: patch.category,
          notes: patch.notes,
          isEssential: patch.isEssential,
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update order in backend:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }

    const next = items.map((item) =>
      item.id === id
        ? { ...item, ...patch, updatedAt: new Date().toISOString() }
        : item,
    );
    persist(next);
  };

  const refresh = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const backendData = (await response.json()) as ApiOrder[];
        if (Array.isArray(backendData)) {
          const convertedData = backendData.map((order) => ({
            id: order.id,
            name: order.merchant,
            vendor: order.merchant,
            type: 'one-time' as const,
            status: (order.status || 'active') as 'active' | 'completed' | 'cancelled',
            currency: order.currency,
            isEssential: Boolean(order.isEssential),
            category: order.category ?? undefined,
            amount: Number(order.total),
            scheduledDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : undefined,
            notes: order.notes ?? undefined,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          }));
          setItems(convertedData);
          localStorage.setItem(KEY, JSON.stringify(convertedData));
        }
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    }
  };

  return { items, totals, add, remove, update, markCompleted, loading, refresh };
}