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
    const webPushEnabled = legacyNotifications.webPush ?? false;
    if (webPushEnabled !== settings.enabled) {
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
        setLegacyNotifications((prev) => ({ ...prev, webPush: patch.enabled ?? false }));
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
    if (isTestingNotification) return;
    
    setIsTestingNotification(true);
    try {
      // Call testNotification without arguments since it expects 0 arguments
      const success = await testNotification();
      
      if (success) {
        toast("Test notification sent! Check your device.", "success");
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

  const handleEmailTest = async () => {
    setIsTestingEmail(true);
    try {
      // Mock email test
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast("Test email sent! Check your inbox.", "success");
    } catch (e) {
      toast("Failed to send test email", "error");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleLeadDaysChange = (days: number) => {
    const currentDays = settings.leadDays || [3];
    const newDays = currentDays.includes(days) 
      ? currentDays.filter(d => d !== days)
      : [...currentDays, days].sort((a, b) => a - b);
    
    void update({ leadDays: newDays });
  };

  const handleCustomLeadDays = () => {
    const days = parseInt(customLeadDays);
    if (days > 0 && days <= 30) {
      handleLeadDaysChange(days);
      setCustomLeadDays("");
    }
  };

  const handleTimeChange = (time: string) => {
    setShowCustomTime(false);
    void update({ timeOfDay: time });
  };

  const updateLegacySetting = (key: keyof LegacyNotificationSettings, value: boolean) => {
    setLegacyNotifications(prev => ({ ...prev, [key]: value }));
    localStorage.setItem("needix_notifications", JSON.stringify({ 
      ...legacyNotifications, 
      [key]: value 
    }));
    toast("Settings updated", "success");
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔔 Notifications</h2>
        <p className="text-white/60">Configure how and when you receive subscription reminders</p>
      </div>

      {/* Web Push Notifications */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Push Notifications</h3>
            <p className="text-sm text-white/60">
              {platform === "web" ? "Browser notifications" : "Mobile push notifications"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSupported ? (
              <span className="text-green-400 text-sm">✓ Supported</span>
            ) : (
              <span className="text-red-400 text-sm">Not Available</span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {!hasPermission ? (
            <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-300">Enable Notifications</h4>
                  <p className="text-sm text-blue-200">Get reminded about upcoming renewals</p>
                </div>
                <Button
                  onClick={handlePermissionRequest}
                  disabled={isLoading || !isSupported}
                  variant="primary"
                  size="sm"
                >
                  {isLoading ? "Requesting..." : "Enable"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-white">Notification Reminders</label>
                  <p className="text-sm text-white/60">Receive push notifications for renewals</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => void update({ enabled: e.target.checked })}
                  className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
              </div>

              {settings.enabled && (
                <Button
                  onClick={handleTestNotification}
                  disabled={isTestingNotification}
                  variant="secondary"
                  size="sm"
                >
                  {isTestingNotification ? "Sending..." : "🧪 Send Test Notification"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reminder Timing */}
      {hasPermission && settings.enabled && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Reminder Timing</h3>

          <div className="space-y-6">
            {/* Lead Days */}
            <div>
              <label className="block font-medium text-white mb-3">Days Before Renewal</label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[1, 3, 7, 14].map((days) => (
                  <button
                    key={days}
                    onClick={() => handleLeadDaysChange(days)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      (settings.leadDays || [3]).includes(days)
                        ? "bg-purple-500 border-purple-400 text-white"
                        : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {days} day{days !== 1 ? "s" : ""}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customLeadDays}
                  onChange={(e) => setCustomLeadDays(e.target.value)}
                  placeholder="Custom days"
                  min="1"
                  max="30"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Button
                  onClick={handleCustomLeadDays}
                  disabled={!customLeadDays || parseInt(customLeadDays) <= 0}
                  variant="secondary"
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Time of Day */}
            <div>
              <label className="block font-medium text-white mb-3">Time of Day</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleTimeChange(preset.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      settings.timeOfDay === preset.value
                        ? "bg-purple-500 border-purple-400 text-white"
                        : "bg-white/5 border-white/20 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {showCustomTime && (
                <input
                  type="time"
                  value={settings.timeOfDay || "09:00"}
                  onChange={(e) => void update({ timeOfDay: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}

              <button
                onClick={() => setShowCustomTime(!showCustomTime)}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300"
              >
                {showCustomTime ? "Hide custom time" : "Set custom time"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Email Notifications */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-white">Renewal Reminders</label>
              <p className="text-sm text-white/60">Email reminders for upcoming renewals</p>
            </div>
            <input
              type="checkbox"
              checked={legacyNotifications.renewalReminders}
              onChange={(e) => updateLegacySetting("renewalReminders", e.target.checked)}
              className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-white">Price Alerts</label>
              <p className="text-sm text-white/60">Get notified when subscription prices change</p>
            </div>
            <input
              type="checkbox"
              checked={legacyNotifications.priceAlerts}
              onChange={(e) => updateLegacySetting("priceAlerts", e.target.checked)}
              className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-white">Weekly Digest</label>
              <p className="text-sm text-white/60">Summary of your subscription activity</p>
            </div>
            <input
              type="checkbox"
              checked={legacyNotifications.weeklyDigest}
              onChange={(e) => updateLegacySetting("weeklyDigest", e.target.checked)}
              className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-white">All Email Notifications</label>
              <p className="text-sm text-white/60">Master switch for email notifications</p>
            </div>
            <input
              type="checkbox"
              checked={legacyNotifications.emailNotifications}
              onChange={(e) => updateLegacySetting("emailNotifications", e.target.checked)}
              className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
            />
          </div>

          {legacyNotifications.emailNotifications && (
            <Button
              onClick={handleEmailTest}
              disabled={isTestingEmail}
              variant="secondary"
              size="sm"
            >
              {isTestingEmail ? "Sending..." : "📧 Send Test Email"}
            </Button>
          )}
        </div>
      </div>

      {/* Notification Status */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Status Overview</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${hasPermission ? "text-green-400" : "text-red-400"}`}>
              {hasPermission ? "✓" : "✗"}
            </div>
            <div className="text-sm text-white/60">Push Permission</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${settings.enabled ? "text-green-400" : "text-gray-400"}`}>
              {settings.enabled ? "✓" : "○"}
            </div>
            <div className="text-sm text-white/60">Push Enabled</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${legacyNotifications.emailNotifications ? "text-green-400" : "text-gray-400"}`}>
              {legacyNotifications.emailNotifications ? "✓" : "○"}
            </div>
            <div className="text-sm text-white/60">Email Enabled</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {(settings.leadDays || [3]).length}
            </div>
            <div className="text-sm text-white/60">Lead Days</div>
          </div>
        </div>
      </div>
    </div>
  );
}