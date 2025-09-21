// lib/types.ts

// Subscription types
export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly' | 'weekly' | 'custom';
  nextBillingDate?: string;
  category?: string;
  notes?: string;
  link?: string;
  isEssential?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BillingPeriod = 'monthly' | 'yearly' | 'weekly' | 'custom';

// Order types
export interface Order {
  id: string;
  name: string;
  type: 'one-time' | 'recurring';
  amount?: number;
  currency: string;
  status: 'active' | 'completed' | 'cancelled';
  scheduledDate?: string;
  nextDate?: string;
  priceCeiling?: number;
  currentPrice?: number;
  vendor?: string;
  category?: string;
  notes?: string;
  isEssential?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'active' | 'completed' | 'cancelled';

// Expense types
export interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  frequency: ExpenseFrequency;
  dueDate?: string;
  nextPaymentDate?: string;
  isRecurring: boolean;
  notes?: string;
  isEssential: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 
  | 'Housing' 
  | 'Transportation'
  | 'Utilities'
  | 'Insurance'
  | 'Food & Groceries'
  | 'Healthcare'
  | 'Debt Payments'
  | 'Childcare'
  | 'Education'
  | 'Personal Care'
  | 'Entertainment'
  | 'Savings & Investments'
  | 'Other';

export type ExpenseFrequency = 
  | 'monthly'
  | 'weekly'
  | 'yearly'
  | 'quarterly'
  | 'bi-weekly'
  | 'one-time';

export interface ExpenseTotals {
  monthly: number;
  yearly: number;
  essential: number;
  nonEssential: number;
  totalThisMonth: number;
}

// Reorder/Auto-order types  
export interface ReorderItem {
  id: string;
  productName: string;
  productUrl?: string;
  vendor: string;
  frequencyDays: number;
  nextOrder: string;
  priceCeiling: number;
}