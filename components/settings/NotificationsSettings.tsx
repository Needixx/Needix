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

// Preset time options for better accessibility
const TIME_PRESETS = [
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
];

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
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Sync legacy "webPush" flag to new settings.enabled
  useEffect(() => {
    if (legacyNotifications.webPush !== settings.enabled) {
      setLegacyNotifications((prev) => ({
        ...prev,
        webPush: settings.enabled,
      }));
    }
  }, [settings.enabled, legacyNotifications.webPush, setLegacyNotifications]);

  // Check if current time is in presets
  useEffect(() => {
    const isPreset = TIME_PRESETS.some(preset => preset.value === settings.timeOfDay);
    setShowCustomTime(!isPreset);
  }, [settings.timeOfDay]);

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

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
      const response = await fetch("/api/notifications/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test",
          title: "Test Email Notification",
          body: "This is a test email from your Needix notification settings!"
        })
      });

      if (response.ok) {
        toast("Test email sent! Check your inbox.", "success");
      } else {
        const error = await response.json();
        toast(error.message || "Failed to send test email", "error");
      }
    } catch (e) {
      console.error("Test email failed:", e);
      toast("Failed to send test email", "error");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleLeadDaysChange = (days: number[]) => {
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
      toast(`Added ${days.length} reminder day${days.length > 1 ? 's' : ''}`, "success");
    }
  };

  const removeLeadDay = (dayToRemove: number) => {
    const newLeadDays = settings.leadDays.filter((d) => d !== dayToRemove);
    handleLeadDaysChange(newLeadDays);
    toast(`Removed ${dayToRemove}-day reminder`, "success");
  };

  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
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
            {platform === "native" ? "📱 App" : "🌐 Web"}
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs border ${
              hasPermission
                ? "bg-green-500/20 border-green-500/30 text-green-300"
                : "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"
            }`}
          >
            {hasPermission ? "✅ Enabled" : "🔒 Disabled"}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="text-xl">❌</div>
            <div>
              <h3 className="font-semibold text-red-300">Error</h3>
              <p className="text-sm text-red-200/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Permission Request */}
      {!hasPermission && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔔</div>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-300 mb-2">Enable Notifications</h3>
              <p className="text-yellow-200/80 mb-4">
                Grant permission to receive important reminders about your subscriptions, 
                price changes, and billing dates.
              </p>
              <Button
                onClick={handlePermissionRequest}
                disabled={isLoading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              >
                {isLoading ? "Requesting..." : "Enable Notifications"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Content */}
      {hasPermission && (
        <div className="space-y-6">
          {/* Main Toggle */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Enable Notifications</h3>
                <p className="text-sm text-white/70 mt-1">
                  Turn on to receive subscription reminders
                </p>
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
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>

          {settings.enabled && (
            <>
              {/* Reminder Days */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-3">Reminder Schedule</h3>
                <p className="text-sm text-white/70 mb-4">
                  Get notified X days before your subscriptions renew
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {settings.leadDays.map((days) => (
                    <div
                      key={days}
                      className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple/20 to-cyan/20 border border-purple/40 rounded-full text-sm"
                    >
                      <span>
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
                    className="flex-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm placeholder-white/50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                  />
                  <Button onClick={addCustomLeadDay} disabled={!customLeadDays.trim()} variant="secondary" size="sm">
                    Add
                  </Button>
                </div>
              </div>

              {/* Enhanced Time Selector */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-3">Notification Time</h3>
                <p className="text-sm text-white/70 mb-4">
                  What time should we send your reminders?
                </p>

                {/* Preset Time Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => {
                        void update({ timeOfDay: preset.value });
                        setShowCustomTime(false);
                      }}
                      className={`px-3 py-2 rounded-lg text-sm transition-all ${
                        settings.timeOfDay === preset.value
                          ? "bg-gradient-to-r from-purple/30 to-cyan/30 border border-purple/50 text-white"
                          : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom Time Toggle */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/70">Custom time</span>
                  <button
                    onClick={() => setShowCustomTime(!showCustomTime)}
                    className="text-sm text-cyan-400 hover:text-cyan-300"
                  >
                    {showCustomTime ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Custom Time Input */}
                {showCustomTime && (
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={settings.timeOfDay}
                      onChange={(e) => {
                        void update({ timeOfDay: e.target.value });
                      }}
                      className="px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-white/50">
                      ({formatTime(settings.timeOfDay)})
                    </span>
                  </div>
                )}
              </div>

              {/* Notification Channels */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <h3 className="font-semibold mb-3">Notification Channels</h3>
                <p className="text-sm text-white/70 mb-4">
                  Choose how you want to receive notifications
                </p>

                <div className="space-y-3">
                  {/* Browser/Web Notifications */}
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
                    />
                    <span className="flex items-center gap-2">
                      <span>🌐</span>
                      <span>Browser notifications</span>
                      {platform === "native" && (
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Mobile ready</span>
                      )}
                    </span>
                  </label>

                  {/* Mobile Push Notifications */}
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
                    />
                    <span className="flex items-center gap-2">
                      <span>📱</span>
                      <span>Mobile push notifications</span>
                    </span>
                  </label>

                  {/* Email Notifications */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.channels.email}
                      onChange={(e) => {
                        void update({
                          channels: { ...settings.channels, email: e.target.checked },
                        });
                      }}
                      className="w-4 h-4 rounded border border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="flex items-center gap-2">
                      <span>📧</span>
                      <span>Email notifications</span>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">NEW!</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Test Notifications */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Test Notifications</h3>
                    <p className="text-sm text-white/70 mt-1">
                      Send test notifications to verify everything works
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Test Push Notification */}
                  <div className="p-3 bg-black/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">Push Notification</h4>
                        <p className="text-xs text-white/60">Browser/mobile test</p>
                      </div>
                      <Button
                        onClick={() => {
                          void handleTestNotification();
                        }}
                        disabled={isTestingNotification || isLoading}
                        variant="secondary"
                        size="sm"
                      >
                        {isTestingNotification ? "Sending..." : "Test"}
                      </Button>
                    </div>
                  </div>

                  {/* Test Email Notification */}
                  <div className="p-3 bg-black/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">Email Notification</h4>
                        <p className="text-xs text-white/60">Email delivery test</p>
                      </div>
                      <Button
                        onClick={handleTestEmail}
                        disabled={isTestingEmail || !settings.channels.email}
                        variant="secondary"
                        size="sm"
                      >
                        {isTestingEmail ? "Sending..." : "Test"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Test Results */}
                {lastTestResult !== null && (
                  <div className={`mt-3 text-sm p-2 rounded ${lastTestResult ? "text-green-300 bg-green-500/10" : "text-red-300 bg-red-500/10"}`}>
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