import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Recurrence, SubscriptionStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toRecurrence(val: unknown): Recurrence | undefined {
  const allowed: Recurrence[] = ["none", "daily", "weekly", "monthly", "yearly", "custom"];
  return allowed.includes(val as Recurrence) ? (val as Recurrence) : undefined;
}

function toSubStatus(val: unknown): SubscriptionStatus | undefined {
  const allowed: SubscriptionStatus[] = ["active", "paused", "canceled"];
  return allowed.includes(val as SubscriptionStatus) ? (val as SubscriptionStatus) : undefined;
}

export async function GET(_req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw: unknown = await req.json();
    const {
      name,
      amount,
      currency = "USD",
      interval = "monthly",
      nextBillingAt,
      category,
      notes,
      vendorUrl,
      status = "active",
    } = raw as {
      name: string;
      amount: number;
      currency?: string;
      interval?: unknown;
      nextBillingAt?: string | null;
      category?: string | null;
      notes?: string | null;
      vendorUrl?: string | null;
      status?: unknown;
    };

    // Ensure user exists (id/email/name from session)
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
    });

    const rec: Recurrence = toRecurrence(interval) ?? "monthly";
    const st: SubscriptionStatus = toSubStatus(status) ?? "active";

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        name,
        amount,
        currency,
        interval: rec,
        nextBillingAt: nextBillingAt ? new Date(nextBillingAt) : null,
        category: category ?? null,
        notes: notes ?? null,
        vendorUrl: vendorUrl ?? null,
        status: st,
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
