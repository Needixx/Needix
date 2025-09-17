// components/UpgradeButton.tsx
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
  children = "Upgrade to Pro"
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    
    try {
      console.log('Starting upgrade process...');
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: 'price_1S4Ut40WmSMb2aa0kCC1Bcdb',
          mode: 'subscription',
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      console.log('Session ID received:', sessionId);
      
      if (!sessionId) {
        throw new Error('No session ID received');
      }
      
      // Check if we have the Stripe publishable key
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey) {
        throw new Error('Stripe publishable key not configured');
      }
      
      // Dynamically import Stripe to avoid SSR issues
      const { loadStripe } = await import('@stripe/stripe-js');
      const stripe = await loadStripe(publishableKey);
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }
      
      console.log('Redirecting to Stripe checkout...');
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe checkout error:', error);
        throw new Error(error.message || 'Stripe checkout failed');
      }
      
    } catch (error: unknown) {
      console.error('Upgrade error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Upgrade failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <Button
      variant={variant}
      className={`${sizeClasses[size]} ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleUpgrade}
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