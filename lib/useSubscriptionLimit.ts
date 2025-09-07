// lib/useSubscriptionLimit.ts
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface UserSubscription {
  isPro: boolean;
  subscriptionCount: number;
  maxSubscriptions: number;
  hasReminders: boolean;
  hasAnalytics: boolean;
  hasPriceAlerts: boolean;
}

export function useSubscriptionLimit() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<UserSubscription>({
    isPro: false,
    subscriptionCount: 0,
    maxSubscriptions: 2,
    hasReminders: false,
    hasAnalytics: false,
    hasPriceAlerts: false,
  });

  useEffect(() => {
    // Check if user just completed a successful payment
    if (searchParams.get('success') === 'true') {
      // Set pro status in localStorage
      localStorage.setItem('needix_pro_status', 'true');
      // Clear the URL parameter
      window.history.replaceState({}, '', '/app');
    }

    // Check pro status from localStorage
    const proStatus = localStorage.getItem('needix_pro_status');
    const isPro = proStatus === 'true';
    
    setSubscription(prev => ({
      ...prev,
      isPro,
      maxSubscriptions: isPro ? Infinity : 2,
      hasReminders: isPro,
      hasAnalytics: isPro,
      hasPriceAlerts: isPro,
    }));
  }, [session, searchParams]);

  const updateSubscriptionCount = useCallback((count: number) => {
    setSubscription(prev => ({ ...prev, subscriptionCount: count }));
  }, []);

  const canAddSubscription = subscription.subscriptionCount < subscription.maxSubscriptions;
  const isAtLimit = subscription.subscriptionCount >= subscription.maxSubscriptions;

  return {
    ...subscription,
    canAddSubscription,
    isAtLimit,
    updateSubscriptionCount,
  };
}