// lib/notifications/NotificationService.ts
"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications, type ScheduleOptions } from "@capacitor/local-notifications";

/** Minimal payload we use across web + native */
export type NotificationPayload = {
  id: number;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

/** Settings used to schedule reminders */
export type ReminderSettings = {
  enabled: boolean;
  leadDays: number[];          // e.g., [7, 3, 1]
  timeOfDay: string;           // "HH:MM"
  channels: { web: boolean; mobile: boolean; email: boolean };
};

class NotificationService {
  private static instance: NotificationService;

  private isNative = false;
  private webPushSubscription: PushSubscription | null = null; // DOM type
  private vapidPublicKey: string | null = null;

  // Track setTimeout handles for web-delayed notifications
  private timers: Map<number, number> = new Map();

  private constructor() {
    if (typeof window !== "undefined") {
      this.isNative = Capacitor.isNativePlatform();
      this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /** Entry point: requests permissions + sets up push (web) or channels (native) */
  async initialize(): Promise<boolean> {
    try {
      if (this.isNative) {
        await this.initializeNative();
      } else {
        await this.initializeWeb();
      }
      return true;
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      return false;
    }
  }

  /** Capacitor-side setup */
  private async initializeNative(): Promise<void> {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display !== "granted") {
      throw new Error("Notification permission denied");
    }

    // Android channels
    if (Capacitor.getPlatform() === "android") {
      await LocalNotifications.createChannel({
        id: "subscriptions",
        name: "Subscription Reminders",
        importance: 4, // high
        sound: "default",
        vibration: true,
        lights: true,
      });

      await LocalNotifications.createChannel({
        id: "price-alerts",
        name: "Price Alerts",
        importance: 3, // default
        sound: "default",
        vibration: true,
      });

      await LocalNotifications.createChannel({
        id: "digest",
        name: "Weekly Digest",
        importance: 2, // low
        sound: "default",
      });
    }
  }

  /** Web-side setup (Notification permission + optional Push) */
  private async initializeWeb(): Promise<void> {
    if (!("Notification" in window)) {
      throw new Error("Web notifications not supported");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Web notification permission denied");
    }

    // Only try Push when we have a VAPID key and a SW
    if ("serviceWorker" in navigator && this.vapidPublicKey) {
      await this.initializeWebPush();
    }
  }

  /** Subscribe to Push and save subscription server-side */
  private async initializeWebPush(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // TS DOM lib can be picky; Uint8Array is fine, cast to BufferSource to satisfy types
        applicationServerKey: this.urlB64ToUint8Array(this.vapidPublicKey!) as unknown as BufferSource,
      });

      this.webPushSubscription = subscription;

      // Persist subscription on the server
      await fetch("/api/push/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      console.error("Failed to initialize web push:", error);
    }
  }

  /** Public helper to send 'now' */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    return this.scheduleNotification(payload, new Date());
  }

  /** Schedule a notification at a specific time */
  async scheduleNotification(payload: NotificationPayload, scheduledTime: Date): Promise<boolean> {
    try {
      if (this.isNative) {
        return await this.scheduleNativeNotification(payload, scheduledTime);
      }
      return await this.scheduleWebNotification(payload, scheduledTime);
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      return false;
    }
  }

  /** Native scheduling (Capacitor) */
  private async scheduleNativeNotification(payload: NotificationPayload, scheduledTime: Date): Promise<boolean> {
    const options: ScheduleOptions = {
      notifications: [
        {
          id: payload.id, // Capacitor expects number
          title: payload.title,
          body: payload.body,
          schedule: { at: scheduledTime },
          extra: payload.data,
          channelId: this.getChannelId(payload.tag),
        },
      ],
    };

    await LocalNotifications.schedule(options);
    return true;
  }

  /** Web scheduling with simple delayed timers; >24h goes to server */
  private async scheduleWebNotification(payload: NotificationPayload, scheduledTime: Date): Promise<boolean> {
    const delay = scheduledTime.getTime() - Date.now();

    if (delay <= 0) {
      return this.sendImmediateWebNotification(payload);
    }

    // Use setTimeout for up to 24h delays
    if (delay < 24 * 60 * 60 * 1000) {
      const timerId = window.setTimeout(() => {
        void this.sendImmediateWebNotification(payload);
        this.timers.delete(payload.id);
      }, delay);
      this.timers.set(payload.id, timerId);
      return true;
    }

    // Longer than 24h → defer to server scheduling
    return this.saveReminder(payload, scheduledTime);
  }

  /** Immediate, in-tab web notification (relies on Notification API) */
  private sendImmediateWebNotification(payload: NotificationPayload): boolean {
    try {
      const n = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || "/icons/icon-192.png",
        badge: payload.badge || "/icons/badge-72.png",
        tag: payload.tag,
        data: payload.data,
      });

      n.onclick = () => {
        window.focus();
        const url = (payload.data?.url as string | undefined) ?? "/dashboard";
        window.location.href = url;
        n.close();
      };

      return true;
    } catch (error) {
      console.error("Failed to send web notification:", error);
      return false;
    }
  }

  /** Cancel a single scheduled notification by its id */
  async cancelNotification(id: number): Promise<void> {
    if (this.isNative) {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } else {
      const timer = this.timers.get(id);
      if (typeof timer === "number") {
        window.clearTimeout(timer);
      }
      this.timers.delete(id);
    }
  }

  /** Cancel all scheduled notifications */
  async cancelAllNotifications(): Promise<void> {
    if (this.isNative) {
      const pending = await LocalNotifications.getPending();

      // Build typed descriptors with hard guards — no number|undefined unions
      const descriptors: Array<{ id: number }> = [];
      for (const n of pending.notifications) {
        const raw = n.id as unknown;
        let idNum: number | null = null;

        if (typeof raw === "number") {
          idNum = raw;
        } else if (typeof raw === "string") {
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) idNum = parsed;
        }

        if (idNum !== null) {
          descriptors.push({ id: idNum });
        }
      }

      if (descriptors.length > 0) {
        await LocalNotifications.cancel({ notifications: descriptors });
      }
    } else {
      this.timers.forEach((t) => window.clearTimeout(t));
      this.timers.clear();
    }
  }

  /** Quick sanity test */
  async testNotification(): Promise<boolean> {
    const testPayload: NotificationPayload = {
      id: Date.now(),
      title: "Test Notification",
      body: "This is a test notification from Needix",
      icon: "/icons/icon-192.png",
      tag: "test",
    };
    return this.sendNotification(testPayload);
  }

  /** Current platform + permission status */
  async getPermissionStatus(): Promise<{
    supported: boolean;
    granted: boolean;
    platform: "web" | "native";
  }> {
    if (this.isNative) {
      const permission = await LocalNotifications.checkPermissions();
      return { supported: true, granted: permission.display === "granted", platform: "native" };
    }
    return {
      supported: "Notification" in window,
      granted: Notification.permission === "granted",
      platform: "web",
    };
  }

  /** Bulk schedule reminders based on subscriptions + settings */
  async setupSubscriptionReminders(
    subscriptions: Array<{ id: string; name: string; nextBillingDate?: string; nextBillingAt?: string }>,
    settings: ReminderSettings
  ): Promise<void> {
    if (!settings.enabled) return;

    await this.cancelAllNotifications();

    const now = new Date();
    let notificationId = 1;

    for (const sub of subscriptions) {
      const billingDateStr = sub.nextBillingDate || sub.nextBillingAt;
      if (!billingDateStr) continue;

      const billingDate = new Date(billingDateStr);

      for (const leadDays of settings.leadDays) {
        const reminderDate = new Date(billingDate);
        reminderDate.setDate(reminderDate.getDate() - leadDays);

        // Robust parsing: always produce numbers, never undefined
        const [hStr, mStr] = settings.timeOfDay.split(":");
        const hours: number = Number.isFinite(Number(hStr)) ? Number(hStr) : 9;
        const minutes: number = Number.isFinite(Number(mStr)) ? Number(mStr) : 0;

        reminderDate.setHours(hours, minutes, 0, 0);

        if (reminderDate > now) {
          const payload: NotificationPayload = {
            id: notificationId++,
            title: leadDays === 0 ? "Subscription Renews Today!" : "Subscription Renewal Reminder",
            body:
              leadDays === 0
                ? `${sub.name} renews today`
                : `${sub.name} renews in ${leadDays} day${leadDays === 1 ? "" : "s"}`,
            icon: "/icons/subscription.png",
            tag: "subscription-renewal",
            data: { subscriptionId: sub.id, type: "renewal-reminder", url: "/dashboard" },
          };

          await this.scheduleNotification(payload, reminderDate);
        }
      }
    }
  }

  /** Utils */

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private getChannelId(tag?: string): string {
    switch (tag) {
      case "price-alert":
        return "price-alerts";
      case "digest":
        return "digest";
      default:
        return "subscriptions";
    }
  }

  private async saveReminder(payload: NotificationPayload, scheduledTime: Date): Promise<boolean> {
    try {
      await fetch("/api/reminders/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          scheduledTime: scheduledTime.toISOString(),
        }),
      });
      return true;
    } catch (error) {
      console.error("Failed to save reminder:", error);
      return false;
    }
  }
}

export default NotificationService;
