// lib/useOrders.ts

"use client";

import { useEffect, useState } from 'react';
import { debug } from './debug';

export interface OrderFormData {
  name: string;
  vendor?: string;
  type: 'one-time' | 'subscription';
  amount?: number;
  currency: string;
  category?: string;
  scheduledDate?: string;
  nextDate?: string;
  notes?: string;
  isEssential?: boolean;
  priceCeiling?: number;
  currentPrice?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  vendor?: string;
  type: 'one-time' | 'subscription';
  status: 'active' | 'completed' | 'cancelled';
  currency: string;
  isEssential: boolean;
  category?: string;
  amount?: number;
  priceCeiling?: number;
  currentPrice?: number;
  scheduledDate?: string;
  nextDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOrder {
  id: string;
  merchant: string;
  total: number;
  currency: string;
  orderDate: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  category?: string;
  isEssential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTotals {
  active: number;
  completed: number;
  monthly: number;
}

const KEY = 'needix-orders';

export function useOrders() {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const persist = (data: OrderItem[]) => {
    setItems(data);
    localStorage.setItem(KEY, JSON.stringify(data));
  };

  const totals: OrderTotals = {
    active: items.filter(item => item.status === 'active').length,
    completed: items.filter(item => item.status === 'completed').length,
    monthly: items
      .filter(item => {
        if (item.status !== 'completed') return false;
        const now = new Date();
        const itemDate = new Date(item.updatedAt);
        return itemDate.getMonth() === now.getMonth() && 
               itemDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, item) => sum + (item.amount || 0), 0)
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        const stored = localStorage.getItem(KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        }

        // Try to fetch from backend
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
              category: order.category || undefined,
              amount: order.total ? Number(order.total) : undefined,
              scheduledDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : undefined,
              notes: order.notes || undefined,
              createdAt: order.createdAt,
              updatedAt: order.updatedAt,
            }));
            setItems(convertedData);
            localStorage.setItem(KEY, JSON.stringify(convertedData));
          }
        }
      } catch (error) {
        debug.error('Error loading orders:', error);
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
          orderDate: formData.scheduledDate ? 
            new Date(formData.scheduledDate).toISOString() : new Date().toISOString(),
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
        vendor: formData.vendor || formData.name,
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
      debug.error('Error adding order:', error);
      const newOrder: OrderItem = {
        id: crypto.randomUUID(),
        name: formData.name,
        vendor: formData.vendor || formData.name,
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
    debug.log('🗑️ Attempting to delete order:', id);
    try {
      const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      debug.log('🗑️ Delete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        debug.error('Failed to delete order from backend:', response.status, errorText);
      } else {
        debug.log('✅ Order deleted from backend successfully');
      }
    } catch (error) {
      debug.error('Error deleting order:', error);
    }
    
    // Update local state regardless of backend result
    const newItems = items.filter((item) => item.id !== id);
    debug.log('💾 Removing order from local state. Before:', items.length, 'After:', newItems.length);
    persist(newItems);
  };

  // New method to mark order as completed
  const markCompleted = async (id: string) => {
    await update(id, { status: 'completed' });
  };

  const update = async (id: string, patch: Partial<OrderItem>) => {
    debug.log('🔄 useOrders.update called with:', { id, patch });
    
    try {
      // Build the API payload with correct field mapping
      const apiPayload: Record<string, any> = {};
      
      // Only include defined fields in the API call
      if (patch.name !== undefined) apiPayload.merchant = patch.name;
      if (patch.amount !== undefined) apiPayload.total = patch.amount;
      if (patch.currency !== undefined) apiPayload.currency = patch.currency;
      if (patch.scheduledDate !== undefined) {
        apiPayload.orderDate = patch.scheduledDate ? 
          new Date(patch.scheduledDate).toISOString() : undefined;
      }
      if (patch.status !== undefined) apiPayload.status = patch.status;
      if (patch.category !== undefined) apiPayload.category = patch.category;
      if (patch.notes !== undefined) apiPayload.notes = patch.notes;
      if (patch.isEssential !== undefined) apiPayload.isEssential = patch.isEssential;

      debug.log('📡 Sending API payload:', JSON.stringify(apiPayload, null, 2));

      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });
      
      debug.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        debug.error('❌ API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} ${errorText}`);
      }
      
      const responseData = await response.json();
      debug.log('✅ API Response:', responseData);
      
    } catch (error) {
      debug.error('❌ Error updating order:', error);
      throw error; // Re-throw so calling code can handle the error
    }

    // Update local state
    const next = items.map((item) =>
      item.id === id
        ? { ...item, ...patch, updatedAt: new Date().toISOString() }
        : item,
    );
    
    debug.log('💾 Updated local state for order:', id, 'new status:', patch.status);
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
            category: order.category || undefined,
            amount: order.total ? Number(order.total) : undefined,
            scheduledDate: order.orderDate ? new Date(order.orderDate).toISOString().split('T')[0] : undefined,
            notes: order.notes || undefined,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          }));
          setItems(convertedData);
          localStorage.setItem(KEY, JSON.stringify(convertedData));
        }
      }
    } catch (error) {
      debug.error('Error refreshing orders:', error);
    }
  };

  return { items, totals, add, remove, update, markCompleted, loading, refresh };
}