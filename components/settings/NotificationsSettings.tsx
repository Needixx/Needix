// components/settings/NotificationsSettings.tsx
"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import type { NotificationSettings as LegacyNotificationSettings } from "@/components/settings/types";

interface NotificationsSettingsProps {
  notifications: LegacyNotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<LegacyNotificationSettings>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

type SettingsPatch = Partial<{
  enabled: boolean;
  leadDays: number[];
  timeOfDay: string;
  channels: { web: boolean; mobile: boolean; email: boolean };
}>;

export default function NotificationsSettings({
  notifications: legacyNotifications,
  setNotifications: setLegacyNotifications,
}: NotificationsSettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);

  const {
    isSupported,
    hasPermission,
    platform,
    settings,
    updateSettings,
    requestPermission,
    testNotification,
    isLoading,
    error,
    lastTestResult,
  } = useNotifications();

  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [customLeadDays, setCustomLeadDays] = useState("");

  // Sync legacy "webPush" flag to new settings.enabled
  useEffect(() => {
    if (legacyNotifications.webPush !== settings.enabled) {
      setLegacyNotifications((prev) => ({
        ...prev,
        webPush: settings.enabled,
      }));
    }
  }, [settings.enabled, legacyNotifications.webPush, setLegacyNotifications]);

  /** Centralized, typed updater that also keeps legacy settings in sync */
  const update = async (patch: SettingsPatch) => {
    try {
      await updateSettings(patch);
      toast("Notification settings updated", "success");

      if (typeof patch.enabled === "boolean") {
        setLegacyNotifications((prev) => ({ ...prev, webPush: patch.enabled as boolean }));
      }
    } catch (e) {
      console.error("Failed to update settings:", e);
      toast("Failed to update settings", "error");
    }
  };

  const handlePermissionRequest = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        toast("Notifications enabled successfully! 🎉", "success");
        await update({ enabled: true });
      } else {
        toast("Permission denied. Please enable notifications in your browser settings.", "error");
      }
    } catch (e) {
      console.error("Permission request failed:", e);
      toast("Failed to request permission", "error");
    }
  };

  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    try {
      const success = await testNotification();
      if (success) {
        toast("Test notification sent! Check your notifications.", "success");
      } else {
        toast("Failed to send test notification", "error");
      }
    } catch (e) {
      console.error("Test notification failed:", e);
      toast("Failed to send test notification", "error");
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleLeadDaysChange = (days: number[]) => {
    // update returns a Promise; explicitly ignore it for no-floating-promises
    void update({ leadDays: days });
  };

  const addCustomLeadDay = () => {
    const days = customLeadDays
      .split(",")
      .map((d) => parseInt(d.trim(), 10))
      .filter((d) => !isNaN(d) && d >= 0 && d <= 30);

    if (days.length > 0) {
      const newLeadDays = [...new Set([...settings.leadDays, ...days])].sort((a, b) => b - a);
      handleLeadDaysChange(newLeadDays);
      setCustomLeadDays("");
    }
  };

  const removeLeadDay = (dayToRemove: number) => {
    const newLeadDays = settings.leadDays.filter((d) => d !== dayToRemove);
    handleLeadDaysChange(newLeadDays);
  };

  if (!isSupported) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-300">Notifications Not Supported</h3>
              <p className="text-sm text-red-200/80 mt-1">
                Your device or browser doesn't support push notifications.
                Try updating your browser or using a different device.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">🔔 Notifications</h2>
          <p className="text-sm text-white/70 mt-1">
            Stay informed about your subscription renewals and price changes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`px-2 py-1 rounded-full text-xs border ${
              platform === "native"
                ? "bg-green-500/20 border-green-500/30 text-green-300"
                : "bg-blue-500/20 border-blue-500/30 text-blue-300"
            }`}
          >
            {platform === "native" ? "📱 Mobile App" : "🌐 Web Browser"}
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs border ${
              hasPermission
                ? "bg-green-500/20 border-green-500/30 text-green-300"
                : "bg-orange-500/20 border-orange-500/30 text-orange-300"
            }`}
          >
            {hasPermission ? "✅ Enabled" : "⚠️ Permission Required"}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">❌ {error}</p>
        </div>
      )}

      {/* Permission Request */}
      {!hasPermission && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-orange-300">Enable Notifications</h3>
              <p className="text-sm text-orange-200/80 mt-1">
                Grant permission to receive subscription reminders and alerts
              </p>
            </div>
            <Button
              onClick={() => {
                void handlePermissionRequest();
              }}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? "Requesting..." : "Enable"}
            </Button>
          </div>
        </div>
      )}

      {/* Main Settings */}
      {hasPermission && (
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
            <div>
              <h3 className="font-semibold">Notification Reminders</h3>
              <p className="text-sm text-white/70 mt-1">Receive alerts before your subscriptions renew</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => {
                  void update({ enabled: e.target.checked });
                }}
                className="sr-only peer"
                disabled={isLoading}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {settings.enabled && (
            <>
              {/* Reminder Days */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-3">Reminder Schedule</h3>
                <p className="text-sm text-white/70 mb-4">
                  Choose how many days before renewal you want to be notified
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {settings.leadDays.map((days) => (
                    <div
                      key={days}
                      className="flex items-center gap-1 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300"
                    >
                      <span className="text-sm">
                        {days === 0 ? "Same day" : `${days} day${days > 1 ? "s" : ""} before`}
                      </span>
                      <button
                        onClick={() => removeLeadDay(days)}
                        className="ml-1 text-cyan-300 hover:text-red-300 transition-colors"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLeadDays}
                    onChange={(e) => setCustomLeadDays(e.target.value)}
                    placeholder="Add custom days (e.g., 14, 30)"
                    className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm placeholder-white/50"
                  />
                  <Button onClick={addCustomLeadDay} disabled={!customLeadDays.trim()} variant="secondary" size="sm">
                    Add
                  </Button>
                </div>
              </div>

              {/* Time of Day */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-3">Notification Time</h3>
                <p className="text-sm text-white/70 mb-4">What time should we send your reminders?</p>
                <input
                  type="time"
                  value={settings.timeOfDay}
                  onChange={(e) => {
                    void update({ timeOfDay: e.target.value });
                  }}
                  className="px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Notification Channels */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-3">Notification Channels</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.channels.web}
                      onChange={(e) => {
                        void update({
                          channels: { ...settings.channels, web: e.target.checked },
                        });
                      }}
                      className="w-4 h-4 rounded border border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500"
                      disabled={isLoading}
                    />
                    <span className="flex items-center gap-2">
                      <span>🌐</span>
                      <span>Browser notifications</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.channels.mobile}
                      onChange={(e) => {
                        void update({
                          channels: { ...settings.channels, mobile: e.target.checked },
                        });
                      }}
                      className="w-4 h-4 rounded border border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500"
                      disabled={isLoading}
                    />
                    <span className="flex items-center gap-2">
                      <span>📱</span>
                      <span>Mobile push notifications</span>
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer opacity-50">
                    <input
                      type="checkbox"
                      checked={settings.channels.email}
                      onChange={(e) => {
                        void update({
                          channels: { ...settings.channels, email: e.target.checked },
                        });
                      }}
                      className="w-4 h-4 rounded border border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500"
                      disabled={true}
                    />
                    <span className="flex items-center gap-2">
                      <span>📧</span>
                      <span>Email notifications (coming soon)</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Test Notification */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Test Notifications</h3>
                    <p className="text-sm text-white/70 mt-1">
                      Send a test notification to verify everything works
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      void handleTestNotification();
                    }}
                    disabled={isTestingNotification || isLoading}
                    variant="secondary"
                  >
                    {isTestingNotification ? "Sending..." : "Send Test"}
                  </Button>
                </div>

                {lastTestResult !== null && (
                  <div className={`mt-3 text-sm ${lastTestResult ? "text-green-300" : "text-red-300"}`}>
                    {lastTestResult ? "✅ Test notification sent successfully!" : "❌ Test notification failed"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
