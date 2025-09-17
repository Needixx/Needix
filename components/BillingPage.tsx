// components/BillingPage.tsx
"use client";

import { useSession } from "next-auth/react";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function BillingPage() {
  const { data: session } = useSession();
  const { isPro } = useSubscriptionLimit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Billing</h1>
          <p className="text-white/70">Please sign in to view your billing information.</p>
        </div>
      </div>
    );
  }

  const userEmail = session.user.email;
  const proDate = userEmail ? localStorage.getItem(`needix_pro_date_${userEmail}`) : null;

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating portal session for:', userEmail);
      
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email: userEmail }),
      });

      console.log('Portal response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Portal API error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create portal session');
      }
      
      const { url } = await response.json();
      console.log('Portal URL received:', url);
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: unknown) {
      console.error('Error creating portal session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Billing & Subscription
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-lg">⚠</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400">Error</h3>
                <p className="text-white/70">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Plan */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          
          {isPro ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 text-lg">⭐</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    Needix Pro
                  </h3>
                  <p className="text-white/70">$4.99/month • Unlimited subscriptions</p>
                </div>
              </div>
              
              {proDate && (
                <div className="text-sm text-white/60">
                  Subscribed on: {new Date(proDate).toLocaleDateString()}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                  <h4 className="font-medium text-green-400 mb-2">✓ Pro Features Active</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Unlimited subscriptions</li>
                    <li>• Smart reminders & alerts</li>
                    <li>• Price change notifications</li>
                    <li>• Advanced analytics</li>
                    <li>• CSV import/export</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
                
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <h4 className="font-medium text-blue-400 mb-2">💡 What&apos;s Next</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Auto-reorder for essentials</li>
                    <li>• Price protection alerts</li>
                    <li>• Mobile app (coming soon)</li>
                    <li>• API integrations</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center">
                  <span className="text-gray-400 text-lg">📋</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Free Plan</h3>
                  <p className="text-white/70">$0/month • Limited to 2 subscriptions</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
                <h4 className="font-medium text-purple-400 mb-2">🚀 Upgrade to Pro</h4>
                <p className="text-sm text-white/70 mb-3">
                  Get unlimited subscriptions, smart reminders, and advanced features for just $4.99/month.
                </p>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => window.location.href = '/#pricing'}
                >
                  View Pricing
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Billing Management */}
        {isPro && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
            <p className="text-white/70 mb-4">
              Update your payment method, view invoices, or cancel your subscription through Stripe&apos;s secure portal.
            </p>
            
            <Button 
              onClick={handleManageSubscription}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Opening...
                </div>
              ) : (
                'Manage Billing'
              )}
            </Button>
            
            {!isPro && (
              <div className="mt-4 text-sm text-white/60">
                Note: You need an active Pro subscription to access billing management.
              </div>
            )}
          </div>
        )}

        {/* Account Info */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-white/70">Email:</span>
              <span className="text-white">{userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Plan:</span>
              <span className={`font-medium ${isPro ? 'text-cyan-400' : 'text-white'}`}>
                {isPro ? 'Pro' : 'Free'}
              </span>
            </div>
            {proDate && (
              <div className="flex justify-between">
                <span className="text-white/70">Member since:</span>
                <span className="text-white">{new Date(proDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}