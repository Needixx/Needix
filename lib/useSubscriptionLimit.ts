// lib/useSubscriptionLimit.ts
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

interface UserSubscription {
  isPro: boolean;
  subscriptionCount: number;
  maxSubscriptions: number;
  hasReminders: boolean;
  hasAnalytics: boolean;
  hasPriceAlerts: boolean;
}

function useSearchParamsSafe() {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setParams(new URLSearchParams(window.location.search));
    }
  }, []);
  
  return params;
}

export function useSubscriptionLimit() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParamsSafe();
  const [subscription, setSubscription] = useState<UserSubscription>({
    isPro: false,
    subscriptionCount: 0,
    maxSubscriptions: 2,
    hasReminders: false,
    hasAnalytics: false,
    hasPriceAlerts: false,
  });

  useEffect(() => {
    if (status === 'loading' || !session?.user?.email) {
      setSubscription(prev => ({
        ...prev,
        isPro: false,
        maxSubscriptions: 2,
        hasReminders: false,
        hasAnalytics: false,
        hasPriceAlerts: false,
      }));
      return;
    }

    const userEmail = session.user.email;
    
    // Check if user just completed a successful payment
    if (searchParams?.get('success') === 'true') {
      localStorage.setItem(`needix_pro_status_${userEmail}`, 'true');
      localStorage.setItem(`needix_pro_date_${userEmail}`, new Date().toISOString());
      
      // Clear the URL parameter
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/app');
      }
    }

    // Check pro status for this specific user
    const proStatus = localStorage.getItem(`needix_pro_status_${userEmail}`);
    const isPro = proStatus === 'true';
    
    setSubscription(prev => ({
      ...prev,
      isPro,
      maxSubscriptions: isPro ? Infinity : 2,
      hasReminders: isPro,
      hasAnalytics: isPro,
      hasPriceAlerts: isPro,
    }));
  }, [session, searchParams, status]);

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