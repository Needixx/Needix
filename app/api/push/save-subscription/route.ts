// app/api/push/save-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

function isPushSubscriptionPayload(obj: unknown): obj is PushSubscriptionPayload {
  if (typeof obj !== "object" || obj === null) return false;
  const rec = obj as Record<string, unknown>;
  const keys = rec.keys as Record<string, unknown> | undefined;
  return (
    typeof rec.endpoint === "string" &&
    !!keys &&
    typeof keys.p256dh === "string" &&
    typeof keys.auth === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body: unknown = await request.json();
    if (!isPushSubscriptionPayload(body)) {
      return NextResponse.json({ error: "Invalid subscription format" }, { status: 400 });
    }

    await prisma.pushSubscription.upsert({
      where: { userId: session.user.id },
      update: {
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete push subscription:", error);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) return NextResponse.json({ subscription: null });

    return NextResponse.json({
      subscription: {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
    });
  } catch (error) {
    console.error("Failed to get push subscription:", error);
    return NextResponse.json({ error: "Failed to get subscription" }, { status: 500 });
  }
}
