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