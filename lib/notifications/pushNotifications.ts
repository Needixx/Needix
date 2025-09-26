// lib/notifications/pushNotifications.ts
import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { debug } from '@/lib/debug';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:needix2025@gmail.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, unknown>;
}

/** Reusable include + precise payload type for the query */
const SUBSCRIPTION_INCLUDE = {
  user: {
    include: {
      notificationSettings: true,
      pushSubscription: true,
    },
  },
} as const;

type SubscriptionWithUser = Prisma.SubscriptionGetPayload<{
  include: typeof SUBSCRIPTION_INCLUDE;
}>;

export class PushNotificationService {
  /** Send a push to a single user (if they have a saved subscription) */
  static async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn("VAPID keys not configured, skipping push notification");
        return false;
      }

      const subscription = await prisma.pushSubscription.findUnique({
        where: { userId },
      });

      if (!subscription) {
        debug.log(`No push subscription found for user ${userId}`);
        return false;
      }

      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? "/icons/icon-192.png",
        badge: payload.badge ?? "/icons/badge-72.png",
        tag: payload.tag ?? "default",
        data: {
          url: payload.url ?? "/dashboard",
          ...payload.data,
        },
        actions: [
          { action: "view", title: "View" },
          { action: "dismiss", title: "Dismiss" },
        ],
        requireInteraction: true,
      };

      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(notificationPayload),
        { TTL: 24 * 60 * 60 } // 24 hours
      );

      debug.log(`Push notification sent to user ${userId}: ${payload.title}`);
      return true;
    } catch (error) {
      console.error("Failed to send push notification:", error);

      // If the subscription looks invalid, remove it
      if (error instanceof Error && (error.message.includes("410") || error.message.includes("invalid"))) {
        try {
          await prisma.pushSubscription.deleteMany({ where: { userId } });
          debug.log(`Removed invalid push subscription for user ${userId}`);
        } catch (deleteError) {
          console.error("Failed to remove invalid subscription:", deleteError);
        }
      }

      return false;
    }
  }

  /** Send to many users */
  static async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    let successCount = 0;

    await Promise.allSettled(
      userIds.map(async (id) => {
        const ok = await this.sendToUser(id, payload);
        if (ok) successCount++;
      })
    );

    return successCount;
  }

  /** Find subs renewing at 1, 3, or 7 days out and notify owners */
  static async sendSubscriptionReminders(): Promise<void> {
    try {
      const now = new Date();

      const datesToCheck: string[] = [1, 3, 7].map((d: number) => {
        const t = new Date(now);
        t.setDate(t.getDate() + d);
        return t.toISOString().slice(0, 10); // YYYY-MM-DD
      });

      // Typed result with include so `.user` exists
      const subscriptions: SubscriptionWithUser[] = await prisma.subscription.findMany({
        where: { nextBillingDate: { in: datesToCheck } },
        include: SUBSCRIPTION_INCLUDE,
      });

      for (const subscription of subscriptions) {
        const settings = subscription.user?.notificationSettings ?? null;
        const pushSub = subscription.user?.pushSubscription ?? null;

        // Must have settings enabled and a stored push subscription
        if (!settings?.enabled || !pushSub) continue;

        // Guard: may be null in DB
        if (!subscription.nextBillingDate) continue;

        const billingDate = new Date(subscription.nextBillingDate);
        const daysUntil = Math.ceil(
          (billingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Parse the leadDays (CSV) safely
        const leadDaysCSV: string = settings.leadDays ?? "7,3,1";
        const leadDays = leadDaysCSV
          .split(",")
          .map((s: string) => Number.parseInt(s.trim(), 10))
          .filter((n: number) => Number.isFinite(n) && n >= 0);

        if (!leadDays.includes(daysUntil)) continue;

        const name = subscription.name ?? "Subscription";

        const payload: PushNotificationPayload = {
          title: `💰 ${name} Renewal`,
          body:
            daysUntil === 0
              ? `Your ${name} subscription renews today!`
              : `Your ${name} subscription renews in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`,
          icon: "/icons/icon-192.png",
          tag: "subscription-reminder",
          url: "/dashboard",
          data: {
            subscriptionId: String(subscription.id ?? ""),
            daysUntil: String(daysUntil),
          },
        };

        await this.sendToUser(String(subscription.userId), payload);
      }
    } catch (error) {
      console.error("Failed to send subscription reminders:", error);
    }
  }

  /** Price change alert helper */
  static async sendPriceChangeAlert(
    userId: string,
    subscriptionName: string,
    oldPrice: number,
    newPrice: number
  ): Promise<boolean> {
    const delta = newPrice - oldPrice;
    const changeText =
      delta >= 0 ? `increased by $${delta.toFixed(2)}` : `decreased by $${Math.abs(delta).toFixed(2)}`;

    const payload: PushNotificationPayload = {
      title: "💸 Price Change Alert",
      body: `${subscriptionName} price has ${changeText}. New price: $${newPrice.toFixed(2)}`,
      icon: "/icons/icon-192.png",
      tag: "price-alert",
      url: "/dashboard",
      data: {
        subscriptionName,
        oldPrice: String(oldPrice),
        newPrice: String(newPrice),
        priceChange: String(delta),
      },
    };

    return this.sendToUser(userId, payload);
  }

  /** Remove old/expired push subscriptions (e.g., via cron) */
  static async cleanupExpiredSubscriptions(): Promise<void> {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);

      await prisma.pushSubscription.deleteMany({
        where: { updatedAt: { lt: cutoff } },
      });

      debug.log("Cleaned up expired push subscriptions");
    } catch (error) {
      console.error("Failed to cleanup expired subscriptions:", error);
    }
  }
}
