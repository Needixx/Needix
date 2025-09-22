// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Pull the dynamic [id] from the URL (no second arg needed)
function getId(req: NextRequest): string | null {
  const p = req.nextUrl.pathname.replace(/\/+$/, '');
  const id = p.split('/').pop() ?? null;
  return id && id.length > 0 ? id : null;
}

export const PATCH = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getId(req);
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

    // verify ownership
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = (await req.json()) as {
      merchant?: string;
      total?: number;
      currency?: string;
      orderDate?: string | null; // only set if provided and non-null
      category?: string | null;
      notes?: string | null;
    };

    const data: Parameters<typeof prisma.order.update>[0]['data'] = {};
    if (payload.merchant !== undefined) data.merchant = payload.merchant;
    if (payload.total !== undefined) data.total = payload.total;
    if (payload.currency !== undefined) data.currency = payload.currency;
    if (payload.orderDate !== undefined && payload.orderDate !== null) {
      data.orderDate = new Date(payload.orderDate);
    }
    if (payload.category !== undefined) data.category = payload.category ?? null;
    if (payload.notes !== undefined) data.notes = payload.notes ?? null;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error('Error updating order:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getId(req);
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

    // verify ownership
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting order:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};
