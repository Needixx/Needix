import { NextRequest, NextResponse } from 'next/server';
import { makeSubId, saveSubscription } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userEmail } = body || {};
    if (!subscription?.endpoint) return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });
    const id = makeSubId(subscription.endpoint);
    await saveSubscription({ id, endpoint: subscription.endpoint, data: subscription, userEmail });
    return NextResponse.json({ ok: true, id });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to save subscription', details: String((e as Error)?.message || e) }, { status: 500 });
  }
}

