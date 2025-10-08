// app/api/subscriptions/[id]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Keep in sync with your schema
type Interval = "monthly" | "yearly" | "weekly" | "custom";

type PatchBody = {
  name?: unknown;
  amount?: unknown;
  currency?: unknown;
  interval?: unknown;          // Interval
  nextBillingAt?: unknown;     // ISO string
  nextBillingDate?: unknown;   // "YYYY-MM-DD"
  category?: unknown;
  notes?: unknown;
  vendorUrl?: unknown;
  isEssential?: unknown;
};

// ---------- small validators ----------
const toNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

const toStringOrNull = (v: unknown): string | null => (typeof v === "string" ? v : null);

const toInterval = (v: unknown): Interval | null => {
  if (typeof v !== "string") return null;
  const x = v as Interval;
  return ["monthly", "yearly", "weekly", "custom"].includes(x) ? x : null;
};

const toBool = (v: unknown): boolean => v === true || v === "true" || v === 1 || v === "1";

const toDateOrNull = (v: unknown): Date | null => {
  if (typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
// -------------------------------------

export async function GET(req: Request, ctx: unknown) {
  try {
    const { params } = ctx as { params: { id: string } };

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sub = await prisma.subscription.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!sub) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(sub);
  } catch (err) {
    console.error("GET /api/subscriptions/[id] failed:", err);
    return NextResponse.json({ error: "Failed to load subscription" }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: unknown) {
  try {
    const { params } = ctx as { params: { id: string } };

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = (await req.json()) as PatchBody;

    // Build a strictly-typed update object. No undefined leaks into Prisma.
    const data: {
      name?: string;
      amount?: number;
      currency?: string;
      interval?: Interval;
      nextBillingAt?: Date | null;
      nextBillingDate?: string | null;
      category?: string | null;
      notes?: string | null;
      vendorUrl?: string | null;
      isEssential?: boolean;
      updatedAt?: Date;
    } = { updatedAt: new Date() };

    const name = toStringOrNull(raw.name);
    if (name !== null) data.name = name;

    const amount = toNumber(raw.amount);
    if (amount !== null) data.amount = amount;

    const currency = toStringOrNull(raw.currency);
    if (currency !== null) data.currency = currency;

    const interval = toInterval(raw.interval);
    if (interval !== null) data.interval = interval;

    const nba = toDateOrNull(raw.nextBillingAt);
    if (nba !== null) data.nextBillingAt = nba;

    const nbd = toStringOrNull(raw.nextBillingDate);
    if (nbd !== null) data.nextBillingDate = nbd;

    const category = toStringOrNull(raw.category);
    if (category !== null) data.category = category;

    const notes = toStringOrNull(raw.notes);
    if (notes !== null) data.notes = notes;

    const vendorUrl = toStringOrNull(raw.vendorUrl);
    if (vendorUrl !== null) data.vendorUrl = vendorUrl;

    if (typeof raw.isEssential !== "undefined") {
      data.isEssential = toBool(raw.isEssential);
    }

    const updated = await prisma.subscription.update({
      where: { id: params.id, userId: session.user.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/subscriptions/[id] failed:", err);
    const message = err instanceof Error ? err.message : "Failed to update subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: unknown) {
  try {
    const { params } = ctx as { params: { id: string } };

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the subscription belongs to the user
    const existing = await prisma.subscription.findFirst({
      where: { id: params.id, userId: session.user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.subscription.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/subscriptions/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}
