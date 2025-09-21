"use client";

import { useState, useEffect, useMemo } from "react";
import type { Expense, ExpenseTotals } from "./types/expenses";

const KEY = "needix-expenses";

function isExpenseArray(x: unknown): x is Expense[] {
  return Array.isArray(x);
}

export function useExpenses() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        setItems(isExpenseArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Error parsing saved expenses:", error);
        setItems([]);
      }
    } else {
      setItems([]);
    }
    setLoading(false);
  }, []);

  const totals: ExpenseTotals = useMemo(() => {
    const monthly = items.reduce((sum, expense) => {
      if (!expense.isRecurring) return sum;

      switch (expense.frequency) {
        case "monthly":
          return sum + expense.amount;
        case "weekly":
          return sum + expense.amount * 4.33;
        case "bi-weekly":
          return sum + expense.amount * 2.17;
        case "yearly":
          return sum + expense.amount / 12;
        case "quarterly":
          return sum + expense.amount / 3;
        default:
          return sum;
      }
    }, 0);

    const yearly = monthly * 12;
    const essential = items
      .filter((e) => e.isEssential)
      .reduce((sum, e) => {
        switch (e.frequency) {
          case "monthly":
            return sum + e.amount;
          case "weekly":
            return sum + e.amount * 4.33;
          case "bi-weekly":
            return sum + e.amount * 2.17;
          case "yearly":
            return sum + e.amount / 12;
          case "quarterly":
            return sum + e.amount / 3;
          default:
            return sum;
        }
      }, 0);

    const nonEssential = monthly - essential;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalThisMonth = items.reduce((sum, expense) => {
      if (expense.isRecurring) {
        switch (expense.frequency) {
          case "monthly":
            return sum + expense.amount;
          case "weekly":
            return sum + expense.amount * 4.33;
          case "bi-weekly":
            return sum + expense.amount * 2.17;
          case "yearly":
            return sum + expense.amount / 12;
          case "quarterly":
            return sum + expense.amount / 3;
          default:
            return sum;
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

  const addExpense = (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    persist([...items, newExpense]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = items.map((expense) =>
      expense.id === id
        ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
        : expense,
    );
    persist(updated);
  };

  const deleteExpense = (id: string) => {
    const updated = items.filter((expense) => expense.id !== id);
    persist(updated);
  };

  return {
    items,
    totals,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
  };
}
