// app/api/subscriptions/route.ts - TYPE SAFE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Recurrence } from '@prisma/client';

interface CreateSubscriptionBody {
  name: string;
  amount: number;
  currency?: string;
  interval: string;
  nextBillingAt?: string | null;
  category?: string | null;
  notes?: string | null;
  vendorUrl?: string | null;
  isEssential?: boolean;
}

export const GET = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(subscriptions);
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as CreateSubscriptionBody;
    const {
      name,
      amount,
      currency = 'USD',
      interval,
      nextBillingAt,
      category,
      notes,
      vendorUrl,
      isEssential = false,
    } = body;

    if (!name || amount === undefined) {
      return NextResponse.json(
        { error: 'Name and amount are required' },
        { status: 400 }
      );
    }

    // Validate interval
    const validIntervals: Recurrence[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
    const mappedInterval: Recurrence = validIntervals.includes(interval as Recurrence) 
      ? (interval as Recurrence) 
      : 'monthly';

    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        name: String(name),
        amount: Number(amount),
        currency: String(currency),
        interval: mappedInterval,
        nextBillingAt: nextBillingAt ? new Date(nextBillingAt) : null,
        category: category ? String(category) : null,
        notes: notes ? String(notes) : null,
        vendorUrl: vendorUrl ? String(vendorUrl) : null,
        isEssential: Boolean(isEssential),
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (err) {
    console.error('Error creating subscription:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};