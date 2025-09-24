// components/settings/NotificationsSettings.tsx
"use client";

import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
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

/** Patch shape accepted by the notifications API */
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
        // keep legacy setting in sync for backward compatibility
        setLegacyNotifications((prev) => ({ ...prev, webPush: patch.enabled as boolean }));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to update settings:", e);
      toast("Failed to update settings", "error");
    }
  };

  const handlePermissionRequest = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        toast("Notifications enabled successfully!", "success");
        setLegacyNotifications((prev) => ({ ...prev, webPush: true }));
      } else {
        toast("Notification permission denied", "error");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to request permission:", e);
      toast("Failed to enable notifications", "error");
    }
  };

  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    try {
      const success = await testNotification();
      if (success) {
        toast("Test notification sent! Check your device.", "success");
      } else {
        toast("Test notification failed", "error");
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Test notification failed:", e);
      toast("Test notification failed", "error");
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleLeadDaysChange = (leadDays: number[]) => {
    void update({ leadDays });
  };

  const handleTimeChange = (timeOfDay: string) => {
    void update({ timeOfDay });
  };

  const toggleLeadDay = (day: number) => {
    const newLeadDays = settings.leadDays.includes(day)
      ? settings.leadDays.filter((d) => d !== day)
      : [...settings.leadDays, day].sort((a, b) => b - a);
    handleLeadDaysChange(newLeadDays);
  };

  // Legacy helpers (local UI bits that still write to localStorage for older flows)
  const updateLegacyNotifications = (updates: Partial<LegacyNotificationSettings>) => {
    const newSettings = { ...legacyNotifications, ...updates };
    setLegacyNotifications(newSettings);
    localStorage.setItem("needix_notifications", JSON.stringify(newSettings));
  };

  const onLegacyCheckbox =
    (key: keyof LegacyNotificationSettings) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      updateLegacyNotifications({ [key]: e.target.checked } as Partial<LegacyNotificationSettings>);
      toast("Settings updated", "success");
    };

  const onLegacySelectString =
    (key: "digestDay" | "digestTime") =>
    (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      updateLegacyNotifications({ [key]: e.target.value } as Partial<LegacyNotificationSettings>);

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔔 Notifications</h2>
        <p className="text-white/60">Manage how and when you receive alerts about your subscriptions</p>
      </div>

      {/* Notification Support Status */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70">Platform</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSupported ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-sm font-medium text-white capitalize">
                {platform === "unknown" ? "Detecting..." : platform}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">Notifications Supported</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSupported ? "bg-green-400" : "bg-red-400"}`} />
              <span className="text-sm font-medium text-white">{isSupported ? "Yes" : "No"}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">Permission Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasPermission ? "bg-green-400" : "bg-yellow-400"}`} />
              <span className="text-sm font-medium text-white">{hasPermission ? "Granted" : "Not Granted"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">Error</span>
          </div>
          <p className="text-red-300 mt-1 text-sm">{error}</p>
        </div>
      )}

      {/* Enable Notifications */}
      {isSupported && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Enable Notifications</h3>
              <p className="text-white/60 text-sm">Get reminders about subscription renewals and price changes</p>
            </div>
            <div className="flex items-center gap-3">
              {!hasPermission ? (
                <Button
                  onClick={() => {
                    void handlePermissionRequest();
                  }}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple to-cyan text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isLoading ? "Requesting..." : "Enable"}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-green-400 text-sm font-medium">Enabled</span>
                </div>
              )}
            </div>
          </div>

          {hasPermission && (
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => {
                    void update({ enabled: e.target.checked });
                  }}
                  className="w-4 h-4 text-purple focus:ring-purple/20 bg-white/10 border-white/30 rounded"
                />
                <span className="text-white">Send notification reminders</span>
              </label>
              <Button
                onClick={() => {
                  void handleTestNotification();
                }}
                disabled={isTestingNotification}
                className="ml-auto bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-sm"
              >
                {isTestingNotification ? "Testing..." : "Test"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Reminder Settings */}
      {settings.enabled && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Reminder Settings</h3>

          {/* Lead Days */}
          <div className="space-y-4">
            <div>
              <label className="block text-white font-medium mb-2">Remind me before renewal:</label>
              <div className="flex flex-wrap gap-2">
                {[14, 7, 3, 1].map((days) => (
                  <button
                    key={days}
                    onClick={() => toggleLeadDay(days)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      settings.leadDays.includes(days)
                        ? "bg-gradient-to-r from-purple to-cyan text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {days} day{days === 1 ? "" : "s"}
                  </button>
                ))}
              </div>
              <p className="text-white/60 text-xs mt-1">
                Selected:{" "}
                {settings.leadDays.length === 0
                  ? "None"
                  : settings.leadDays.slice().sort((a, b) => b - a).join(", ") + " days"}
              </p>
            </div>

            {/* Time of Day */}
            <div>
              <label className="block text-white font-medium mb-2">Preferred notification time:</label>
              <input
                type="time"
                value={settings.timeOfDay}
                onChange={(e) => {
                  void handleTimeChange(e.target.value);
                }}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple/20 focus:border-purple/40"
              />
              <p className="text-white/60 text-xs mt-1">Notifications will be sent at this time each day</p>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Notification Settings for Backward Compatibility */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Additional Settings</h3>
        <div className="space-y-4">
          {/* Renewal Reminders */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔄</span>
                <span className="font-medium text-white">Renewal Reminders</span>
              </div>
              <p className="text-white/60 text-sm">Get notified about upcoming subscription renewals</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={legacyNotifications.renewalReminders}
                onChange={onLegacyCheckbox("renewalReminders")}
                className="w-4 h-4 text-purple focus:ring-purple/20 bg-white/10 border-white/30 rounded"
              />
            </label>
          </div>

          {/* Price Change Alerts */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💰</span>
                <span className="font-medium text-white">Price Change Alerts</span>
              </div>
              <p className="text-white/60 text-sm">Get alerted when subscription prices change</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={legacyNotifications.priceChanges}
                onChange={onLegacyCheckbox("priceChanges")}
                className="w-4 h-4 text-purple focus:ring-purple/20 bg-white/10 border-white/30 rounded"
              />
            </label>
          </div>

          {/* Weekly Digest */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📊</span>
                  <span className="font-medium text-white">Weekly Digest</span>
                </div>
                <p className="text-white/60 text-sm">Receive a weekly summary of your subscriptions</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legacyNotifications.weeklyDigest}
                  onChange={onLegacyCheckbox("weeklyDigest")}
                  className="w-4 h-4 text-purple focus:ring-purple/20 bg-white/10 border-white/30 rounded"
                />
              </label>
            </div>

            {legacyNotifications.weeklyDigest && (
              <div className="ml-4 pl-4 border-l-2 border-purple/30 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Day of week</label>
                  <select
                    value={legacyNotifications.digestDay}
                    onChange={onLegacySelectString("digestDay")}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple/20"
                  >
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Time</label>
                  <input
                    type="time"
                    value={legacyNotifications.digestTime}
                    onChange={onLegacySelectString("digestTime")}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-purple/20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Results */}
      {lastTestResult !== null && (
        <div
          className={`rounded-xl p-4 ${
            lastTestResult ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{lastTestResult ? "✅" : "❌"}</span>
            <span className={`font-medium ${lastTestResult ? "text-green-400" : "text-red-400"}`}>
              {lastTestResult ? "Test notification sent successfully!" : "Test notification failed"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
