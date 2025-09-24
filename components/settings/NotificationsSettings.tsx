import { useState } from "react";
import type { ChangeEvent } from "react";
import { NotificationSettings } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

interface NotificationsSettingsProps {
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function NotificationsSettings({ notifications, setNotifications }: NotificationsSettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);

  const [isLoading, setIsLoading] = useState(false);

  const updateNotifications = (updates: Partial<NotificationSettings>) => {
    const newSettings = { ...notifications, ...updates };
    setNotifications(newSettings);
    localStorage.setItem("needix_notifications", JSON.stringify(newSettings));
    toast("Notification settings updated", "success");
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast("Notifications not supported", "error");
      return;
    }

    try {
      setIsLoading(true);
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        updateNotifications({ webPush: true });
        toast("Notifications enabled successfully!", "success");
      } else {
        toast("Notification permission denied", "error");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast("Failed to enable notifications", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const onCheckbox =
    (key: keyof NotificationSettings) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      updateNotifications({ [key]: e.target.checked } as Partial<NotificationSettings>);

  const onSelectNumber =
    (key: "renewalLeadDays" | "priceChangeThreshold") =>
    (e: ChangeEvent<HTMLSelectElement>) =>
      updateNotifications({ [key]: parseInt(e.target.value, 10) });

  const onSelectString =
    (key: "digestDay" | "digestTime") =>
    (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      updateNotifications({ [key]: e.target.value } as Partial<NotificationSettings>);

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🔔 Notifications</h2>
        <p className="text-white/60">Manage how and when you receive alerts about your subscriptions</p>
      </div>

      {/* Main Notification Types */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Alert Types</h3>
        <div className="space-y-4">
          {/* Renewal Reminders */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-white">Renewal Reminders</div>
              <div className="text-sm text-white/60">Get notified before subscriptions renew</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.renewalReminders}
                onChange={onCheckbox("renewalReminders")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
            </label>
          </div>

          {/* Price Alerts */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-white">Price Change Alerts</div>
              <div className="text-sm text-white/60">Get notified when subscription prices change</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.priceAlerts}
                onChange={onCheckbox("priceAlerts")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
            </label>
          </div>

          {/* Weekly Digest */}
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-white">Weekly Digest</div>
              <div className="text-sm text-white/60">Weekly summary of your subscription activity</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifications.weeklyDigest}
                onChange={onCheckbox("weeklyDigest")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Delivery Methods */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Delivery Methods</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Notifications */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">📧 Email</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={onCheckbox("emailNotifications")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
              </label>
            </div>
            <p className="text-sm text-white/60">Receive notifications via email</p>
          </div>

          {/* Web Push */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">🔔 Browser Push</span>
              {!notifications.webPush ? (
                <Button
                  onClick={() => { void requestNotificationPermission(); }}
                  disabled={isLoading}
                  variant="secondary"
                  size="sm"
                >
                  {isLoading ? "Enabling..." : "Enable"}
                </Button>
              ) : (
                <span className="text-green-400 text-sm">✓ Enabled</span>
              )}
            </div>
            <p className="text-sm text-white/60">Get push notifications in your browser</p>
          </div>
        </div>
      </div>

      {/* Timing Settings */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Timing & Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Renewal Reminder Lead Time
            </label>
            <select
              value={notifications.renewalLeadDays}
              onChange={onSelectNumber("renewalLeadDays")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value={1}>1 day before</option>
              <option value={3}>3 days before</option>
              <option value={7}>1 week before</option>
              <option value={14}>2 weeks before</option>
              <option value={30}>1 month before</option>
            </select>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Price Alert Threshold
            </label>
            <select
              value={notifications.priceChangeThreshold}
              onChange={onSelectNumber("priceChangeThreshold")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value={5}>5% or more</option>
              <option value={10}>10% or more</option>
              <option value={15}>15% or more</option>
              <option value={25}>25% or more</option>
            </select>
          </div>
        </div>
      </div>

      {/* Digest details */}
      {notifications.weeklyDigest && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Digest Timing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <label className="block text-sm font-medium text-white/80 mb-2">Day</label>
              <select
                value={notifications.digestDay}
                onChange={onSelectString("digestDay")}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
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
            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <label className="block text-sm font-medium text-white/80 mb-2">Time</label>
              <input
                type="time"
                value={notifications.digestTime}
                onChange={(e) => onSelectString("digestTime")(e as unknown as ChangeEvent<HTMLInputElement>)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
