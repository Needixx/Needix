export type OrderType = "recurring" | "future";
export type OrderStatus = "active" | "paused" | "completed";
export type OrderCadence = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface OrderItem {
  id: string;
  type: OrderType;
  title: string;
  category?: string;
  retailer?: string;
  productUrl?: string; // deep link for Quick Cart
  amount?: number; // USD for now
  priceCeiling?: number; // Price Guard target
  currentPrice?: number; // user-entered current price (manual)
  status: OrderStatus;
  cadence?: OrderCadence; // for recurring
  nextDate?: string; // YYYY-MM-DD (recurring)
  scheduledDate?: string; // YYYY-MM-DD (future)
  usage?: { packSize?: number; unitsPerDay?: number };
  leadTimeDays?: number; // shipping lead time
  envelopeId?: string; // budget envelope id
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
