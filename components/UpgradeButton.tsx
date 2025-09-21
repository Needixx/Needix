"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface UpgradeButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export default function UpgradeButton({
  variant = "primary",
  size = "md",
  className = "",
  children = "Upgrade to Pro",
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: "price_1S4Ut40WmSMb2aa0kCC1Bcdb",
          mode: "subscription",
        }),
      });

      if (!response.ok) {
        const rawErr: unknown = await response.json();
        const errData =
          rawErr && typeof rawErr === "object"
            ? (rawErr as { error?: string })
            : {};
        throw new Error(errData.error || "Failed to create checkout session");
      }

      const raw: unknown = await response.json();
      const data =
        raw && typeof raw === "object"
          ? (raw as { sessionId?: string; error?: string })
          : {};
      const sessionId = data.sessionId;
      if (!sessionId) throw new Error("No session ID received");

      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) throw new Error("Stripe publishable key not configured");

      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(publishableKey);
      if (!stripe) throw new Error("Failed to load Stripe");

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw new Error(error.message || "Stripe checkout failed");
    } catch (err: unknown) {
      console.error("Upgrade error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error occurred";
      alert(`Upgrade failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <Button
      variant={variant}
      className={`${sizeClasses[size]} ${className} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => void handleUpgrade()}
      disabled={loading}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
