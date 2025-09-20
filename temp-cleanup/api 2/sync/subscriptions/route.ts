import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { loadUserSubscriptions, saveUserSubscriptions } from '@/lib/serverStore';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ items: [] });
  const items = await loadUserSubscriptions(session.user.email);
  return NextResponse.json({ items: items ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    await saveUserSubscriptions(session.user.email, items);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Failed to save', details: String((e as Error)?.message || e) }, { status: 500 });
  }
}

