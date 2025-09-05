export type BillingPeriod = "monthly" | "yearly" | "weekly" | "custom";

export interface Subscription {
  id: string;
  name: string;
  price: number; // in user currency units
  currency: string; // e.g. "USD"
  period: BillingPeriod;
  nextBillingDate?: string; // ISO date
  category?: string; // streaming, productivity, etc.
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
