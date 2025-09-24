// app/api/push/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import webpush from "web-push";
import type { PushSubscription as WebPushSubscription } from "web-push"; // ✅ type-only import

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@needix.app";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!publicKey || !privateKey)
      return NextResponse.json({ error: "Push notifications not configured" }, { status: 500 });

    const { title, body, icon, tag, data, url } = (await request.json()) as {
      title: string;
      body: string;
      icon?: string;
      tag?: string;
      data?: Record<string, unknown>;
      url?: string;
    };

    if (!title || !body) return NextResponse.json({ error: "Title and body are required" }, { status: 400 });

    const pushSubscription = await prisma.pushSubscription.findUnique({
      where: { userId: session.user.id },
    });
    if (!pushSubscription) {
      return NextResponse.json({ error: "No push subscription found for user" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: tag || "needix-notification",
      data: { ...(data ?? {}), url: url || "/dashboard", timestamp: Date.now() },
    });

    // ✅ Properly typed, no `any`
    const subscription: WebPushSubscription = {
      endpoint: pushSubscription.endpoint,
      keys: { p256dh: pushSubscription.p256dh, auth: pushSubscription.auth },
    };

    await webpush.sendNotification(subscription, payload);

    void prisma.notificationLog
      .create({ data: { userId: session.user.id, type: "push", title, body, sentAt: new Date() } })
      .catch(() => {});

    return NextResponse.json({ success: true, message: "Push notification sent" });
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return NextResponse.json({ error: "Failed to send push notification" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const test = {
    title: "Test Notification",
    body: "This is a test push notification from Needix!",
    icon: "/icons/icon-192.png",
    tag: "test",
    data: { type: "test", timestamp: Date.now() },
    url: "/dashboard",
  };

  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify(test),
      headers: request.headers,
    })
  );
}
