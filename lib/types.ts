export type BillingPeriod = "monthly" | "yearly" | "weekly" | "custom";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;           // keep for now (we use "USD")
  period: BillingPeriod;
  nextBillingDate?: string;   // ISO YYYY-MM-DD
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
