// components/settings/IntegrationsSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { IntegrationSettings } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import GmailScannerDialog from "./GmailScannerDialog";

interface IntegrationsSettingsProps {
  integrations: IntegrationSettings;
  setIntegrations: React.Dispatch<React.SetStateAction<IntegrationSettings>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconBg: string;
  connected: boolean;
  premium?: boolean;
  comingSoon?: boolean;
  benefits: string[];
}

export default function IntegrationsSettings({ integrations, setIntegrations }: IntegrationsSettingsProps) {
  const { data: session } = useSession();
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);
  
  const [loading, setLoading] = useState<string | null>(null);
  const [showGmailScanner, setShowGmailScanner] = useState(false);

  const updateIntegrations = (updates: Partial<IntegrationSettings>) => {
    const newSettings = { ...integrations, ...updates };
    setIntegrations(newSettings);
    localStorage.setItem("needix_integrations", JSON.stringify(newSettings));
  };

  // Check Google connection status on mount
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/integrations/google/status");
          if (response.ok) {
            const { connected } = await response.json();
            updateIntegrations({ googleConnected: connected });
          }
        } catch (error) {
          console.error("Error checking Google connection:", error);
        }
      }
    };

    checkGoogleConnection();
  }, [session]);

  // Initialize push notification support
  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      updateIntegrations({ webPushSupported: true });
    }
  }, []);

  const availableIntegrations: Integration[] = [
    {
      id: "google",
      name: "Google Account",
      description: "Import subscriptions from Gmail and sync calendar events",
      icon: "🔍",
      iconBg: "bg-white",
      connected: integrations.googleConnected,
      benefits: [
        "Automatically detect subscription emails",
        "Import existing subscription data",
        "Track price changes from receipts",
        "Sync cancellation confirmations",
        "Calendar integration for payment dates"
      ]
    },
    {
      id: "apple",
      name: "Apple ID",
      description: "Connect your Apple account to track App Store subscriptions",
      icon: "🍎",
      iconBg: "bg-gradient-to-r from-gray-900 to-gray-700",
      connected: false,
      comingSoon: true,
      benefits: [
        "Track App Store subscriptions",
        "Monitor Apple services billing",
        "Sync iCloud storage plans",
        "Apple Music subscription tracking"
      ]
    },
    {
      id: "microsoft",
      name: "Microsoft Account",
      description: "Connect to track Microsoft 365 and Xbox subscriptions",
      icon: "🏢",
      iconBg: "bg-gradient-to-r from-blue-600 to-blue-800",
      connected: false,
      comingSoon: true,
      benefits: [
        "Microsoft 365 subscription tracking",
        "Xbox Game Pass monitoring",
        "Azure services billing",
        "OneDrive storage plans"
      ]
    },
    {
      id: "slack",
      name: "Slack Workspace",
      description: "Get subscription reminders in your Slack channels",
      icon: "💬",
      iconBg: "bg-gradient-to-r from-purple-500 to-pink-500",
      connected: false,
      premium: true,
      benefits: [
        "Reminder notifications in Slack",
        "Team subscription management",
        "Billing alerts for workspace",
        "Custom reminder channels"
      ]
    },
    {
      id: "discord",
      name: "Discord",
      description: "Receive subscription notifications in Discord",
      icon: "🎮",
      iconBg: "bg-gradient-to-r from-indigo-500 to-purple-600",
      connected: false,
      premium: true,
      benefits: [
        "Discord bot notifications",
        "Server subscription tracking",
        "Gaming subscription alerts",
        "Community expense sharing"
      ]
    },
    {
      id: "stripe",
      name: "Stripe Connect",
      description: "Automatically track business subscriptions and payments",
      icon: "💳",
      iconBg: "bg-gradient-to-r from-blue-500 to-purple-600",
      connected: false,
      premium: true,
      benefits: [
        "Business subscription tracking",
        "Automatic payment detection",
        "Revenue analytics",
        "Customer subscription insights"
      ]
    },
    {
      id: "zapier",
      name: "Zapier",
      description: "Create custom automations with 5000+ apps",
      icon: "⚡",
      iconBg: "bg-gradient-to-r from-orange-500 to-red-500",
      connected: false,
      premium: true,
      benefits: [
        "Custom workflow automations",
        "Connect with 5000+ apps",
        "Automated data syncing",
        "Trigger-based actions"
      ]
    },
    {
      id: "webhooks",
      name: "Custom Webhooks",
      description: "Send subscription data to your own systems",
      icon: "🔗",
      iconBg: "bg-gradient-to-r from-gray-600 to-gray-800",
      connected: false,
      premium: true,
      benefits: [
        "Custom API integrations",
        "Real-time data webhooks",
        "Developer-friendly setup",
        "Custom notification endpoints"
      ]
    }
  ];

  const handleConnectGoogle = async () => {
    setLoading("google");
    try {
      // Initiate Google OAuth
      window.location.href = "/api/auth/signin/google?callbackUrl=/dashboard";
    } catch (error) {
      console.error("Error connecting Google:", error);
      toast("Failed to connect Google account", "error");
    } finally {
      setLoading(null);
    }
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
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting Google:", error);
      toast("Failed to disconnect Google account", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleScanGmail = () => {
    if (!integrations.googleConnected) {
      toast("Please connect your Google account first", "error");
      return;
    }
    setShowGmailScanner(true);
  };

  const handleGmailScanComplete = (importedCount: number) => {
    toast(`Successfully imported ${importedCount} items from Gmail!`, "success");
    setShowGmailScanner(false);
  };

  const handleSubscribePush = async () => {
    if (!integrations.webPushSupported) {
      toast("Web Push not supported in this browser", "error");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Save subscription to server
        await fetch("/api/push/save-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });

        toast("Push notifications enabled!", "success");
      } else {
        toast("Permission denied for push notifications", "error");
      }
    } catch (error) {
      console.error("Error subscribing to push:", error);
      toast("Failed to enable push notifications", "error");
    }
  };

  const handleComingSoonClick = (integrationName: string) => {
    toast(`${integrationName} integration coming soon!`, "info");
  };

  const handlePremiumClick = (integrationName: string) => {
    toast(`${integrationName} requires Needix Pro. Upgrade to unlock!`, "info");
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔗 Integrations</h2>
        <p className="text-white/60">Connect external services to enhance your Needix experience</p>
      </div>

      {/* Integration Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {availableIntegrations.map((integration) => (
          <div key={integration.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 relative">
            {integration.premium && (
              <div className="absolute top-4 right-4">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  PRO
                </span>
              </div>
            )}
            
            {integration.comingSoon && (
              <div className="absolute top-4 right-4">
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  SOON
                </span>
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${integration.iconBg} rounded-lg flex items-center justify-center`}>
                  <span className="text-2xl">{integration.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{integration.name}</h3>
                  <p className="text-sm text-white/60">{integration.description}</p>
                </div>
              </div>
            </div>

            {/* Connection Status & Action */}
            <div className="mb-4">
              {integration.id === "google" && (
                <div className="space-y-3">
                  {integration.connected ? (
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
                  ) : (
                    <Button 
                      onClick={handleConnectGoogle}
                      disabled={loading === "google"}
                      variant="primary" 
                      size="sm"
                      className="w-full"
                    >
                      {loading === "google" ? "Connecting..." : "Connect Google"}
                    </Button>
                  )}
                  
                  {integration.connected && (
                    <Button 
                      onClick={handleScanGmail}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      🔍 Scan Gmail for Subscriptions
                    </Button>
                  )}
                </div>
              )}
              
              {integration.id === "push" && (
                <Button 
                  onClick={() => { void handleSubscribePush(); }}
                  disabled={!integrations.webPushSupported}
                  variant="primary" 
                  size="sm"
                  className="w-full"
                >
                  {integrations.webPushSupported ? "Enable Push Notifications" : "Not Supported"}
                </Button>
              )}
              
              {integration.comingSoon && integration.id !== "google" && (
                <Button 
                  onClick={() => handleComingSoonClick(integration.name)}
                  variant="secondary"
                  size="sm"
                  className="w-full opacity-60 cursor-not-allowed"
                  disabled
                >
                  Coming Soon
                </Button>
              )}
              
              {integration.premium && !integration.comingSoon && integration.id !== "google" && (
                <Button 
                  onClick={() => handlePremiumClick(integration.name)}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Upgrade to Connect
                </Button>
              )}
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <h4 className="font-medium text-white text-sm">Benefits:</h4>
              <ul className="space-y-1">
                {integration.benefits.slice(0, 3).map((benefit, index) => (
                  <li key={index} className="text-sm text-white/70 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">•</span>
                    {benefit}
                  </li>
                ))}
                {integration.benefits.length > 3 && (
                  <li className="text-sm text-white/50">
                    +{integration.benefits.length - 3} more benefits
                  </li>
                )}
              </ul>
            </div>

            {/* Connected Status */}
            {integration.connected && integration.id === "google" && (
              <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 mt-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400">✓</span>
                  <span className="font-medium text-green-400 text-sm">Active & Monitoring</span>
                </div>
                <p className="text-xs text-green-300">
                  Scan your Gmail to automatically detect subscriptions, orders, and expenses.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gmail Scanner Dialog */}
      <GmailScannerDialog
        isOpen={showGmailScanner}
        onClose={() => setShowGmailScanner(false)}
        onComplete={handleGmailScanComplete}
      />

      {/* Push Notifications Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🔔</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Web Push Notifications</h3>
              <p className="text-sm text-white/60">Receive notifications even when the app is closed</p>
            </div>
          </div>
          {integrations.webPushSupported ? (
            <Button onClick={() => { void handleSubscribePush(); }} variant="primary" size="sm">
              Subscribe to Push
            </Button>
          ) : (
            <span className="text-red-400 text-sm">Not Supported</span>
          )}
        </div>

        {integrations.webPushSupported ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <h4 className="font-medium text-white mb-2">Push Notification Features:</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Renewal reminders even when app is closed</li>
              <li>• Price change alerts in real-time</li>
              <li>• Weekly spending summaries</li>
              <li>• Custom notification scheduling</li>
            </ul>
          </div>
        ) : (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
            <p className="text-sm text-red-300">
              Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        )}
      </div>

      {/* Integration Stats */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Integration Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {availableIntegrations.filter(i => i.connected).length}
            </div>
            <div className="text-sm text-white/60">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {availableIntegrations.filter(i => !i.comingSoon && !i.connected).length}
            </div>
            <div className="text-sm text-white/60">Available</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {availableIntegrations.filter(i => i.premium).length}
            </div>
            <div className="text-sm text-white/60">Pro Only</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {availableIntegrations.filter(i => i.comingSoon).length}
            </div>
            <div className="text-sm text-white/60">Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}