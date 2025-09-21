// app/api/push/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { z } from 'zod';

function ensureWebPushConfigured(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@needix.app';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

const PushSubscriptionSchema = z
  .object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
    expirationTime: z.number().nullable().optional(),
  })
  .passthrough();

const BodySchema = z.object({
  subscription: PushSubscriptionSchema,
  title: z.string().optional(),
  body: z.string().optional(),
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

    const { subscription, title, body } = parsed.data;

    ensureWebPushConfigured();

    await webpush.sendNotification(
      subscription as unknown as webpush.PushSubscription,
      JSON.stringify({
        title: title ?? 'Needix',
        body: body ?? 'Update',
      })
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('push send error', msg);
    return NextResponse.json(
      { error: 'Push send failed', details: msg },
      { status: 500 }
    );
  }
}
