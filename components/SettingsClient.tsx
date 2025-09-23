// components/SettingsClient.tsx
"use client";

import { useState, useEffect } from "react";
import { User } from "next-auth";
import { signOut } from "@/lib/auth";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

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
  const [activeSection, setActiveSection] = useState("notifications");

  const { items: subscriptions } = useSubscriptions();
  const { items: orders } = useOrders();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();

  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem("needix_notifications");
      if (savedNotifications) {
        const parsed: unknown = JSON.parse(savedNotifications);
        if (isNotificationSettings(parsed)) {
          setNotifications(parsed);
        }
      }

      const savedAppSettings = localStorage.getItem("needix_app_settings");
      if (savedAppSettings) {
        const parsed: unknown = JSON.parse(savedAppSettings);
        if (isAppSettings(parsed)) {
          setAppSettings(parsed);
        }
      }

      const savedSecurity = localStorage.getItem("needix_security");
      if (savedSecurity) {
        const parsed: unknown = JSON.parse(savedSecurity);
        if (isSecuritySettings(parsed)) {
          setSecurity(parsed);
        }
      }

      const savedAI = localStorage.getItem("needix_ai");
      if (savedAI) {
        const parsed: unknown = JSON.parse(savedAI);
        if (isAISettings(parsed)) {
          setAISettings(parsed);
        }
      }

      const savedIntegrations = localStorage.getItem("needix_integrations");
      if (savedIntegrations) {
        const parsed: unknown = JSON.parse(savedIntegrations);
        if (isIntegrationSettings(parsed)) {
          setIntegrations(parsed);
        }
      }

      setBilling({
        plan: isPro ? "pro" : "free",
        status: "active",
        usageCount: subscriptions.length,
        usageLimit: isPro ? 999 : 2,
      });

      if ("Notification" in window && "serviceWorker" in navigator) {
        setIntegrations((prev) => ({ ...prev, webPushSupported: true }));
      }
    } catch {
      // Error loading settings
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

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast("Notifications not supported", "error");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updateNotifications({ webPush: true });
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
      settings: { notifications, appSettings, security, aiSettings, integrations },
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
    if (!confirm("Are you sure you want to clear all data? This cannot be undone.")) return;

    setIsLoading(true);
    try {
      localStorage.removeItem("needix_subscriptions");
      localStorage.removeItem("needix_orders");
      localStorage.removeItem("needix_notifications");
      localStorage.removeItem("needix_app_settings");
      localStorage.removeItem("needix_security");
      localStorage.removeItem("needix_ai");
      localStorage.removeItem("needix_integrations");

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

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch("/api/user/delete", { method: "DELETE" });
      if (response.ok) {
        toast("Account deleted successfully", "success");
        void signOut();
      } else {
        toast("Failed to delete account", "error");
      }
    } catch {
      toast("Failed to delete account", "error");
    }
    setShowDeleteModal(false);
  };

  const testNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
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

  const menuItems = [
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "preferences", label: "App Preferences", icon: "🎨" },
    { id: "billing", label: "Plan & Billing", icon: "💳" },
    { id: "data", label: "Data & Privacy", icon: "💾" },
    { id: "account", label: "Account & Profile", icon: "👤" },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-64 bg-black/20 backdrop-blur-sm border-r border-white/10 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-white/60 text-sm mt-1">Manage your account preferences</p>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                activeSection === item.id
                  ? "bg-blue-600/30 text-white border border-blue-400/30"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8">
        {activeSection === "notifications" && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Notifications</h2>
              <p className="text-white/60">Control how you receive updates from Needix</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">Renewal Reminders</h3>
                    <p className="text-sm text-white/60">Get notified before subscriptions renew</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.renewalReminders}
                      onChange={(e) => updateNotifications({ renewalReminders: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">Price Alerts</h3>
                    <p className="text-sm text-white/60">When subscription prices change</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.priceAlerts}
                      onChange={(e) => updateNotifications({ priceAlerts: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">Email Notifications</h3>
                    <p className="text-sm text-white/60">Receive updates via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => updateNotifications({ emailNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">Web Push</h3>
                    <p className="text-sm text-white/60">Browser notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.webPush}
                      onChange={(e) => {
                        if (e.target.checked) {
                          void requestNotificationPermission();
                        } else {
                          updateNotifications({ webPush: false });
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/20">
                <button
                  onClick={testNotification}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Send Test Notification
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === "preferences" && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">App Preferences</h2>
              <p className="text-white/60">Customize your Needix experience</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <label className="block text-sm font-medium text-white/80 mb-2">Theme</label>
                  <select
                    value={appSettings.theme}
                    onChange={(e) => updateAppSettings({ theme: e.target.value as AppSettings["theme"] })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="dark">🌙 Dark</option>
                    <option value="light">☀️ Light</option>
                    <option value="system">🖥️ System</option>
                  </select>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <label className="block text-sm font-medium text-white/80 mb-2">Currency</label>
                  <select
                    value={appSettings.currency}
                    onChange={(e) => updateAppSettings({ currency: e.target.value as AppSettings["currency"] })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="USD">🇺🇸 USD ($)</option>
                    <option value="EUR">🇪🇺 EUR (€)</option>
                    <option value="GBP">🇬🇧 GBP (£)</option>
                  </select>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <label className="block text-sm font-medium text-white/80 mb-2">Default view</label>
                  <select
                    value={appSettings.defaultView}
                    onChange={(e) => updateAppSettings({ defaultView: e.target.value as AppSettings["defaultView"] })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="grid">📊 Grid</option>
                    <option value="list">📋 List</option>
                  </select>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                  <label className="block text-sm font-medium text-white/80 mb-2">Default tab</label>
                  <select
                    value={appSettings.defaultTab}
                    onChange={(e) => updateAppSettings({ defaultTab: e.target.value as AppSettings["defaultTab"] })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="subscriptions">🔄 Subscriptions</option>
                    <option value="expenses">💰 Expenses</option>
                    <option value="orders">📦 Orders</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg md:col-span-2">
                  <div>
                    <h3 className="font-semibold text-white">Compact Mode</h3>
                    <p className="text-sm text-white/60">Show more items in less space</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={appSettings.compactMode}
                      onChange={(e) => updateAppSettings({ compactMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "billing" && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Plan & Billing</h2>
              <p className="text-white/60">Manage your subscription and usage</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Current Plan</h3>
                  <p className="text-2xl font-bold text-blue-400 capitalize">{billing.plan}</p>
                  <p className="text-sm text-white/60">Status: {billing.status}</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Usage</h3>
                  <p className="text-2xl font-bold text-green-400">{billing.usageCount}/{billing.usageLimit}</p>
                  <p className="text-sm text-white/60">Subscriptions tracked</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg">
                  <h3 className="font-semibold text-white mb-2">Next Billing</h3>
                  <p className="text-xl font-bold text-purple-400">
                    {billing.plan === "pro" ? "$9.99/month" : "Free"}
                  </p>
                  <p className="text-sm text-white/60">
                    {billing.plan === "pro" ? "Auto-renews monthly" : "No charges"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "data" && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Data & Privacy</h2>
              <p className="text-white/60">Export, backup, or clear your data</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-white mb-3">Export Data</h3>
                  <p className="text-white/60 text-sm mb-4">
                    Download your data in JSON format. Includes all subscriptions, orders, expenses, and settings.
                  </p>
                  <Button 
                    onClick={exportData} 
                    variant="secondary"
                    className="bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30"
                  >
                    📄 Export as JSON
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <h3 className="font-semibold text-yellow-400 mb-3">Clear Local Data</h3>
                  <p className="text-white/60 text-sm mb-4">
                    Remove all locally stored data including cache and preferences.
                  </p>
                  <Button 
                    onClick={clearAllData} 
                    variant="secondary" 
                    disabled={isLoading}
                    className="bg-yellow-600/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-600/30"
                  >
                    {isLoading ? "Clearing..." : "🗑️ Clear All Data"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "account" && (
          <div className="max-w-4xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Account & Profile</h2>
              <p className="text-white/60">Manage your account settings</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {user.image && (
                    <img
                      src={user.image}
                      alt="Profile"
                      className="w-16 h-16 rounded-full border border-white/20"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{user.name || "No name set"}</h3>
                    <p className="text-white/60 text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <Button
                    onClick={handleSignOut}
                    variant="secondary"
                    className="bg-orange-600/20 text-orange-300 border-orange-500/30 hover:bg-orange-600/30"
                  >
                    🚪 Sign Out
                  </Button>
                </div>

                <div className="pt-4 border-t border-red-500/30">
                  <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-white/60 text-sm mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="secondary"
                    className="bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30"
                  >
                    🗑️ Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Delete Account</h3>
              <p className="text-white/70 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleDeleteAccount()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}