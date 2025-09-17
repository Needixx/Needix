// lib/types/expenses.ts
export interface Expense {
  id: string;
  name: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  frequency: ExpenseFrequency;
  dueDate?: string; // YYYY-MM-DD format
  nextPaymentDate?: string; // YYYY-MM-DD format
  isRecurring: boolean;
  notes?: string;
  isEssential: boolean; // true for necessities like rent, utilities
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