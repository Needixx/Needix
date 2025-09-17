// lib/useExpenses.ts
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { Expense, ExpenseTotals } from './types/expenses';

// Demo data for development
const DEMO_EXPENSES: Expense[] = [
  {
    id: '1',
    name: 'Rent',
    amount: 1200,
    currency: 'USD',
    category: 'Housing',
    frequency: 'monthly',
    nextPaymentDate: '2025-10-01',
    isRecurring: true,
    isEssential: true,
    notes: 'Apartment rent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Electric Bill',
    amount: 85,
    currency: 'USD',
    category: 'Utilities',
    frequency: 'monthly',
    nextPaymentDate: '2025-10-15',
    isRecurring: true,
    isEssential: true,
    notes: 'Average monthly usage',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Car Payment',
    amount: 350,
    currency: 'USD',
    category: 'Transportation',
    frequency: 'monthly',
    nextPaymentDate: '2025-10-05',
    isRecurring: true,
    isEssential: true,
    notes: 'Honda Civic lease',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Groceries',
    amount: 400,
    currency: 'USD',
    category: 'Food & Groceries',
    frequency: 'monthly',
    isRecurring: false,
    isEssential: true,
    notes: 'Monthly grocery budget',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function useExpenses() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For demo purposes, use local storage
    const saved = localStorage.getItem('needix-expenses');
    if (saved) {
      setItems(JSON.parse(saved));
    } else {
      setItems(DEMO_EXPENSES);
    }
    setLoading(false);
  }, []);

  const totals: ExpenseTotals = useMemo(() => {
    const monthly = items.reduce((sum, expense) => {
      if (!expense.isRecurring) return sum;
      
      switch (expense.frequency) {
        case 'monthly': return sum + expense.amount;
        case 'weekly': return sum + (expense.amount * 4.33);
        case 'bi-weekly': return sum + (expense.amount * 2.17);
        case 'yearly': return sum + (expense.amount / 12);
        case 'quarterly': return sum + (expense.amount / 3);
        default: return sum;
      }
    }, 0);

    const yearly = monthly * 12;
    const essential = items.filter(e => e.isEssential).reduce((sum, e) => {
      switch (e.frequency) {
        case 'monthly': return sum + e.amount;
        case 'weekly': return sum + (e.amount * 4.33);
        case 'bi-weekly': return sum + (e.amount * 2.17);
        case 'yearly': return sum + (e.amount / 12);
        case 'quarterly': return sum + (e.amount / 3);
        default: return sum;
      }
    }, 0);
    
    const nonEssential = monthly - essential;
    
    // Calculate this month's total (including one-time expenses)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const totalThisMonth = items.reduce((sum, expense) => {
      if (expense.isRecurring) {
        switch (expense.frequency) {
          case 'monthly': return sum + expense.amount;
          case 'weekly': return sum + (expense.amount * 4.33);
          case 'bi-weekly': return sum + (expense.amount * 2.17);
          case 'yearly': return sum + (expense.amount / 12);
          case 'quarterly': return sum + (expense.amount / 3);
          default: return sum;
        }
      } else if (expense.nextPaymentDate) {
        const paymentDate = new Date(expense.nextPaymentDate + 'T00:00:00');
        if (paymentDate >= monthStart && paymentDate <= monthEnd) {
          return sum + expense.amount;
        }
      }
      return sum;
    }, 0);

    return { monthly, yearly, essential, nonEssential, totalThisMonth };
  }, [items]);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updated = [...items, newExpense];
    setItems(updated);
    localStorage.setItem('needix-expenses', JSON.stringify(updated));
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = items.map(expense => 
      expense.id === id 
        ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
        : expense
    );
    setItems(updated);
    localStorage.setItem('needix-expenses', JSON.stringify(updated));
  };

  const deleteExpense = (id: string) => {
    const updated = items.filter(expense => expense.id !== id);
    setItems(updated);
    localStorage.setItem('needix-expenses', JSON.stringify(updated));
  };

  return {
    items,
    totals,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense
  };
}