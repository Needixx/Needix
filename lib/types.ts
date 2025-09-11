// lib/types.ts
export type BillingPeriod = "monthly" | "yearly" | "weekly" | "custom";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: BillingPeriod;
  nextBillingDate?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReorderItem {
  id: string;
  productName: string;
  productUrl?: string;
  vendor: string;
  frequencyDays: number;
  nextOrder: string;
  priceCeiling: number;
}