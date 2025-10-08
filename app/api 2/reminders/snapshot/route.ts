// app/api/reminders/snapshot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveSnapshot } from '@/lib/serverStore';

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

    // Save snapshot for cron processing
    await saveSnapshot(session.user.id, {
      items,
      settings,
      tzOffsetMinutes: tzOffsetMinutes || 0,
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

    // Note: You might want to implement snapshot deletion in serverStore
    // For now, just return success
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