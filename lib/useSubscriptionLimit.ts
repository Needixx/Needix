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
    if (typeof window !== "undefined") {
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
    isLoading: true,
  });

  const checkSubscriptionStatus = useCallback(async (userEmail: string) => {
    try {
      const response = await fetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      if (response.ok) {
        const json: unknown = await response.json();
        const isPro =
          typeof json === "object" &&
          json !== null &&
          "isPro" in json &&
          typeof (json as { isPro: unknown }).isPro !== "undefined"
            ? Boolean((json as { isPro: unknown }).isPro)
            : false;

        if (isPro) {
          localStorage.setItem(`needix_pro_status_${userEmail}`, "true");
        } else {
          localStorage.removeItem(`needix_pro_status_${userEmail}`);
          localStorage.removeItem(`needix_pro_date_${userEmail}`);
        }

        return isPro;
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }

    return localStorage.getItem(`needix_pro_status_${userEmail}`) === "true";
  }, []);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!session?.user?.email) {
      setSubscription((prev) => ({
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

    if (searchParams?.get("success") === "true") {
      localStorage.setItem(`needix_pro_status_${userEmail}`, "true");
      localStorage.setItem(`needix_pro_date_${userEmail}`, new Date().toISOString());

      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/app");
      }
    }

    const cachedStatus =
      localStorage.getItem(`needix_pro_status_${userEmail}`) === "true";

    setSubscription((prev) => ({
      ...prev,
      isPro: cachedStatus,
      maxSubscriptions: cachedStatus ? Number.POSITIVE_INFINITY : 2,
      hasReminders: cachedStatus,
      hasAnalytics: cachedStatus,
      hasPriceAlerts: cachedStatus,
      isLoading: false,
    }));

    const checkStatus = async () => {
      const isPro = await checkSubscriptionStatus(userEmail);
      setSubscription((prev) => ({
        ...prev,
        isPro,
        maxSubscriptions: isPro ? Number.POSITIVE_INFINITY : 2,
        hasReminders: isPro,
        hasAnalytics: isPro,
        hasPriceAlerts: isPro,
        isLoading: false,
      }));
    };

    void checkStatus();

    const interval = setInterval(() => {
      void checkStatus();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session, searchParams, status, checkSubscriptionStatus]);

  const updateSubscriptionCount = useCallback((count: number) => {
    setSubscription((prev) => ({ ...prev, subscriptionCount: count }));
  }, []);

  const canAddSubscription =
    subscription.subscriptionCount < subscription.maxSubscriptions;
  const isAtLimit =
    subscription.subscriptionCount >= subscription.maxSubscriptions;

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
