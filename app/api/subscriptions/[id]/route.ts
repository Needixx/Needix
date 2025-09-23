// app/api/subscriptions/[id]/route.ts - TYPE SAFE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Recurrence } from '@prisma/client';

interface UpdateSubscriptionBody {
  name?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  nextBillingAt?: string | null;
  category?: string | null;
  notes?: string | null;
  vendorUrl?: string | null;
  isEssential?: boolean;
  status?: 'active' | 'paused' | 'canceled';
}

function getId(req: NextRequest): string | null {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split('/');
  const id = segments[segments.length - 1];
  return id && id !== 'route.ts' ? id : null;
}

function asStatus(value: unknown): 'active' | 'paused' | 'canceled' | null {
  if (value === 'active' || value === 'paused' || value === 'canceled') {
    return value;
  }
  return null;
}

export const PATCH = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getId(req);
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

    // Ensure it belongs to the user
    const existing = await prisma.subscription.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = (await req.json()) as UpdateSubscriptionBody;
    const data: Prisma.SubscriptionUpdateInput = {};

    if (payload.name !== undefined) data.name = String(payload.name);
    if (payload.amount !== undefined) data.amount = Number(payload.amount);
    if (payload.currency !== undefined) data.currency = String(payload.currency);
    if (payload.interval !== undefined) data.interval = payload.interval as Prisma.EnumRecurrenceFieldUpdateOperationsInput | Recurrence;
    if (payload.isEssential !== undefined) data.isEssential = Boolean(payload.isEssential);

    if (payload.nextBillingAt !== undefined) {
      data.nextBillingAt = payload.nextBillingAt ? new Date(payload.nextBillingAt) : null;
    }

    if (payload.category !== undefined) data.category = payload.category ?? null;
    if (payload.notes !== undefined) data.notes = payload.notes ?? null;
    if (payload.vendorUrl !== undefined) data.vendorUrl = payload.vendorUrl ?? null;

    const st = asStatus(payload.status);
    if (st) data.status = st;

    const subscription = await prisma.subscription.update({
      where: { id },
      data,
    });

    return NextResponse.json(subscription);
  } catch (err) {
    console.error('Error updating subscription:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getId(req);
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

    // Ensure it belongs to the user
    const existing = await prisma.subscription.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.subscription.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting subscription:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};