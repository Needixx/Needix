// components/settings/IntegrationsSettings.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IntegrationSettings } from "@/components/settings/types";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import GmailScannerDialog from "./GmailScannerDialog";

interface IntegrationsSettingsProps {
  integrations: IntegrationSettings;
  setIntegrations: React.Dispatch<React.SetStateAction<IntegrationSettings>>;
}

const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({ integrations, setIntegrations }) => {
  const { data: session } = useSession();
  const { isPro } = useSubscriptionLimit();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showGmailScanner, setShowGmailScanner] = useState(false);

  const updateIntegrations = (updates: Partial<IntegrationSettings>) => {
    const newSettings = { ...integrations, ...updates };
    setIntegrations(newSettings);
    localStorage.setItem("needix_integrations", JSON.stringify(newSettings));
  };

  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (session?.user) {
        try {
          const googleResponse = await fetch("/api/integrations/google/status");
          if (googleResponse.ok) {
            const { connected } = await googleResponse.json();
            updateIntegrations({ googleConnected: connected });
          }

          if (isPro) {
            const plaidResponse = await fetch("/api/integrations/plaid/status");
            if (plaidResponse.ok) {
              const { connected } = await plaidResponse.json();
              updateIntegrations({ plaidConnected: connected });
            }
          }
        } catch (error) {
          console.error("Error checking integrations:", error);
        }
      }
    };
    checkGoogleConnection();
  }, [session, isPro]);

  useEffect(() => {
    const checkForGoogleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('google_connected') === 'true') {
        toast("Google account connected successfully!", "success");
        updateIntegrations({ googleConnected: true });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    checkForGoogleCallback();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data.type === 'OAUTH_SUCCESS') {
        if (event.data.success && event.data.googleConnected) {
          updateIntegrations({ googleConnected: true });
          toast("Google account connected successfully!", "success");
        } else {
          toast("Failed to connect Google account", "error");
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnectGoogle = async () => {
    setLoading("google");
    try {
      const popup = window.open(
        "/api/integrations/google/link",
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );
      if (popup) {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setLoading(null);
          }
        }, 1000);
      } else {
        window.location.href = "/api/integrations/google/link";
      }
    } catch (error) {
      console.error("Error connecting Google:", error);
      toast("Failed to connect Google account", "error");
      setLoading(null);
    }
  };

  const handleScanGmail = () => {
    setShowGmailScanner(true);
  };

  const handleDisconnectGoogle = async () => {
    setLoading("google");
    try {
      const response = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
      });
      if (response.ok) {
        updateIntegrations({ googleConnected: false });
        toast("Google account disconnected", "success");
      } else {
        const error = await response.json();
        toast(error.message || "Failed to disconnect Google account", "error");
      }
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      toast("Failed to disconnect Google account", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleWebPushToggle = async () => {
    if (!integrations.webPushSupported) {
      toast("Push notifications are not supported in this browser", "error");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateIntegrations({ webPushSupported: true });
        toast("Push notifications enabled successfully", "success");
      } else {
        toast("Permission denied for push notifications", "error");
      }
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast("Failed to enable push notifications", "error");
    }
  };

  const handleStripeConnect = async () => {
    if (!isPro) {
      toast("Bank integration requires Needix Pro. Please upgrade first.", "error");
      return;
    }

    setLoading("stripe");
    try {
      const response = await fetch("/api/integrations/plaid/create-link-token", {
        method: "POST",
      });

      if (response.ok) {
        const { link_token } = await response.json();
        
        const script = document.createElement('script');
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.onload = () => {
          const handler = window.Plaid.create({
            token: link_token,
            onSuccess: async (public_token: string, metadata: any) => {
              try {
                const exchangeResponse = await fetch("/api/integrations/plaid/exchange-token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    public_token,
                    institution: metadata.institution,
                    accounts: metadata.accounts 
                  }),
                });

                if (exchangeResponse.ok) {
                  toast("Bank account connected successfully!", "success");
                  const statusResponse = await fetch("/api/integrations/plaid/status");
                  if (statusResponse.ok) {
                    const { connected } = await statusResponse.json();
                    updateIntegrations({ plaidConnected: connected });
                  }
                } else {
                  throw new Error("Failed to connect bank account");
                }
              } catch (error) {
                console.error("Error exchanging token:", error);
                toast("Failed to complete bank connection", "error");
              }
            },
            onExit: (err: any, metadata: any) => {
              if (err != null) {
                console.error("Plaid Link error:", err);
                toast("Bank connection cancelled or failed", "error");
              }
            },
            onEvent: (eventName: string, metadata: any) => {
              console.log("Plaid event:", eventName, metadata);
            },
          });
          
          handler.open();
        };
        document.head.appendChild(script);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to initialize bank connection");
      }
    } catch (error) {
      console.error("Error connecting bank:", error);
      toast("Failed to connect bank account", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnectBank = async () => {
    setLoading("stripe");
    try {
      const response = await fetch("/api/integrations/plaid/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        updateIntegrations({ plaidConnected: false });
        toast("Bank account disconnected", "success");
      } else {
        const error = await response.json();
        toast(error.message || "Failed to disconnect bank account", "error");
      }
    } catch (error) {
      console.error("Error disconnecting bank:", error);
      toast("Failed to disconnect bank account", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleComingSoonClick = (integrationName: string) => {
    toast(`${integrationName} integration coming soon!`, "info");
  };

  const handleGmailScanComplete = (importedCount: number) => {
    toast(`Successfully imported ${importedCount} items from Gmail!`, "success");
    setShowGmailScanner(false);
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔗 Integrations</h2>
        <p className="text-white/60">Connect external services to enhance your Needix experience</p>
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl">💡</div>
            <div>
              <h4 className="font-medium text-blue-300 mb-1">Integration Levels</h4>
              <p className="text-sm text-blue-200/80">
                • <strong>Free:</strong> Gmail Scanner - Connect Google and scan your inbox for subscriptions<br />
                • <strong>Pro Only:</strong> Bank Transactions - Automatic detection from your bank account
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Google Workspace</h3>
                <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium border border-green-500/30">
                  FREE
                </span>
              </div>
              <p className="text-sm text-white/60">Connect your account and scan Gmail for subscriptions</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {integrations.googleConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm">✓ Connected</span>
                  <span className="text-white/60 text-sm">as {session?.user?.email}</span>
                </div>
                <Button 
                  onClick={handleDisconnectGoogle}
                  disabled={loading === "google"}
                  variant="secondary" 
                  size="sm"
                >
                  {loading === "google" ? "..." : "Disconnect"}
                </Button>
              </div>
              
              <div className="pt-2 border-t border-white/10">
                <Button
                  onClick={handleScanGmail}
                  variant="primary"
                  className="w-full"
                >
                  Scan Gmail for Subscriptions
                </Button>
                <p className="text-xs text-white/60 mt-2 text-center">
                  Scan your Gmail emails to automatically detect subscriptions
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleConnectGoogle}
                disabled={loading === "google"}
                className="w-full"
              >
                {loading === "google" ? "Connecting..." : "Connect Google Account"}
              </Button>
              <p className="text-xs text-white/60 text-center">
                Connect your Google account first, then you can scan Gmail for subscriptions
              </p>
            </div>
          )}
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-white/80 mb-2">Benefits:</h4>
          <ul className="space-y-1">
            <li className="text-xs text-white/60 flex items-center gap-2">
              <span className="text-green-400">•</span>
              Auto-detect subscriptions from emails
            </li>
            <li className="text-xs text-white/60 flex items-center gap-2">
              <span className="text-green-400">•</span>
              Import calendar events for renewals
            </li>
            <li className="text-xs text-white/60 flex items-center gap-2">
              <span className="text-green-400">•</span>
              Sync payment confirmations
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Push Notifications</h3>
            <p className="text-sm text-white/60">Get browser notifications for renewals and alerts</p>
          </div>
          <Button
            onClick={handleWebPushToggle}
            disabled={!integrations.webPushSupported}
            variant={integrations.webPushSupported ? "primary" : "secondary"}
          >
            {integrations.webPushSupported ? "Enabled" : "Enable"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 relative">
          {!isPro && (
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                PRO
              </span>
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏦</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Bank Accounts</h3>
                {!isPro && (
                  <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full font-medium border border-purple-500/30">
                    PRO ONLY
                  </span>
                )}
              </div>
              <p className="text-sm text-white/60">
                {isPro 
                  ? "Connect your bank to track subscription payments" 
                  : "Upgrade to Pro to connect your bank account"}
              </p>
            </div>
          </div>
          
          {integrations.plaidConnected && isPro ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 text-sm">✓ Connected</span>
                  <span className="text-white/60 text-sm">Bank account linked</span>
                </div>
                <Button 
                  onClick={handleDisconnectBank}
                  disabled={loading === "stripe"}
                  variant="secondary" 
                  size="sm"
                >
                  {loading === "stripe" ? "..." : "Disconnect"}
                </Button>
              </div>
              <p className="text-xs text-white/60">
                Your bank transactions are being monitored for subscription payments
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={handleStripeConnect} 
                disabled={loading === "stripe" || !isPro}
                variant={isPro ? "primary" : "secondary"} 
                className={`w-full ${!isPro ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === "stripe" ? "Connecting..." : isPro ? "Connect Bank Account" : "🔒 Upgrade to Pro Required"}
              </Button>
              {isPro ? (
                <p className="text-xs text-white/60 text-center">
                  Pro feature: Automatically detect subscription payments from your bank
                </p>
              ) : (
                <p className="text-xs text-orange-400 text-center">
                  ⭐ Upgrade to Pro to access bank transaction monitoring
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 relative">
          <div className="absolute top-4 right-4">
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              SOON
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">QuickBooks</h3>
              <p className="text-sm text-white/60">Sync business expenses and subscriptions</p>
            </div>
          </div>
          <Button onClick={() => handleComingSoonClick("QuickBooks")} variant="secondary" className="w-full" disabled>
            Coming Soon
          </Button>
        </div>
      </div>

      <GmailScannerDialog
        isOpen={showGmailScanner}
        onClose={() => setShowGmailScanner(false)}
        onComplete={handleGmailScanComplete}
      />
    </div>
  );
};

export default IntegrationsSettings;