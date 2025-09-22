// lib/useExpenses.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Expense, ExpenseTotals, ExpenseFrequency } from '@/lib/types';

const KEY = 'needix-expenses';

type BackendExpense = {
  id: string;
  description: string;
  amount: number | string;
  currency: string;
  category: string | null;
  recurrence: string;
  date?: string | null;
  notes?: string | null;
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
            const parsedUnknown: unknown = JSON.parse(localData);
            if (Array.isArray(parsedUnknown)) {
              setItems(parsedUnknown as Expense[]);
            }
          } catch (e) {
            console.error('Error parsing local expenses:', e);
          }
        }

        const response = await fetch('/api/expenses');
        if (response.ok) {
          const dataUnknown: unknown = await response.json();
          if (Array.isArray(dataUnknown)) {
            const backendData = dataUnknown as BackendExpense[];
            const convertedData: Expense[] = backendData.map((expense) => ({
              id: expense.id,
              name: expense.description,
              amount: Number(expense.amount),
              currency: expense.currency,
              category: mapBackendCategory(expense.category),
              frequency: mapBackendFrequency(expense.recurrence),
              dueDate: expense.date ? new Date(expense.date).toISOString().split('T')[0] : undefined,
              nextPaymentDate:
                expense.recurrence !== 'none'
                  ? expense.date
                    ? new Date(expense.date).toISOString().split('T')[0]
                    : undefined
                  : undefined,
              isRecurring: expense.recurrence !== 'none',
              notes: expense.notes ?? undefined,
              isEssential: false,
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
          merchant: null,
          category: expense.category,
          recurrence: mapFrequencyToBackend(expense.frequency)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create expense');
      }

      const createdUnknown: unknown = await response.json();
      const created = createdUnknown as { id: string; createdAt: string; updatedAt: string };
      
      const newExpense: Expense = {
        ...expense,
        id: created.id,
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

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: updates.name,
          amount: updates.amount,
          currency: updates.currency,
          date: updates.dueDate ? new Date(updates.dueDate).toISOString() : undefined,
          category: updates.category,
          recurrence: updates.frequency ? mapFrequencyToBackend(updates.frequency) : undefined
        })
      });

      if (!response.ok) {
        console.error('Failed to update expense in backend');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }

    const updated = items.map((expense) =>
      expense.id === id
        ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
        : expense,
    );
    persist(updated);
  };

  const deleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        console.error('Failed to delete expense from backend');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }

    const updated = items.filter((expense) => expense.id !== id);
    persist(updated);
  };

  const refresh = async () => {
    try {
      const response = await fetch('/api/expenses');
      if (response.ok) {
        const dataUnknown: unknown = await response.json();
        if (Array.isArray(dataUnknown)) {
          const backendData = dataUnknown as BackendExpense[];
          const convertedData: Expense[] = backendData.map((expense) => ({
            id: expense.id,
            name: expense.description,
            amount: Number(expense.amount),
            currency: expense.currency,
            category: mapBackendCategory(expense.category),
            frequency: mapBackendFrequency(expense.recurrence),
            dueDate: expense.date ? new Date(expense.date).toISOString().split('T')[0] : undefined,
            nextPaymentDate:
              expense.recurrence !== 'none'
                ? expense.date
                  ? new Date(expense.date).toISOString().split('T')[0]
                  : undefined
                : undefined,
            isRecurring: expense.recurrence !== 'none',
            notes: expense.notes ?? undefined,
            isEssential: false,
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

  return {
    items,
    totals,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh,
  };
}

// Helper functions to map between frontend and backend formats
function mapFrequencyToBackend(frequency: ExpenseFrequency): string {
  switch (frequency) {
    case 'monthly': return 'monthly';
    case 'yearly': return 'yearly';
    case 'weekly': return 'weekly';
    case 'quarterly': return 'custom'; // backend doesn't have quarterly
    case 'bi-weekly': return 'custom';
    case 'one-time': return 'none';
    default: return 'none';
  }
}

function mapBackendFrequency(recurrence: string): ExpenseFrequency {
  switch (recurrence) {
    case 'monthly': return 'monthly';
    case 'yearly': return 'yearly';
    case 'weekly': return 'weekly';
    case 'none': return 'one-time';
    case 'custom': return 'monthly'; // fallback
    default: return 'one-time';
  }
}

// 🔧 Type-safe category mapper (fixes "string not assignable to ExpenseCategory")
function mapBackendCategory(category: string | null): Expense['category'] {
  return (category as Expense['category']) ?? ('Other' as Expense['category']);
}
