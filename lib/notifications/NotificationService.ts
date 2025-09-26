// lib/notifications/NotificationService.ts
"use client";

import { Capacitor } from "@capacitor/core";
import { LocalNotifications, type ScheduleOptions } from "@capacitor/local-notifications";
import { debug } from '@/lib/debug';

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
  private webPushSubscription: PushSubscription | null = null;
  private vapidPublicKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  // Track setTimeout handles for web-delayed notifications (browser timers are numbers)
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

    // Register service worker for push notifications
    if ("serviceWorker" in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        debug.log("Service worker registered for notifications");

        // Set up push subscription if VAPID key is available
        if (this.vapidPublicKey) {
          await this.initializeWebPush();
        }
      } catch (error) {
        console.error("Failed to register service worker:", error);
        // Continue without push support
      }
    }
  }

  /** Subscribe to Push and save subscription server-side */
  private async initializeWebPush(): Promise<void> {
    try {
      if (!this.registration || !this.vapidPublicKey) {
        throw new Error("Service worker or VAPID key not available");
      }

      // Convert Base64 VAPID to Uint8Array, then cast to BufferSource for older DOM typings
      const appServerKey = this.urlB64ToUint8Array(this.vapidPublicKey) as unknown as BufferSource;

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });

      this.webPushSubscription = subscription;

      // Send subscription to server (aligns with your existing route name)
      try {
        await fetch("/api/push/save-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription), // .toJSON() not necessary
        });
        debug.log("Push subscription saved to server");
      } catch (error) {
        console.error("Failed to save push subscription:", error);
      }
    } catch (error) {
      console.error("Failed to setup push notifications:", error);
      throw error;
    }
  }

  /** Convert VAPID key */
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

  /** Send immediate notification */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      if (this.isNative) {
        return await this.sendNativeNotification(payload);
      } else {
        return this.sendWebNotification(payload);
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  /** Capacitor local notification */
  private async sendNativeNotification(payload: NotificationPayload): Promise<boolean> {
    try {
      const options: ScheduleOptions = {
        notifications: [
          {
            id: payload.id,
            title: payload.title,
            body: payload.body,
            largeIcon: payload.icon,
            smallIcon: payload.badge,
            extra: payload.data,
            channelId: this.getChannelId(payload.tag),
          },
        ],
      };

      await LocalNotifications.schedule(options);
      return true;
    } catch (error) {
      console.error("Native notification failed:", error);
      return false;
    }
  }

  /** Web notification */
  private sendWebNotification(payload: NotificationPayload): boolean {
    try {
      if (Notification.permission !== "granted") {
        console.error("Notification permission not granted");
        return false;
      }

      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || "/icons/icon-192.png",
        badge: payload.badge || "/icons/badge-72.png",
        tag: payload.tag || "default",
        data: payload.data,
        requireInteraction: true,
      };

      const notification = new Notification(payload.title, options);

      // Handle click events
      notification.onclick = () => {
        const url = (payload.data?.url as string | undefined) ?? "/dashboard";
        window.focus();
        window.location.href = url;
        notification.close();
      };

      // Auto-close after 10 seconds
      const timerId = window.setTimeout(() => {
        notification.close();
      }, 10000);
      // track & auto-clean
      this.timers.set(payload.id, timerId);

      return true;
    } catch (error) {
      console.error("Web notification failed:", error);
      return false;
    }
  }

  /** Get appropriate channel ID for native notifications */
  private getChannelId(tag?: string): string {
    switch (tag) {
      case "subscription":
      case "billing":
        return "subscriptions";
      case "price-alert":
        return "price-alerts";
      case "digest":
        return "digest";
      default:
        return "subscriptions";
    }
  }

  /** Schedule future notification */
  async scheduleNotification(payload: NotificationPayload, scheduledTime: Date): Promise<boolean> {
    try {
      if (this.isNative) {
        return await this.scheduleNativeNotification(payload, scheduledTime);
      } else {
        return this.scheduleWebNotification(payload, scheduledTime);
      }
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      return false;
    }
  }

  /** Schedule native notification */
  private async scheduleNativeNotification(payload: NotificationPayload, scheduledTime: Date): Promise<boolean> {
    try {
      const options: ScheduleOptions = {
        notifications: [
          {
            id: payload.id,
            title: payload.title,
            body: payload.body,
            largeIcon: payload.icon,
            smallIcon: payload.badge,
            extra: payload.data,
            channelId: this.getChannelId(payload.tag),
            schedule: { at: scheduledTime },
          },
        ],
      };

      await LocalNotifications.schedule(options);
      return true;
    } catch (error) {
      console.error("Failed to schedule native notification:", error);
      return false;
    }
  }

  /** Schedule web notification using setTimeout */
  private scheduleWebNotification(payload: NotificationPayload, scheduledTime: Date): boolean {
    try {
      const delay = scheduledTime.getTime() - Date.now();

      if (delay <= 0) {
        // Send immediately if time has passed
        return this.sendWebNotification(payload);
      }

      const timerId = window.setTimeout(() => {
        this.sendWebNotification(payload);
        this.timers.delete(payload.id);
      }, delay);

      this.timers.set(payload.id, timerId);
      return true;
    } catch (error) {
      console.error("Failed to schedule web notification:", error);
      return false;
    }
  }

  /** Cancel scheduled notification */
  async cancelNotification(id: number): Promise<void> {
    try {
      if (this.isNative) {
        await LocalNotifications.cancel({ notifications: [{ id }] });
      } else {
        const timer = this.timers.get(id);
        if (typeof timer === "number") {
          window.clearTimeout(timer);
          this.timers.delete(id);
        }
      }
    } catch (error) {
      console.error("Failed to cancel notification:", error);
    }
  }

  /** Cancel all scheduled notifications */
  async cancelAllNotifications(): Promise<void> {
    try {
      if (this.isNative) {
        const pending = await LocalNotifications.getPending();
        const notifications = pending.notifications
          .map((n) => ({ id: Number(n.id) }))
          .filter((n) => !Number.isNaN(n.id));

        if (notifications.length > 0) {
          await LocalNotifications.cancel({ notifications });
        }
      } else {
        this.timers.forEach((timer) => window.clearTimeout(timer));
        this.timers.clear();
      }
    } catch (error) {
      console.error("Failed to cancel all notifications:", error);
    }
  }

  /** Parse "HH:MM" safely and clamp to 09:00 defaults */
  private parseTimeOfDay(time: string): { hour: number; minute: number } {
    const m = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
    let hour = 9;
    let minute = 0;
    if (m) {
      const h = Number(m[1]);
      const mm = Number(m[2]);
      if (Number.isFinite(h) && h >= 0 && h <= 23) hour = h;
      if (Number.isFinite(mm) && mm >= 0 && mm <= 59) minute = mm;
    }
    return { hour, minute };
  }

  /** Test notification functionality */
  async testNotification(): Promise<boolean> {
    const testPayload: NotificationPayload = {
      id: Date.now(),
      title: "🔔 Test Notification",
      body:
        "Your notifications are working! You'll receive reminders for your subscriptions.",
      icon: "/icons/icon-192.png",
      tag: "test",
      data: { url: "/dashboard" },
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
      return {
        supported: true,
        granted: permission.display === "granted",
        platform: "native",
      };
    }

    return {
      supported: "Notification" in window,
      granted: Notification.permission === "granted",
      platform: "web",
    };
  }

  /** Bulk schedule reminders based on subscriptions + settings */
  async setupSubscriptionReminders(
    subscriptions: Array<{
      id: string;
      name: string;
      nextBillingDate?: string;
      nextBillingAt?: string;
    }>,
    settings: ReminderSettings
  ): Promise<void> {
    if (!settings.enabled) {
      await this.cancelAllNotifications();
      return;
    }

    // Clear existing reminders
    await this.cancelAllNotifications();

    const now = new Date();
    const { hour, minute } = this.parseTimeOfDay(settings.timeOfDay);

    for (const sub of subscriptions) {
      const billingDate = sub.nextBillingDate || sub.nextBillingAt;
      if (!billingDate) continue;

      const billing = new Date(billingDate);
      if (billing <= now) continue;

      for (const leadDays of settings.leadDays) {
        const reminderDate = new Date(billing);
        reminderDate.setDate(reminderDate.getDate() - leadDays);
        // hour/minute are always numbers now
        reminderDate.setHours(hour, minute, 0, 0);

        if (reminderDate <= now) continue;

        const payload: NotificationPayload = {
          id: this.hashString(`${sub.id}-${leadDays}-${billingDate}`),
          title: `💰 ${sub.name} Renewal`,
          body:
            leadDays === 0
              ? `Your ${sub.name} subscription renews today!`
              : `Your ${sub.name} subscription renews in ${leadDays} day${leadDays > 1 ? "s" : ""}`,
          icon: "/icons/icon-192.png",
          tag: "subscription",
          data: {
            subscriptionId: sub.id,
            leadDays,
            url: "/dashboard",
          },
        };

        await this.scheduleNotification(payload, reminderDate);
      }
    }
  }

  /** Generate consistent hash for notification IDs */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit int
    }
    return Math.abs(hash);
  }
}

export default NotificationService;
