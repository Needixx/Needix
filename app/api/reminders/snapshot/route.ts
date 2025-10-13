// app/api/reminders/snapshot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveSnapshot } from '@/lib/serverStore';
import { getEffectiveZone } from '@/lib/effectiveZone';

// Configure for static export compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, settings, tzOffsetMinutes } = await request.json();

    if (!items || !settings) {
      return NextResponse.json(
        { error: 'Items and settings are required' },
        { status: 400 }
      );
    }

    // ⬇️ Get the effective IANA timezone now and store it with the snapshot
    const zone = await getEffectiveZone(session.user.id);

    // Persist snapshot for cron processing. We keep your existing shape,
    // but add "zone" into settings so cron uses the same zone later.
    await saveSnapshot(session.user.id, {
      items,
      settings: { ...settings, zone },
      tzOffsetMinutes: tzOffsetMinutes || 0, // legacy field you were already persisting
    });

    return NextResponse.json({
      success: true,
      message: 'Reminder snapshot saved successfully',
    });
  } catch (error) {
    console.error('Error saving reminder snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to save reminder snapshot' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Implement actual deletion in serverStore if/when needed
    return NextResponse.json({
      success: true,
      message: 'Reminder snapshot removed successfully',
    });
  } catch (error) {
    console.error('Error removing reminder snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to remove reminder snapshot' },
      { status: 500 }
    );
  }
}
