// lib/ai/schemas.ts
import { z } from "zod";

export const Recurrence = z.enum(["none", "daily", "weekly", "monthly", "yearly", "custom"]);

export const SubscriptionInput = z.object({
  name: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().default("USD"),
  billingInterval: Recurrence.default("monthly"),
  nextBillingDate: z.string().optional(), // ISO
  notes: z.string().optional(),
  category: z.string().optional(),
  vendorUrl: z.string().url().optional(),
  status: z.enum(["active", "paused", "canceled"]).default("active"),
});

export const OrderItemInput = z.object({
  name: z.string(),
  qty: z.number().int().positive().default(1),
  unitPrice: z.number().nonnegative().optional(),
});

export const OrderInput = z.object({
  merchant: z.string(),
  total: z.number().nonnegative(),
  currency: z.string().default("USD"),
  orderDate: z.string().optional(), // ISO
  items: z.array(OrderItemInput).default([]),
  notes: z.string().optional(),
  category: z.string().optional(),
});

export const ExpenseInput = z.object({
  description: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().default("USD"),
  date: z.string().optional(), // ISO
  merchant: z.string().optional(),
  category: z.string().optional(),
  recur: Recurrence.default("none"),
});

export const IntakePayload = z.object({
  subscriptions: z.array(SubscriptionInput).default([]),
  orders: z.array(OrderInput).default([]),
  expenses: z.array(ExpenseInput).default([]),
});

export type IntakePayload = z.infer<typeof IntakePayload>;
export type SubscriptionInputT = z.infer<typeof SubscriptionInput>;
export type OrderInputT = z.infer<typeof OrderInput>;
export type OrderItemInputT = z.infer<typeof OrderItemInput>;
export type ExpenseInputT = z.infer<typeof ExpenseInput>;
