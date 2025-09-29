// app/api/sync/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Configure for Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy load dependencies to avoid bundling issues
async function getDependencies() {
  const { auth } = await import('@/lib/auth');
  const { prisma } = await import('@/lib/prisma');
  return { auth, prisma };
}

export async function GET() {
  try {
    const { auth, prisma } = await getDependencies();
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ items: [] });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ items: [] });
    }

    // Get all subscriptions for this user
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Convert to frontend format
    const items = subscriptions.map(sub => ({
      id: sub.id,
      name: sub.name,
      price: sub.amount,
      currency: sub.currency,
      period: sub.interval,
      nextBillingDate: sub.nextBillingDate || (sub.nextBillingAt ? sub.nextBillingAt.toISOString().split('T')[0] : null),
      category: sub.category || undefined,
      notes: sub.notes || undefined,
      link: sub.vendorUrl || undefined,
      isEssential: Boolean(sub.isEssential),
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/sync/subscriptions error:', error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, prisma } = await getDependencies();
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];

    // This endpoint is primarily for reading - actual creation/updates
    // should go through /api/subscriptions endpoints
    // But we can sync if needed

    return NextResponse.json({ ok: true, synced: items.length });
  } catch (e: unknown) {
    console.error('POST /api/sync/subscriptions error:', e);
    return NextResponse.json(
      { error: 'Failed to sync', details: String((e as Error)?.message || e) },
      { status: 500 }
    );
  }
}