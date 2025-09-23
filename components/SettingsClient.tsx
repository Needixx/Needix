// components/SettingsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { signOut } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type NotificationSettings = {
  renewalReminders: boolean;
  priceAlerts: boolean;
  weeklyDigest: boolean;
  emailNotifications: boolean;
  webPush: boolean;
  renewalLeadDays: number;
  priceChangeThreshold: number;
  digestDay: string;
  digestTime: string;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
};

type AppSettings = {
  theme: "dark" | "light" | "system";
  currency: "USD" | "EUR" | "GBP";
  timezone: string;
  weekStart: "sunday" | "monday";
  defaultView: "grid" | "list";
  compactMode: boolean;
  defaultTab: "subscriptions" | "expenses" | "orders";
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY";
  numberFormat: "US" | "EU";
};

type BillingInfo = {
  plan: "free" | "pro";
  status: "active" | "canceled" | "past_due";
  renewalDate?: string;
  usageCount: number;
  usageLimit: number;
};

type SecuritySettings = {
  twoFactorEnabled: boolean;
  activeSessions: number;
};

type AISettings = {
  allowDataAccess: boolean;
  retainHistory: boolean;
  autoFillForms: boolean;
};

type IntegrationSettings = {
  googleConnected: boolean;
  stripeCustomerId?: string;
  webPushSupported: boolean;
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  renewalReminders: true,
  priceAlerts: true,
  weeklyDigest: false,
  emailNotifications: true,
  webPush: false,
  renewalLeadDays: 7,
  priceChangeThreshold: 10,
  digestDay: "monday",
  digestTime: "09:00",
  quietHours: false,
  quietStart: "22:00",
  quietEnd: "08:00",
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "dark",
  currency: "USD",
  timezone: "America/New_York",
  weekStart: "sunday",
  defaultView: "grid",
  compactMode: false,
  defaultTab: "subscriptions",
  dateFormat: "MM/DD/YYYY",
  numberFormat: "US",
};

const DEFAULT_BILLING: BillingInfo = {
  plan: "free",
  status: "active",
  usageCount: 0,
  usageLimit: 2,
};

const DEFAULT_SECURITY: SecuritySettings = {
  twoFactorEnabled: false,
  activeSessions: 1,
};

const DEFAULT_AI: AISettings = {
  allowDataAccess: true,
  retainHistory: true,
  autoFillForms: false,
};

const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  googleConnected: false,
  webPushSupported: false,
};

function isNotificationSettings(v: unknown): v is NotificationSettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.renewalReminders === "boolean" &&
    typeof settings.priceAlerts === "boolean" &&
    typeof settings.weeklyDigest === "boolean" &&
    typeof settings.emailNotifications === "boolean"
  );
}

function isAppSettings(v: unknown): v is AppSettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    (settings.theme === "dark" || settings.theme === "light" || settings.theme === "system") &&
    (settings.currency === "USD" || settings.currency === "EUR" || settings.currency === "GBP") &&
    (settings.defaultView === "grid" || settings.defaultView === "list") &&
    typeof settings.compactMode === "boolean"
  );
}

function isSecuritySettings(v: unknown): v is SecuritySettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.twoFactorEnabled === "boolean" &&
    typeof settings.activeSessions === "number"
  );
}

function isAISettings(v: unknown): v is AISettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.allowDataAccess === "boolean" &&
    typeof settings.retainHistory === "boolean" &&
    typeof settings.autoFillForms === "boolean"
  );
}

function isIntegrationSettings(v: unknown): v is IntegrationSettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.googleConnected === "boolean" &&
    typeof settings.webPushSupported === "boolean"
  );
}

export default function SettingsClient({ user }: { user: User }) {
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [billing, setBilling] = useState<BillingInfo>(DEFAULT_BILLING);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULT_SECURITY);
  const [aiSettings, setAISettings] = useState<AISettings>(DEFAULT_AI);
  const [integrations, setIntegrations] = useState<IntegrationSettings>(DEFAULT_INTEGRATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeSection, setActiveSection] = useState("account");

  const { items: subscriptions } = useSubscriptions();
  const { items: orders } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem("needix_notifications");
      const savedAppSettings = localStorage.getItem("needix_app_settings");
      const savedSecurity = localStorage.getItem("needix_security");
      const savedAI = localStorage.getItem("needix_ai");
      const savedIntegrations = localStorage.getItem("needix_integrations");

      if (savedNotifications) {
        const parsed: unknown = JSON.parse(savedNotifications);
        if (isNotificationSettings(parsed)) {
          setNotifications(parsed);
        }
      }
      if (savedAppSettings) {
        const parsed: unknown = JSON.parse(savedAppSettings);
        if (isAppSettings(parsed)) {
          setAppSettings(parsed);
        }
      }
      if (savedSecurity) {
        const parsed: unknown = JSON.parse(savedSecurity);
        if (isSecuritySettings(parsed)) {
          setSecurity(parsed);
        }
      }
      if (savedAI) {
        const parsed: unknown = JSON.parse(savedAI);
        if (isAISettings(parsed)) {
          setAISettings(parsed);
        }
      }
      if (savedIntegrations) {
        const parsed: unknown = JSON.parse(savedIntegrations);
        if (isIntegrationSettings(parsed)) {
          setIntegrations(parsed);
        }
      }

      // Update billing info
      setBilling({
        plan: isPro ? "pro" : "free",
        status: "active",
        usageCount: subscriptions.length,
        usageLimit: isPro ? 999 : 2,
      });

      // Check web push support
      if ("Notification" in window && "serviceWorker" in navigator) {
        setIntegrations((prev) => ({ ...prev, webPushSupported: true }));
      }
    } catch {
      // Error loading settings - use defaults
    }
  }, [isPro, subscriptions.length]);

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...notifications, ...updates };
    setNotifications(newSettings);
    localStorage.setItem("needix_notifications", JSON.stringify(newSettings));
    toast("Notification settings updated", "success");
  };

  const updateAppSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...appSettings, ...updates };
    setAppSettings(newSettings);
    localStorage.setItem("needix_app_settings", JSON.stringify(newSettings));
    toast("App settings updated", "success");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateSecurity = (updates: Partial<SecuritySettings>) => {
    const newSettings = { ...security, ...updates };
    setSecurity(newSettings);
    localStorage.setItem("needix_security", JSON.stringify(newSettings));
    toast("Security settings updated", "success");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateAI = (updates: Partial<AISettings>) => {
    const newSettings = { ...aiSettings, ...updates };
    setAISettings(newSettings);
    localStorage.setItem("needix_ai", JSON.stringify(newSettings));
    toast("AI settings updated", "success");
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast("Notifications not supported", "error");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateNotifications({ webPush: true });
        // Send test notification
        // eslint-disable-next-line no-new
        new Notification("Needix Notifications Enabled", {
          body: "You will now receive subscription reminders!",
          icon: "/favicon.ico",
        });
      } else {
        toast("Notification permission denied", "error");
      }
    } catch {
      toast("Failed to enable notifications", "error");
    }
  };

  const exportData = () => {
    const data = {
      subscriptions,
      orders,
      settings: {
        notifications,
        appSettings,
        security,
        aiSettings,
        integrations,
      },
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `needix-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Data exported successfully", "success");
  };

  const clearAllData = () => {
    if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      // Clear localStorage
      localStorage.removeItem("needix_subscriptions");
      localStorage.removeItem("needix_orders");
      localStorage.removeItem("needix_notifications");
      localStorage.removeItem("needix_app_settings");
      localStorage.removeItem("needix_security");
      localStorage.removeItem("needix_ai");
      localStorage.removeItem("needix_integrations");

      // Reset state
      setNotifications(DEFAULT_NOTIFICATIONS);
      setAppSettings(DEFAULT_APP_SETTINGS);
      setSecurity(DEFAULT_SECURITY);
      setAISettings(DEFAULT_AI);
      setIntegrations(DEFAULT_INTEGRATIONS);

      toast("All data cleared", "success");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast("Failed to clear data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await fetch("/api/user/delete", { method: "DELETE" });
      if (response.ok) {
        toast("Account deleted successfully", "success");
        await signOut();
      } else {
        toast("Failed to delete account", "error");
      }
    } catch {
      toast("Failed to delete account", "error");
    }
    setShowDeleteModal(false);
  };

  const openStripePortal = () => {
    toast("Opening Stripe Customer Portal...", "info");
    window.open("https://billing.stripe.com/p/login/test_00000000000000", "_blank");
  };

  const testNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      // eslint-disable-next-line no-new
      new Notification("Test Notification", {
        body: "This is a test notification from Needix!",
        icon: "/favicon.ico",
      });
      toast("Test notification sent", "success");
    } else {
      toast("Notifications not enabled", "error");
    }
  };

  const handleSignOut = () => {
    void signOut();
  };

  const handleDeleteAccount = () => {
    void deleteAccount();
  };

  const handleRequestNotifications = () => {
    void requestNotificationPermission();
  };

  const sections = [
    { id: "account", title: "Account & Profile", icon: "👤" },
    { id: "billing", title: "Plan & Billing", icon: "💳" },
    { id: "notifications", title: "Notifications", icon: "🔔" },
    { id: "preferences", title: "App Preferences", icon: "🎨" },
    { id: "categories", title: "Categories & Tags", icon: "🏷️" },
    { id: "data", title: "Data & Privacy", icon: "💾" },
    { id: "ai", title: "AI Settings", icon: "🤖" },
    { id: "integrations", title: "Integrations", icon: "🔗" },
    { id: "security", title: "Security", icon: "🔒" },
    { id: "advanced", title: "Advanced", icon: "⚙️" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:w-64 space-y-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="font-medium mb-3 text-white/80">Settings</h3>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                  activeSection === section.id
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{section.icon}</span>
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Account & Profile */}
        {activeSection === "account" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">👤</span>
                <h2 className="text-lg font-medium">Account & Profile</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {user.image && (
                    <img
                      src={user.image}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border border-white/20"
                    />
                  )}
                  <div>
                    <div className="font-medium">{user.name || "No name set"}</div>
                    <div className="text-white/60 text-sm">{user.email}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <Button
                    onClick={handleSignOut}
                    variant="secondary"
                    className="text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
                  >
                    🚪 Sign Out
                  </Button>
                </div>

                <div className="pt-4 border-t border-red-500/20">
                  <h3 className="font-medium mb-2 text-red-400">Danger Zone</h3>
                  <p className="text-white/70 text-sm mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="secondary"
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    🗑️ Delete Account
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Plan & Billing */}
        {activeSection === "billing" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">💳</span>
                <h2 className="text-lg font-medium">Plan & Billing</h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-white/60">Current Plan</div>
                    <div className="text-lg font-medium capitalize">{billing.plan}</div>
                    <div className="text-xs text-white/50">{billing.status}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-white/60">Usage</div>
                    <div className="text-lg font-medium">
                      {billing.usageCount}/{billing.usageLimit === 999 ? "∞" : billing.usageLimit}
                    </div>
                    <div className="text-xs text-white/50">Subscriptions</div>
                  </div>
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                    <div className="text-sm text-white/60">Next Billing</div>
                    <div className="text-lg font-medium">{billing.renewalDate || "N/A"}</div>
                    <div className="text-xs text-white/50">Renewal Date</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={openStripePortal} variant="secondary">
                    💳 Manage Billing
                  </Button>
                  {!isPro && <Button variant="primary">⬆️ Upgrade to Pro</Button>}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Notifications */}
        {activeSection === "notifications" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">🔔</span>
                <h2 className="text-lg font-medium">Notifications</h2>
              </div>

              <div className="space-y-6">
                {/* Notification Channels */}
                <div>
                  <h3 className="font-medium mb-3">Channels</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Email notifications</div>
                        <div className="text-sm text-white/60">Receive notifications via email</div>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                        checked={notifications.emailNotifications}
                        onChange={(e) => updateNotifications({ emailNotifications: e.target.checked })}
                      />
                    </label>

                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Web push notifications</div>
                        <div className="text-sm text-white/60">
                          Browser notifications {!integrations.webPushSupported && "(Not supported)"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integrations.webPushSupported && !notifications.webPush && (
                          <Button onClick={handleRequestNotifications} variant="secondary" size="sm">
                            Enable
                          </Button>
                        )}
                        {notifications.webPush && (
                          <Button onClick={testNotification} variant="secondary" size="sm">
                            Test
                          </Button>
                        )}
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                          checked={notifications.webPush}
                          disabled={!integrations.webPushSupported}
                          onChange={(e) => updateNotifications({ webPush: e.target.checked })}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Notification Types */}
                <div>
                  <h3 className="font-medium mb-3">Types</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Renewal reminders</div>
                        <div className="text-sm text-white/60">Get notified before subscriptions renew</div>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                        checked={notifications.renewalReminders}
                        onChange={(e) => updateNotifications({ renewalReminders: e.target.checked })}
                      />
                    </label>

                    {notifications.renewalReminders && (
                      <div className="ml-4 grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <span className="text-sm text-white/70">Remind me</span>
                          <select
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm"
                            value={notifications.renewalLeadDays}
                            onChange={(e) =>
                              updateNotifications({ renewalLeadDays: parseInt(e.target.value) })
                            }
                          >
                            <option value={1}>1 day before</option>
                            <option value={3}>3 days before</option>
                            <option value={7}>1 week before</option>
                            <option value={14}>2 weeks before</option>
                          </select>
                        </label>
                      </div>
                    )}

                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Price change alerts</div>
                        <div className="text-sm text-white/60">Get notified when subscription prices increase</div>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                        checked={notifications.priceAlerts}
                        onChange={(e) => updateNotifications({ priceAlerts: e.target.checked })}
                      />
                    </label>

                    {notifications.priceAlerts && (
                      <div className="ml-4 grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <span className="text-sm text-white/70">Threshold</span>
                          <select
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm"
                            value={notifications.priceChangeThreshold}
                            onChange={(e) =>
                              updateNotifications({ priceChangeThreshold: parseInt(e.target.value) })
                            }
                          >
                            <option value={5}>≥5% increase</option>
                            <option value={10}>≥10% increase</option>
                            <option value={15}>≥15% increase</option>
                            <option value={20}>≥20% increase</option>
                          </select>
                        </label>
                      </div>
                    )}

                    <label className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Weekly digest</div>
                        <div className="text-sm text-white/60">Weekly summary of upcoming renewals</div>
                      </div>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                        checked={notifications.weeklyDigest}
                        onChange={(e) => updateNotifications({ weeklyDigest: e.target.checked })}
                      />
                    </label>

                    {notifications.weeklyDigest && (
                      <div className="ml-4 grid grid-cols-2 gap-3">
                        <label className="grid gap-1">
                          <span className="text-sm text-white/70">Day</span>
                          <select
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm"
                            value={notifications.digestDay}
                            onChange={(e) => updateNotifications({ digestDay: e.target.value })}
                          >
                            <option value="monday">Monday</option>
                            <option value="tuesday">Tuesday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="thursday">Thursday</option>
                            <option value="friday">Friday</option>
                            <option value="saturday">Saturday</option>
                            <option value="sunday">Sunday</option>
                          </select>
                        </label>
                        <label className="grid gap-1">
                          <span className="text-sm text-white/70">Time</span>
                          <input
                            type="time"
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm"
                            value={notifications.digestTime}
                            onChange={(e) => updateNotifications({ digestTime: e.target.value })}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quiet Hours */}
                <div>
                  <h3 className="font-medium mb-3">Quiet Hours</h3>
                  <label className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">Do not disturb</div>
                      <div className="text-sm text-white/60">Disable notifications during quiet hours</div>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                      checked={notifications.quietHours}
                      onChange={(e) => updateNotifications({ quietHours: e.target.checked })}
                    />
                  </label>

                  {notifications.quietHours && (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="grid gap-1">
                        <span className="text-sm text-white/70">Start time</span>
                        <input
                          type="time"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm"
                          value={notifications.quietStart}
                          onChange={(e) => updateNotifications({ quietStart: e.target.value })}
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-sm text-white/70">End time</span>
                        <input
                          type="time"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white text-sm"
                          value={notifications.quietEnd}
                          onChange={(e) => updateNotifications({ quietEnd: e.target.value })}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* App Preferences */}
        {activeSection === "preferences" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">🎨</span>
                <h2 className="text-lg font-medium">App Preferences</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm text-white/70">Theme</span>
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    value={appSettings.theme}
                    onChange={(e) => updateAppSettings({ theme: e.target.value as AppSettings["theme"] })}
                  >
                    <option value="dark">🌙 Dark</option>
                    <option value="light">☀️ Light</option>
                    <option value="system">🖥️ System</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-white/70">Currency</span>
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    value={appSettings.currency}
                    onChange={(e) => updateAppSettings({ currency: e.target.value as AppSettings["currency"] })}
                  >
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="GBP">🇬🇧 GBP (£)</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-white/70">Default view</span>
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    value={appSettings.defaultView}
                    onChange={(e) =>
                      updateAppSettings({ defaultView: e.target.value as AppSettings["defaultView"] })
                    }
                  >
                    <option value="grid">📊 Grid</option>
                    <option value="list">📋 List</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-white/70">Default tab</span>
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                    value={appSettings.defaultTab}
                    onChange={(e) =>
                      updateAppSettings({ defaultTab: e.target.value as AppSettings["defaultTab"] })
                    }
                  >
                    <option value="subscriptions">🔄 Subscriptions</option>
                    <option value="expenses">💰 Expenses</option>
                    <option value="orders">📦 Orders</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Compact mode</div>
                    <div className="text-sm text-white/60">Show more items in less space</div>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500"
                    checked={appSettings.compactMode}
                    onChange={(e) => updateAppSettings({ compactMode: e.target.checked })}
                  />
                </label>
              </div>
            </section>
          </div>
        )}

        {/* Data & Privacy */}
        {activeSection === "data" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">💾</span>
                <h2 className="text-lg font-medium">Data & Privacy</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Export Data</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Download your data in JSON format. Includes all subscriptions, orders, expenses, and settings.
                  </p>
                  <Button onClick={exportData} variant="secondary">
                    📄 Export as JSON
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <h3 className="font-medium mb-3 text-yellow-400">Clear Local Data</h3>
                  <p className="text-white/70 text-sm mb-4">
                    Remove all locally stored data including cache and preferences. This will not affect your account data.
                  </p>
                  <Button
                    onClick={clearAllData}
                    variant="secondary"
                    disabled={isLoading}
                    className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                  >
                    {isLoading ? "⏳ Clearing..." : "🧹 Clear Local Cache"}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Other sections can be added here */}
        {activeSection === "categories" && (
          <div className="p-6 text-center text-white/60">Categories & Tags section coming soon...</div>
        )}

        {activeSection === "ai" && (
          <div className="p-6 text-center text-white/60">AI Settings section coming soon...</div>
        )}

        {activeSection === "integrations" && (
          <div className="p-6 text-center text-white/60">Integrations section coming soon...</div>
        )}

        {activeSection === "security" && (
          <div className="p-6 text-center text-white/60">Security section coming soon...</div>
        )}

        {activeSection === "advanced" && (
          <div className="p-6 text-center text-white/60">Advanced settings section coming soon...</div>
        )}
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-medium text-red-400">Delete Account</h3>
            </div>

            <p className="text-white/70 mb-6">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>

            <div className="text-sm text-white/60 mb-6">
              <div>• All subscriptions and expenses will be deleted</div>
              <div>• Your billing will be canceled immediately</div>
              <div>• You will be signed out of all devices</div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowDeleteModal(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                variant="secondary"
                className="flex-1 text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
