// lib/useComprehensiveLimits.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const FREE_PLAN_LIMITS = {
  subscriptions: 2,
  orders: 2,
  expenses: 2,
} as const;

interface LimitState {
  subscriptions: number;
  orders: number;
  expenses: number;
}

export function useComprehensiveLimits() {
  const { data: session } = useSession();
  const [counts, setCounts] = useState<LimitState>({
    subscriptions: 0,
    orders: 0,
    expenses: 0,
  });

  // Check if user has Pro (you can adapt this to your existing logic)
  const isPro = Boolean(session?.user?.email && session.user.email.includes('pro')); // Replace with your actual Pro check

  // Update counts
  const updateCounts = useCallback((newCounts: Partial<LimitState>) => {
    setCounts(prev => ({ ...prev, ...newCounts }));
  }, []);

  // Check functions
  const canAddSubscription = !isPro ? counts.subscriptions < FREE_PLAN_LIMITS.subscriptions : true;
  const canAddOrder = !isPro ? counts.orders < FREE_PLAN_LIMITS.orders : true;
  const canAddExpense = !isPro ? counts.expenses < FREE_PLAN_LIMITS.expenses : true;

  return {
    // Status
    isPro,
    counts,
    
    // Limits
    limits: FREE_PLAN_LIMITS,
    
    // Can add checks
    canAddSubscription,
    canAddOrder,
    canAddExpense,
    
    // Update function
    updateCounts,
    
    // Helper function for display
    getLimitText: (type: keyof LimitState) => {
      if (isPro) return 'Unlimited';
      return `${counts[type]} of ${FREE_PLAN_LIMITS[type]}`;
    }
  };
}