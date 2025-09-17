// lib/demo.ts
import type { Subscription } from './types';

export const demoSubscriptions: Subscription[] = [
  {
    id: 's1',
    name: 'Netflix',
    price: 15.99,
    currency: 'USD',
    period: 'monthly',
    nextBillingDate: '2025-09-15',
    category: 'Streaming',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 's2',
    name: 'Spotify',
    price: 9.99,
    currency: 'USD',
    period: 'monthly',
    nextBillingDate: '2025-09-18',
    category: 'Music',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Add the missing ReorderItem interface and demo data
export interface ReorderItem {
  id: string;
  productName: string;
  productUrl?: string;
  vendor: string;
  frequencyDays: number;
  nextOrder: string;
  priceCeiling: number;
}

export const demoReorders: ReorderItem[] = [
  { 
    id: 'r1', 
    productName: 'Coffee beans', 
    productUrl: 'https://amazon.com', 
    vendor: 'Amazon', 
    frequencyDays: 30, 
    nextOrder: '2025-09-06', 
    priceCeiling: 15 
  },
];

// Helper function
export function daysUntil(dateISO: string): number {
  const now = new Date();
  const target = new Date(dateISO);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}