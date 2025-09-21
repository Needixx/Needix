// app/api/push/save-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { makeSubId, saveSubscription } from '@/lib/serverStore';
import { z } from 'zod';

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z
    .object({
      p256dh: z.string(),
      auth: z.string(),
    })
    .partial()
    .optional(),
}).passthrough();

const BodySchema = z.object({
  subscription: PushSubscriptionSchema,
  userEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing subscription' },
        { status: 400 }
      );
    }

    const { subscription, userEmail } = parsed.data;

    const id = makeSubId(subscription.endpoint);
    await saveSubscription({
      id,
      endpoint: subscription.endpoint,
      data: subscription,
      userEmail,
    });

    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: 'Failed to save subscription',
        details: String((e as Error)?.message ?? e),
      },
      { status: 500 }
    );
  }
}
