"use client";

import { useEffect } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useToast } from "@/components/ui/Toast";
import { useNotifications } from "@/lib/hooks/useNotifications";

interface NotificationManagerProps {
  autoInit?: boolean;
  autoSetupReminders?: boolean;
  showStatus?: boolean;
}

interface SubscriptionData {
  id: string;
  name: string;
  nextBillingDate?: string;
  nextBillingAt?: string;
}

export default function NotificationManager({
  autoInit = true,
  autoSetupReminders = true,
  showStatus = false,
}: NotificationManagerProps) {
  const { items: subscriptions } = useSubscriptions();
  const toast = useToast();

  const {
    isSupported,
    hasPermission,
    platform,
    settings,
    initialize,
    setupReminders,
    error,
  } = useNotifications();

  // Initialize (gracefully ignore promise result)
  useEffect(() => {
    if (autoInit && isSupported && !hasPermission) {
      void initialize().catch((e) =>
        console.error("Failed to initialize notifications:", e)
      );
    }
  }, [autoInit, isSupported, hasPermission, initialize]);

  // Prepare data and set up reminders
  useEffect(() => {
    if (
      autoSetupReminders &&
      settings.enabled &&
      hasPermission &&
      Array.isArray(subscriptions) &&
      subscriptions.length > 0
    ) {
      type MaybeSub = {
        id?: unknown;
        name?: unknown;
        nextBillingDate?: unknown;
        nextBillingAt?: unknown;
      };

      const source = subscriptions as unknown as MaybeSub[];
      const subscriptionData: SubscriptionData[] = [];

      for (const s of source) {
        const id = typeof s.id === "string" ? s.id : undefined;
        const name = typeof s.name === "string" ? s.name : undefined;
        const next =
          (typeof s.nextBillingDate === "string" && s.nextBillingDate) ||
          (typeof s.nextBillingAt === "string" && s.nextBillingAt) ||
          undefined;

        if (id && name && next) {
          subscriptionData.push({ id, name, nextBillingDate: next });
        }
      }

      if (subscriptionData.length > 0) {
        void setupReminders(subscriptionData).catch((e) => {
          console.error("Failed to setup reminders:", e);
          toast("Failed to setup notification reminders", "error");
        });
      }
    }
  }, [
    autoSetupReminders,
    settings.enabled,
    hasPermission,
    subscriptions,
    setupReminders,
    toast,
  ]);

  // Error toast
  useEffect(() => {
    if (error) toast(error, "error");
  }, [error, toast]);

  if (!showStatus) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3 max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-white">Notifications</span>
        <div
          className={`w-2 h-2 rounded-full ${
            hasPermission ? "bg-green-400" : isSupported ? "bg-yellow-400" : "bg-red-400"
          }`}
        />
      </div>

      <div className="space-y-1 text-xs text-white/70">
        <div className="flex justify-between">
          <span>Platform:</span>
          <span className="capitalize">{platform}</span>
        </div>
        <div className="flex justify-between">
          <span>Supported:</span>
          <span>{isSupported ? "Yes" : "No"}</span>
        </div>
        <div className="flex justify-between">
          <span>Permission:</span>
          <span>{hasPermission ? "Granted" : "Pending"}</span>
        </div>
        <div className="flex justify-between">
          <span>Enabled:</span>
          <span>{settings.enabled ? "Yes" : "No"}</span>
        </div>
        {Array.isArray(subscriptions) && (
          <div className="flex justify-between">
            <span>Subscriptions:</span>
            <span>{subscriptions.length}</span>
          </div>
        )}
        {settings.enabled && (
          <div className="flex justify-between">
            <span>Reminders:</span>
            <span>{settings.leadDays.length} days</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
