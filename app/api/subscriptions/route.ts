// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// schema accepts number or string for price; coerces to number
const CreateSchema = z.object({
  name: z.string().min(1),
  price: z.union([z.number(), z.string()]).transform((v) =>
    typeof v === 'string' ? parseFloat(v) : v
  ),
  period: z.string().min(1),
  nextBillingDate: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Demo data (unchanged)
    const subscriptions = [
      {
        id: '1',
        name: 'Netflix',
        price: 15.49,
        period: 'monthly',
        nextBillingDate: '2025-10-09',
        category: 'Streaming',
        notes: 'Standard plan',
      },
      {
        id: '2',
        name: 'Spotify Premium',
        price: 10.99,
        period: 'monthly',
        nextBillingDate: '2025-10-15',
        category: 'Music',
        notes: '',
      },
    ];

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const raw = (await req.json()) as unknown;
    const parsed = CreateSchema.safeParse(raw);

    if (!parsed.success) {
      // preserve your original message
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { name, price, period, nextBillingDate, category, notes } =
      parsed.data;

    const newSubscription = {
      id: Date.now().toString(),
      name,
      price,
      period,
      nextBillingDate,
      category: category ?? '',
      notes: notes ?? '',
      userId: session.user.email,
    };

    return NextResponse.json({ subscription: newSubscription }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
