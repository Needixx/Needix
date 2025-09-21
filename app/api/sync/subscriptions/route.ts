// app/api/sync/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { loadUserSubscriptions, saveUserSubscriptions } from '@/lib/serverStore';
import { z } from 'zod';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ items: [] });
  const items = await loadUserSubscriptions(session.user.email);
  return NextResponse.json({ items: items ?? [] });
}

const BodySchema = z.object({
  items: z.array(z.unknown()),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const raw = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Parse to unknown[] then cast to the exact parameter type to avoid `any` usage
    await saveUserSubscriptions(
      session.user.email,
      parsed.data.items as unknown as Parameters<typeof saveUserSubscriptions>[1]
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: 'Failed to save', details: String((e as Error)?.message || e) },
      { status: 500 }
    );
  }
}
