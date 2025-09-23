// lib/useExpenses.ts - FIXED TYPE ERRORS (lines 52, 230, 280)
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Expense, ExpenseTotals, ExpenseFrequency, ExpenseCategory } from '@/lib/types/expenses';

const KEY = 'needix-expenses';

/** Backend expense shape with isEssential */
type ApiExpense = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  date: string;
  merchant?: string | null;
  category?: string | null;
  recurrence: string;
  isEssential: boolean;
  createdAt: string;
  updatedAt: string;
};

export function useExpenses() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const localData = localStorage.getItem(KEY);
        if (localData) {
          try {
            const parsed = JSON.parse(localData) as Expense[];
            setItems(parsed);
          } catch (e) {
            console.error('Error parsing local expenses:', e);
          }
        }

        const response = await fetch('/api/expenses');
        if (response.ok) {
          const backendData = (await response.json()) as ApiExpense[];
          if (Array.isArray(backendData)) {
            const convertedData = backendData.map((expense): Expense => ({
              id: expense.id,
              name: expense.description,
              amount: Number(expense.amount),
              currency: expense.currency,
              category: mapCategoryFromApi(expense.category),
              frequency: mapFrequencyFromRecurrence(expense.recurrence),
              dueDate: expense.date ? new Date(expense.date).toISOString().split('T')[0] : undefined,
              nextPaymentDate:
                expense.recurrence !== 'none'
                  ? expense.date
                    ? new Date(expense.date).toISOString().split('T')[0]
                    : undefined
                  : undefined,
              isRecurring: expense.recurrence !== 'none',
              notes: expense.merchant || undefined,
              isEssential: Boolean(expense.isEssential),
              createdAt: expense.createdAt,
              updatedAt: expense.updatedAt,
            }));
            setItems(convertedData);
            localStorage.setItem(KEY, JSON.stringify(convertedData));
          }
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const totals = useMemo((): ExpenseTotals => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthly = items.reduce((sum, expense) => {
      if (!expense.isRecurring) return sum;
      switch (expense.frequency) {
        case 'monthly': return sum + expense.amount;
        case 'yearly': return sum + expense.amount / 12;
        case 'weekly': return sum + expense.amount * 4.33;
        case 'quarterly': return sum + expense.amount / 3;
        default: return sum;
      }
    }, 0);

    const yearly = monthly * 12;

    const essential = items.filter(e => e.isEssential).reduce((sum, expense) => {
      switch (expense.frequency) {
        case 'monthly': return sum + expense.amount;
        case 'yearly': return sum + expense.amount / 12;
        case 'weekly': return sum + expense.amount * 4.33;
        case 'quarterly': return sum + expense.amount / 3;
        default: return sum;
      }
    }, 0);

    const nonEssential = monthly - essential;

    const totalThisMonth = items.reduce((sum, expense) => {
      if (expense.isRecurring) {
        switch (expense.frequency) {
          case 'monthly': return sum + expense.amount;
          case 'weekly': return sum + expense.amount * 4.33;
          case 'yearly': return sum + expense.amount / 12;
          case 'quarterly': return sum + expense.amount / 3;
          default: return sum;
        }
      } else if (expense.nextPaymentDate) {
        const paymentDate = new Date(expense.nextPaymentDate + "T00:00:00");
        if (paymentDate >= monthStart && paymentDate <= monthEnd) {
          return sum + expense.amount;
        }
      }
      return sum;
    }, 0);

    return { monthly, yearly, essential, nonEssential, totalThisMonth };
  }, [items]);

  const persist = (next: Expense[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addExpense = async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expense.name,
          amount: expense.amount,
          currency: expense.currency,
          date: expense.dueDate ? new Date(expense.dueDate).toISOString() : new Date().toISOString(),
          merchant: expense.notes,
          category: expense.category,
          recurrence: mapFrequencyToRecurrence(expense.frequency),
          isEssential: expense.isEssential || false,
        })
      });

      if (!response.ok) throw new Error('Failed to create expense');

      const created = (await response.json()) as ApiExpense;

      const newExpense: Expense = {
        ...expense,
        id: created.id,
        isEssential: Boolean(created.isEssential),
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      const updated = [...items, newExpense];
      persist(updated);
      return created;
    } catch (error) {
      console.error('Error adding expense:', error);
      const newExpense: Expense = {
        ...expense,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      persist([...items, newExpense]);
      return newExpense;
    }
  };

  const updateExpense = async (id: string, patch: Partial<Expense>) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: patch.name,
          amount: patch.amount,
          currency: patch.currency,
          date: patch.dueDate ? new Date(patch.dueDate).toISOString() : undefined,
          merchant: patch.notes,
          category: patch.category,
          recurrence: patch.frequency ? mapFrequencyToRecurrence(patch.frequency) : undefined,
          isEssential: patch.isEssential,
        })
      });
      if (!response.ok) console.error('Failed to update expense in backend');
    } catch (error) {
      console.error('Error updating expense:', error);
    }

    const next = items.map((expense): Expense =>
      expense.id === id ? { ...expense, ...patch, updatedAt: new Date().toISOString() } : expense
    );
    persist(next);
  };

  const deleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!response.ok) console.error('Failed to delete expense from backend');
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
    persist(items.filter((expense) => expense.id !== id));
  };

  const refresh = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const backendData = (await response.json()) as ApiExpense[];
        if (Array.isArray(backendData)) {
          const convertedData = backendData.map((expense): Expense => ({
            id: expense.id,
            name: expense.description,
            amount: Number(expense.amount),
            currency: expense.currency,
            category: mapCategoryFromApi(expense.category),
            frequency: mapFrequencyFromRecurrence(expense.recurrence),
            dueDate: expense.date ? new Date(expense.date).toISOString().split('T')[0] : undefined,
            nextPaymentDate:
              expense.recurrence !== 'none'
                ? expense.date
                  ? new Date(expense.date).toISOString().split('T')[0]
                  : undefined
                : undefined,
            isRecurring: expense.recurrence !== 'none',
            notes: expense.merchant || undefined,
            isEssential: Boolean(expense.isEssential),
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
          }));
          setItems(convertedData);
          localStorage.setItem(KEY, JSON.stringify(convertedData));
        }
      }
    } catch (error) {
      console.error('Error refreshing expenses:', error);
    }
  };

  return { items, totals, addExpense, updateExpense, deleteExpense, loading, refresh };
}

// Helper functions to map between frontend and backend formats
function mapFrequencyFromRecurrence(recurrence: string): ExpenseFrequency {
  switch (recurrence) {
    case 'weekly': return 'weekly';
    case 'monthly': return 'monthly';
    case 'yearly': return 'yearly';
    case 'none': return 'one-time';
    default: return 'monthly';
  }
}

function mapFrequencyToRecurrence(frequency: ExpenseFrequency): string {
  switch (frequency) {
    case 'weekly': return 'weekly';
    case 'monthly': return 'monthly';
    case 'yearly': return 'yearly';
    case 'quarterly': return 'monthly'; // Map quarterly to monthly for backend
    case 'bi-weekly': return 'weekly'; // Map bi-weekly to weekly for backend
    case 'one-time': return 'none';
    default: return 'monthly';
  }
}

function mapCategoryFromApi(category: string | null | undefined): ExpenseCategory {
  const validCategories: ExpenseCategory[] = [
    'Housing', 'Transportation', 'Utilities', 'Insurance', 
    'Food & Groceries', 'Healthcare', 'Debt Payments', 'Childcare',
    'Education', 'Personal Care', 'Entertainment', 'Savings & Investments', 'Other'
  ];
  
  if (category && validCategories.includes(category as ExpenseCategory)) {
    return category as ExpenseCategory;
  }
  return 'Other';
}