// lib/useExpenses.ts
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Expense, ExpenseTotals, ExpenseFrequency, ExpenseCategory } from '@/lib/types/expenses';

const KEY = 'needix-expenses';
const MOBILE_KEY = 'needix_mobile_expenses';

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

// Helper functions
function mapCategoryFromApi(cat: string | null | undefined): ExpenseCategory {
  const validCategories: ExpenseCategory[] = [
    'Housing', 'Transportation', 'Utilities', 'Insurance',
    'Food & Groceries', 'Healthcare', 'Debt Payments', 'Childcare',
    'Education', 'Personal Care', 'Entertainment', 'Savings & Investments', 'Other'
  ];
  if (cat && validCategories.includes(cat as ExpenseCategory)) {
    return cat as ExpenseCategory;
  }
  return 'Other';
}

function mapFrequencyFromRecurrence(rec: string): ExpenseFrequency {
  const lower = rec.toLowerCase();
  if (lower.includes('month')) return 'monthly';
  if (lower.includes('week') && !lower.includes('bi')) return 'weekly';
  if (lower.includes('bi-week') || lower.includes('biweek')) return 'bi-weekly';
  if (lower.includes('year')) return 'yearly';
  if (lower.includes('quarter')) return 'quarterly';
  if (lower === 'none') return 'one-time';
  return 'one-time';
}

function mapRecurrenceFromFrequency(freq: ExpenseFrequency): string {
  switch (freq) {
    case 'monthly': return 'monthly';
    case 'weekly': return 'weekly';
    case 'bi-weekly': return 'bi-weekly';
    case 'yearly': return 'yearly';
    case 'quarterly': return 'quarterly';
    case 'one-time': return 'none';
    default: return 'none';
  }
}

export function useExpenses() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (isNative) {
        // Mobile: Load from Capacitor Preferences
        try {
          const { value } = await Preferences.get({ key: MOBILE_KEY });
          if (value) {
            setItems(JSON.parse(value));
          }
        } catch (error) {
          console.error('Error loading mobile expenses:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Web: Load from localStorage then API
        try {
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
      }
    };

    void loadData();
  }, [isNative]);

  const totals = useMemo((): ExpenseTotals => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthly = items.reduce((sum, expense) => {
      if (!expense.isRecurring) return sum;
      switch (expense.frequency) {
        case 'monthly': return sum + expense.amount;
        case 'weekly': return sum + (expense.amount * 52 / 12);
        case 'bi-weekly': return sum + (expense.amount * 26 / 12);
        case 'yearly': return sum + (expense.amount / 12);
        case 'quarterly': return sum + (expense.amount * 4 / 12);
        default: return sum;
      }
    }, 0);

    const yearly = items.reduce((sum, expense) => {
      if (!expense.isRecurring) return sum;
      switch (expense.frequency) {
        case 'monthly': return sum + (expense.amount * 12);
        case 'weekly': return sum + (expense.amount * 52);
        case 'bi-weekly': return sum + (expense.amount * 26);
        case 'yearly': return sum + expense.amount;
        case 'quarterly': return sum + (expense.amount * 4);
        default: return sum;
      }
    }, 0);

    const essential = items.filter(e => e.isEssential).reduce((sum, e) => sum + e.amount, 0);
    const nonEssential = items.filter(e => !e.isEssential).reduce((sum, e) => sum + e.amount, 0);

    const totalThisMonth = items.reduce((sum, expense) => {
      if (expense.frequency === 'one-time' && expense.dueDate) {
        const dueDate = new Date(expense.dueDate);
        if (dueDate >= monthStart && dueDate <= monthEnd) {
          return sum + expense.amount;
        }
      } else if (expense.isRecurring) {
        switch (expense.frequency) {
          case 'monthly': return sum + expense.amount;
          case 'weekly': return sum + (expense.amount * 52 / 12);
          case 'bi-weekly': return sum + (expense.amount * 26 / 12);
          case 'yearly': return sum + (expense.amount / 12);
          case 'quarterly': return sum + (expense.amount * 4 / 12);
          default: return sum;
        }
      }
      return sum;
    }, 0);

    return { monthly, yearly, essential, nonEssential, totalThisMonth };
  }, [items]);

  const persist = async (data: Expense[]) => {
    setItems(data);
    if (isNative) {
      try {
        await Preferences.set({
          key: MOBILE_KEY,
          value: JSON.stringify(data),
        });
      } catch (error) {
        console.error('Failed to save mobile expenses:', error);
      }
    } else {
      localStorage.setItem(KEY, JSON.stringify(data));
    }
  };

  const addExpense = async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isNative) {
      // Mobile: Add locally
      const newExpense: Expense = {
        ...data,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await persist([...items, newExpense]);
    } else {
      // Web: Add via API
      try {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: data.name,
            amount: data.amount,
            currency: data.currency,
            date: data.dueDate || new Date().toISOString(),
            category: data.category,
            recurrence: mapRecurrenceFromFrequency(data.frequency),
            merchant: data.notes,
            isEssential: data.isEssential,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create expense');
        }

        const created = (await response.json()) as ApiExpense;

        const newExpense: Expense = {
          ...data,
          id: created.id,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };

        await persist([...items, newExpense]);
      } catch (error) {
        console.error('Error adding expense:', error);
        const newExpense: Expense = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await persist([...items, newExpense]);
      }
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    if (!isNative) {
      // Web: Update via API
      try {
        const body: Record<string, any> = {};
        if (data.name !== undefined) body.description = data.name;
        if (data.amount !== undefined) body.amount = data.amount;
        if (data.currency !== undefined) body.currency = data.currency;
        if (data.dueDate !== undefined) body.date = data.dueDate;
        if (data.category !== undefined) body.category = data.category;
        if (data.frequency !== undefined) body.recurrence = mapRecurrenceFromFrequency(data.frequency);
        if (data.notes !== undefined) body.merchant = data.notes;
        if (data.isEssential !== undefined) body.isEssential = data.isEssential;

        await fetch(`/api/expenses/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (error) {
        console.error('Error updating expense:', error);
      }
    }

    // Update local state (mobile and web)
    const updated = items.map((expense) =>
      expense.id === id
        ? { ...expense, ...data, updatedAt: new Date().toISOString() }
        : expense
    );
    await persist(updated);
  };

  const deleteExpense = async (id: string) => {
    if (!isNative) {
      // Web: Delete via API
      try {
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }

    // Update local state (mobile and web)
    const updated = items.filter((expense) => expense.id !== id);
    await persist(updated);
  };

  const refresh = async () => {
    if (isNative) {
      // Mobile: Reload from Preferences
      try {
        const { value } = await Preferences.get({ key: MOBILE_KEY });
        if (value) {
          setItems(JSON.parse(value));
        }
      } catch (error) {
        console.error('Error refreshing mobile expenses:', error);
      }
    } else {
      // Web: Refresh from API
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
    }
  };

  return {
    items,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    totals,
    refresh,
  };
}