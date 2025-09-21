"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { signOut } from "next-auth/react";
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
};

type AppSettings = {
  theme: "dark" | "light" | "system";
  currency: "USD" | "EUR" | "GBP";
  defaultView: "grid" | "list";
  compactMode: boolean;
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  renewalReminders: true,
  priceAlerts: true,
  weeklyDigest: false,
  emailNotifications: true,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "dark",
  currency: "USD",
  defaultView: "grid",
  compactMode: false,
};

// Narrowing helpers to keep JSON.parse types safe
function isNotificationSettings(v: unknown): v is NotificationSettings {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.renewalReminders === "boolean" &&
    typeof o.priceAlerts === "boolean" &&
    typeof o.weeklyDigest === "boolean" &&
    typeof o.emailNotifications === "boolean"
  );
}

function isAppSettings(v: unknown): v is AppSettings {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    (o.theme === "dark" || o.theme === "light" || o.theme === "system") &&
    (o.currency === "USD" || o.currency === "EUR" || o.currency === "GBP") &&
    (o.defaultView === "grid" || o.defaultView === "list") &&
    typeof o.compactMode === "boolean"
  );
}

export default function SettingsClient({ user }: { user: User }) {
  const subsData = useSubscriptions();
  const ordersData = useOrders();
  const { isPro } = useSubscriptionLimit();
  const toast = useToast();

  const [notifications, setNotifications] =
    useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [appSettings, setAppSettings] =
    useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem(
        "needix.settings.notifications"
      );
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications) as unknown;
        if (isNotificationSettings(parsed)) {
          setNotifications(parsed);
        }
      }

      const savedAppSettings = localStorage.getItem("needix.settings.app");
      if (savedAppSettings) {
        const parsed = JSON.parse(savedAppSettings) as unknown;
        if (isAppSettings(parsed)) {
          setAppSettings(parsed);
        }
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }, []);

  // Save notification settings
  const updateNotifications = (newSettings: Partial<NotificationSettings>) => {
    const updated: NotificationSettings = { ...notifications, ...newSettings };
    setNotifications(updated);
    try {
      localStorage.setItem(
        "needix.settings.notifications",
        JSON.stringify(updated)
      );
      toast("Notification preferences updated", "success");
    } catch {
      toast("Failed to save notification settings", "error");
    }
  };

  // Save app settings
  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    const updated: AppSettings = { ...appSettings, ...newSettings };
    setAppSettings(updated);
    try {
      localStorage.setItem("needix.settings.app", JSON.stringify(updated));
      toast("App preferences updated", "success");
    } catch {
      toast("Failed to save app settings", "error");
    }
  };

  // Export data as JSON
  const exportData = () => {
    try {
      const data = {
        subscriptions: subsData.items,
        orders: ordersData.items,
        settings: {
          notifications,
          app: appSettings,
        },
        exportDate: new Date().toISOString(),
        user: {
          email: user.email,
          name: user.name,
        },
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `needix-data-${new Date()
        .toISOString()
        .split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast("Data exported successfully", "success");
    } catch {
      toast("Failed to export data", "error");
    }
  };

  // Clear all local data (synchronous to satisfy lint)
  const clearAllData = () => {
    if (
      !confirm(
        "Are you sure you want to clear all local data? This cannot be undone."
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      // Clear each subscription individually
      const currentSubs = subsData.items;
      for (const sub of currentSubs) {
        subsData.remove(sub.id);
      }

      // Clear each order individually
      const currentOrders = ordersData.items;
      for (const order of currentOrders) {
        ordersData.remove(order.id);
      }

      // Clear settings
      localStorage.removeItem("needix.settings.notifications");
      localStorage.removeItem("needix.settings.app");

      // Clear any other Needix-related data
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("needix.")) {
          keys.push(key);
        }
      }
      keys.forEach((key) => localStorage.removeItem(key));

      // Reset state
      setNotifications(DEFAULT_NOTIFICATIONS);
      setAppSettings(DEFAULT_APP_SETTINGS);

      toast("All data cleared successfully", "success");
    } catch {
      toast("Failed to clear data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete account (placeholder for now)
  const deleteAccount = () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    alert(
      "Account deletion is not yet implemented. Please contact support at needix2025@gmail.com to delete your account."
    );
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">👤</span>
          <h2 className="text-lg font-medium">Profile</h2>
        </div>
        <p className="mb-4 text-white/70">
          Your account information is managed through your authentication
          provider.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm text-white/70">Name</span>
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none text-white/80"
              value={user?.name || "Not provided"}
              disabled
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-white/70">Email</span>
            <input
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 outline-none text-white/80"
              value={user?.email || "Not provided"}
              disabled
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isPro ? "bg-cyan-400" : "bg-green-500"
            }`}
          />
          <span className="text-sm text-white/70">
            {isPro ? "Needix Pro" : "Free Plan"} • {subsData.items.length}{" "}
            subscription{subsData.items.length !== 1 ? "s" : ""} •{" "}
            {ordersData.items.length} order
            {ordersData.items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🔔</span>
          <h2 className="text-lg font-medium">Notifications</h2>
        </div>
        <p className="mb-4 text-white/70">
          Choose when and how you want to be notified about your subscriptions.
        </p>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Renewal reminders</div>
              <div className="text-sm text-white/60">
                Get notified before subscriptions renew
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              checked={notifications.renewalReminders}
              onChange={(e) =>
                updateNotifications({ renewalReminders: e.target.checked })
              }
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Price change alerts</div>
              <div className="text-sm text-white/60">
                Get notified when subscription prices change
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              checked={notifications.priceAlerts}
              onChange={(e) =>
                updateNotifications({ priceAlerts: e.target.checked })
              }
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly digest</div>
              <div className="text-sm text-white/60">
                Weekly summary of your subscriptions
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              checked={notifications.weeklyDigest}
              onChange={(e) =>
                updateNotifications({ weeklyDigest: e.target.checked })
              }
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email notifications</div>
              <div className="text-sm text-white/60">
                Receive notifications via email
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              checked={notifications.emailNotifications}
              onChange={(e) =>
                updateNotifications({ emailNotifications: e.target.checked })
              }
            />
          </label>
        </div>
      </section>

      {/* App Preferences */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">🎨</span>
          <h2 className="text-lg font-medium">App Preferences</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm text-white/70">Theme</span>
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              value={appSettings.theme}
              onChange={(e) =>
                updateAppSettings({
                  theme: e.target.value as "dark" | "light" | "system",
                })
              }
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-white/70">Currency</span>
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              value={appSettings.currency}
              onChange={(e) =>
                updateAppSettings({
                  currency: e.target.value as "USD" | "EUR" | "GBP",
                })
              }
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-sm text-white/70">Default view</span>
            <select
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
              value={appSettings.defaultView}
              onChange={(e) =>
                updateAppSettings({
                  defaultView: e.target.value as "grid" | "list",
                })
              }
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </label>
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Compact mode</div>
              <div className="text-sm text-white/60">
                Show more items in less space
              </div>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
              checked={appSettings.compactMode}
              onChange={(e) =>
                updateAppSettings({ compactMode: e.target.checked })
              }
            />
          </label>
        </div>
      </section>

      {/* Data Management */}
      <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">💾</span>
          <h2 className="text-lg font-medium">Data Management</h2>
        </div>
        <p className="mb-4 text-white/70">
          Export your data or clear all local information.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportData} variant="secondary">
            📄 Export as PDF
          </Button>
          <Button
            onClick={clearAllData}
            variant="secondary"
            disabled={isLoading}
            className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
          >
            {isLoading ? "⏳ Clearing..." : "🧹 Clear All Data"}
          </Button>
        </div>
      </section>

      {/* Account Actions */}
      <section className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">⚠️</span>
          <h2 className="text-lg font-medium text-red-400">Account Actions</h2>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Sign Out</h3>
            <p className="text-white/70 text-sm mb-3">
              Sign out of your account on this device.
            </p>
            <Button
              onClick={() => {
                void signOut({ callbackUrl: "/" });
              }}
              variant="secondary"
              className="text-orange-400 border-orange-400/30 hover:bg-orange-400/10"
            >
              🚪 Sign Out
            </Button>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="font-medium mb-2 text-red-400">Delete Account</h3>
            <p className="text-white/70 text-sm mb-3">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <Button
              onClick={deleteAccount}
              className="bg-red-600/20 text-red-400 border-red-500/30 hover:bg-red-600/30"
            >
              🗑️ Delete Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
