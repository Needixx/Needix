import { NextRequest, NextResponse } from 'next/server';
import { saveSnapshot } from '@/lib/serverStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userEmail, tzOffsetMinutes, settings, items } = body || {};
    if (!id || !settings || !items) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    await saveSnapshot({ id, userEmail, tzOffsetMinutes, settings, items, updatedAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to save snapshot', details: String((e as Error)?.message || e) }, { status: 500 });
  }
}

