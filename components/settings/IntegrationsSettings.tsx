// components/settings/IntegrationsSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);
  
  const [loading, setLoading] = useState<string | null>(null);
  const [showGmailScanner, setShowGmailScanner] = useState(false);
  const [googleOAuthEnabled, setGoogleOAuthEnabled] = useState<boolean>(true);

  const updateIntegrations = (updates: Partial<IntegrationSettings>) => {
    const newSettings = { ...integrations, ...updates };
    setIntegrations(newSettings);
    localStorage.setItem("needix_integrations", JSON.stringify(newSettings));
  };

  // Check Google connection status on mount and when session changes
  useEffect(() => {
    const checkGoogleConnection = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/integrations/google/status");
          if (response.ok) {
            const { connected } = await response.json();
            updateIntegrations({ googleConnected: connected });
          } else if (response.status === 500) {
            // Likely Google OAuth not configured
            setGoogleOAuthEnabled(false);
          }
        } catch (error) {
          console.error("Error checking Google connection:", error);
          setGoogleOAuthEnabled(false);
        }
      }
    };

    checkGoogleConnection();
  }, [session]);

  // Check for successful Google connection on page load
  useEffect(() => {
    const checkForGoogleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('google_connected') === 'true') {
        toast("Google account connected successfully!", "success");
        updateIntegrations({ googleConnected: true });
        
        // Clean up URL parameters
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('google_connected');
        window.history.replaceState({}, '', currentUrl.toString());
      }
      
      // Handle errors
      const error = urlParams.get('error');
      if (error === 'google_not_configured') {
        toast("Google OAuth is not configured. Please add credentials to your environment variables.", "error");
        setGoogleOAuthEnabled(false);
      } else if (error === 'connection_failed') {
        toast("Failed to connect Google account. Please try again.", "error");
      } else if (error) {
        toast("An error occurred during Google connection.", "error");
      }
      
      // Clean up error parameters
      if (error) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('error');
        window.history.replaceState({}, '', currentUrl.toString());
      }
    };

    checkForGoogleCallback();
  }, []);

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
        "Calendar integration",
        "Smart expense categorization"
      ]
    },
    {
      id: "push",
      name: "Push Notifications",
      description: "Get instant alerts for renewals and price changes",
      icon: "🔔",
      iconBg: "bg-gradient-to-r from-blue-500 to-purple-600",
      connected: false,
      benefits: [
        "Real-time renewal alerts",
        "Price change notifications",
        "Weekly spending summaries",
        "Custom reminder schedules"
      ]
    },
    {
      id: "apple",
      name: "Apple App Store",
      description: "Track subscriptions from your Apple devices",
      icon: "🍎",
      iconBg: "bg-gradient-to-r from-gray-700 to-gray-900",
      connected: false,
      comingSoon: true,
      benefits: [
        "Auto-detect App Store subscriptions",
        "Family sharing insights",
        "In-app purchase tracking",
        "Subscription usage analytics"
      ]
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Monitor recurring payments and subscriptions",
      icon: "💳",
      iconBg: "bg-gradient-to-r from-blue-600 to-blue-800",
      connected: false,
      comingSoon: true,
      benefits: [
        "Automatic payment detection",
        "PayPal subscription sync",
        "Merchant categorization",
        "International payment tracking"
      ]
    },
    {
      id: "amazon",
      name: "Amazon",
      description: "Track Prime and other Amazon subscriptions",
      icon: "📦",
      iconBg: "bg-gradient-to-r from-orange-500 to-yellow-600",
      connected: false,
      comingSoon: true,
      benefits: [
        "Prime membership tracking",
        "Subscribe & Save monitoring",
        "Digital service subscriptions",
        "Order history integration"
      ]
    },
    {
      id: "discord",
      name: "Discord",
      description: "Monitor Nitro and server boosts",
      icon: "🎮",
      iconBg: "bg-gradient-to-r from-indigo-500 to-purple-600",
      connected: false,
      comingSoon: true,
      benefits: [
        "Nitro subscription tracking",
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

  const handleConnectGoogle = () => {
    if (!googleOAuthEnabled) {
      toast("Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.", "error");
      return;
    }

    // Simply navigate to the connect page - don't trigger any auth here!
    router.push('/connect/google');
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
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl">💡</div>
            <div>
              <h4 className="font-medium text-blue-300 mb-1">Secure Connection Process</h4>
              <p className="text-sm text-blue-200/80">
                When connecting Google, you'll be securely redirected to Google's authentication page. 
                After granting permissions, you'll return here to complete the setup.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {availableIntegrations.map((integration) => (
          <div key={integration.id} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 relative hover:border-white/30 transition-colors">
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
                      <Button 
                        onClick={handleScanGmail}
                        variant="secondary"
                        size="sm"
                        className="w-full"
                      >
                        🔍 Scan Gmail for Subscriptions
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button 
                        onClick={handleConnectGoogle}
                        disabled={loading === "google" || !googleOAuthEnabled}
                        variant="primary" 
                        size="sm"
                        className="w-full"
                      >
                        {loading === "google" ? "Redirecting..." : !googleOAuthEnabled ? "OAuth Not Configured" : "Connect Google Account"}
                      </Button>
                      <p className="text-xs text-white/50 text-center">
                        {!googleOAuthEnabled 
                          ? "Google OAuth credentials need to be configured"
                          : "You'll be redirected to Google for secure authentication"
                        }
                      </p>
                    </div>
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
                  Your Gmail is connected and ready to scan for subscription data.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Gmail Scanner Dialog */}
      {showGmailScanner && (
        <GmailScannerDialog 
          isOpen={showGmailScanner}
          onClose={() => setShowGmailScanner(false)}
          onComplete={handleGmailScanComplete}
        />
      )}
    </div>
  );
}