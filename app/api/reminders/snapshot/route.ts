// app/api/reminders/snapshot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { saveSnapshot } from '@/lib/serverStore';
import { z } from 'zod';

const BodySchema = z.object({
  id: z.string().min(1),
  userEmail: z.string().email().optional(),
  tzOffsetMinutes: z.number().int().optional(),
  settings: z.unknown(),
  items: z.array(z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { id, userEmail, tzOffsetMinutes, settings, items } = parsed.data;

    await saveSnapshot(
      {
        id,
        userEmail,
        tzOffsetMinutes,
        settings,
        items,
        updatedAt: Date.now(),
      } as unknown as Parameters<typeof saveSnapshot>[0] // keep linter happy & match store signature
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: 'Failed to save snapshot', details: String((e as Error)?.message || e) },
      { status: 500 }
    );
  }
}
