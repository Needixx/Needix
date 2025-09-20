import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

function ensureWebPushConfigured() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@needix.app';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, title, body: message } = body || {};
    if (!subscription) return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });

    ensureWebPushConfigured();
    await webpush.sendNotification(subscription, JSON.stringify({ title: title || 'Needix', body: message || 'Update' }));
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('push send error', msg);
    return NextResponse.json({ error: 'Push send failed', details: msg }, { status: 500 });
  }
}
