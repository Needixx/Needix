// lib/types-orders.ts

export type OrderType = "recurring" | "future" | "one-time";
export type OrderStatus = "active" | "paused" | "completed" | "cancelled";
export type OrderCadence = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface OrderItem {
  id: string;
  type: OrderType;
  name: string; // Using 'name' instead of 'title' for consistency
  category?: string | undefined;
  vendor?: string | undefined; // Using 'vendor' instead of 'retailer' for consistency
  productUrl?: string | undefined; // deep link for Quick Cart
  amount?: number | undefined; // USD for now
  priceCeiling?: number | undefined; // Price Guard target
  currentPrice?: number | undefined; // user-entered current price (manual)
  status: OrderStatus;
  cadence?: OrderCadence | undefined; // for recurring
  nextDate?: string | undefined; // YYYY-MM-DD (recurring)
  scheduledDate?: string | undefined; // YYYY-MM-DD (future)
  usage?: { packSize?: number; unitsPerDay?: number } | undefined;
  leadTimeDays?: number | undefined; // shipping lead time
  envelopeId?: string | undefined; // budget envelope id
  notes?: string | undefined;
  isEssential?: boolean | undefined;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderFormData = {
  name: string;
  type: OrderType;
  amount?: number | undefined;
  currency: string;
  status: OrderStatus;
  scheduledDate?: string | undefined;
  nextDate?: string | undefined;
  priceCeiling?: number | undefined;
  currentPrice?: number | undefined;
  vendor?: string | undefined;
  category?: string | undefined;
  notes?: string | undefined;
  isEssential?: boolean | undefined;
  cadence?: OrderCadence | undefined;
  productUrl?: string | undefined;
  usage?: { packSize?: number; unitsPerDay?: number } | undefined;
  leadTimeDays?: number | undefined;
  envelopeId?: string | undefined;
};