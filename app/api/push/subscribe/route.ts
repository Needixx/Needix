// app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

// Type guard function to validate push subscription
function isValidPushSubscription(obj: unknown): obj is PushSubscriptionData {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }
  
  const subscription = obj as Record<string, unknown>;
  
  return (
    typeof subscription.endpoint === 'string' &&
    typeof subscription.keys === 'object' &&
    subscription.keys !== null &&
    typeof (subscription.keys as Record<string, unknown>).p256dh === 'string' &&
    typeof (subscription.keys as Record<string, unknown>).auth === 'string'
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestData: unknown = await request.json();

    // Validate subscription object with type guard
    if (!isValidPushSubscription(requestData)) {
      return NextResponse.json(
        { error: "Invalid subscription object" },
        { status: 400 }
      );
    }

    // Now we know requestData is properly typed
    const subscription: PushSubscriptionData = requestData;

    // Save or update push subscription in database
    await prisma.pushSubscription.upsert({
      where: { userId: session.user.id },
      update: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    console.log(`Push subscription saved for user ${session.user.id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove push subscription from database
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id },
    });

    console.log(`Push subscription removed for user ${session.user.id}`);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove push subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}