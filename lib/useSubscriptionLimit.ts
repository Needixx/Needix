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
  isLoading: boolean;
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
    isLoading: true, // Start with loading = true
  });

  // Function to check subscription status with Stripe
  const checkSubscriptionStatus = useCallback(async (userEmail: string) => {
    try {
      const response = await fetch('/api/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        const { isPro } = await response.json();
        
        // Update localStorage with current status
        if (isPro) {
          localStorage.setItem(`needix_pro_status_${userEmail}`, 'true');
        } else {
          localStorage.removeItem(`needix_pro_status_${userEmail}`);
          localStorage.removeItem(`needix_pro_date_${userEmail}`);
        }
        
        return isPro;
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
    
    // Fallback to localStorage
    return localStorage.getItem(`needix_pro_status_${userEmail}`) === 'true';
  }, []);

  useEffect(() => {
    if (status === 'loading') {
      // Keep loading state while session is loading
      return;
    }

    if (!session?.user?.email) {
      // Not logged in - set to free plan and stop loading
      setSubscription(prev => ({
        ...prev,
        isPro: false,
        maxSubscriptions: 2,
        hasReminders: false,
        hasAnalytics: false,
        hasPriceAlerts: false,
        isLoading: false,
      }));
      return;
    }

    const userEmail = session.user.email;
    
    // Check if user just completed a successful payment
    if (searchParams?.get('success') === 'true') {
      localStorage.setItem(`needix_pro_status_${userEmail}`, 'true');
      localStorage.setItem(`needix_pro_date_${userEmail}`, new Date().toISOString());
      
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/app');
      }
    }

    // First, check localStorage immediately for faster initial load
    const cachedStatus = localStorage.getItem(`needix_pro_status_${userEmail}`) === 'true';
    
    // Update with cached status immediately
    setSubscription(prev => ({
      ...prev,
      isPro: cachedStatus,
      maxSubscriptions: cachedStatus ? Infinity : 2,
      hasReminders: cachedStatus,
      hasAnalytics: cachedStatus,
      hasPriceAlerts: cachedStatus,
      isLoading: false, // Stop loading with cached data
    }));

    // Then verify with Stripe in the background
    const checkStatus = async () => {
      const isPro = await checkSubscriptionStatus(userEmail);
      
      setSubscription(prev => ({
        ...prev,
        isPro,
        maxSubscriptions: isPro ? Infinity : 2,
        hasReminders: isPro,
        hasAnalytics: isPro,
        hasPriceAlerts: isPro,
        isLoading: false,
      }));
    };

    checkStatus();

    // Check subscription status every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [session, searchParams, status, checkSubscriptionStatus]);

  const updateSubscriptionCount = useCallback((count: number) => {
    setSubscription(prev => ({ ...prev, subscriptionCount: count }));
  }, []);

  const canAddSubscription = subscription.subscriptionCount < subscription.maxSubscriptions;
  const isAtLimit = subscription.subscriptionCount >= subscription.maxSubscriptions;

  return {
    isPro: subscription.isPro,
    subscriptionCount: subscription.subscriptionCount,
    maxSubscriptions: subscription.maxSubscriptions,
    hasReminders: subscription.hasReminders,
    hasAnalytics: subscription.hasAnalytics,
    hasPriceAlerts: subscription.hasPriceAlerts,
    isLoading: subscription.isLoading,
    canAddSubscription,
    isAtLimit,
    updateSubscriptionCount,
  };
}