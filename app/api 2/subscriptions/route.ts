// app/api/subscriptions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Interval = "monthly" | "yearly" | "weekly" | "custom";

type CreateBody = {
  name?: unknown;
  amount?: unknown;
  currency?: unknown;
  interval?: unknown;
  nextBillingAt?: unknown;     // ISO string
  nextBillingDate?: unknown;   // "YYYY-MM-DD"
  category?: unknown;
  notes?: unknown;
  vendorUrl?: unknown;
  isEssential?: unknown;
};

// ------- helpers -------
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
// -----------------------

// GET: list current user's subscriptions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subs = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subs);
  } catch (err) {
    console.error("GET /api/subscriptions failed:", err);
    return NextResponse.json({ error: "Failed to load subscriptions" }, { status: 500 });
  }
}

// POST: create subscription
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure the user row actually exists (prevents P2003)
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json(
        {
          error:
            "No user record found for this session. Make sure auth and Prisma use the same database, then sign out/in to create your user record.",
          detail: { sessionUserId: session.user.id },
        },
        { status: 409 }
      );
    }

    const raw = (await req.json()) as CreateBody;

    const name = toStringOrNull(raw.name);
    const amount = toNumber(raw.amount);
    const currency = toStringOrNull(raw.currency);
    const interval = toInterval(raw.interval) ?? "monthly";

    // Normalize dates (DB columns should be string|null or Date|null)
    const nextBillingAt = toDateOrNull(raw.nextBillingAt); // Date | null
    const nextBillingDate = toStringOrNull(raw.nextBillingDate); // string | null

    const category = toStringOrNull(raw.category);
    const notes = toStringOrNull(raw.notes);
    const vendorUrl = toStringOrNull(raw.vendorUrl);
    const isEssential = toBool(raw.isEssential);

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (amount === null) return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    if (!currency) return NextResponse.json({ error: "Currency is required" }, { status: 400 });

    const created = await prisma.subscription.create({
      data: {
        name,
        amount,
        currency,
        interval,
        nextBillingAt,            // Date | null (never undefined)
        nextBillingDate,          // string | null (never undefined)
        category,
        notes,
        vendorUrl,
        isEssential,
        user: { connect: { id: user.id } }, // relation-safe link
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/subscriptions failed:", err);
    // Surface Prisma message to client for easier debugging
    const message = err instanceof Error ? err.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
