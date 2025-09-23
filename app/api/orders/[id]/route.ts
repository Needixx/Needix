// app/api/orders/[id]/route.ts - TYPE SAFE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface UpdateOrderBody {
  merchant?: string;
  total?: number;
  currency?: string;
  orderDate?: string;
  notes?: string | null;
  category?: string | null;
  isEssential?: boolean;
}

function getId(req: NextRequest): string | null {
  const pathname = req.nextUrl.pathname;
  const segments = pathname.split('/');
  const id = segments[segments.length - 1];
  return id && id !== 'route.ts' ? id : null;
}

export const PATCH = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getId(req);
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

    // Ensure it belongs to the user
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = (await req.json()) as UpdateOrderBody;
    const data: Prisma.OrderUpdateInput = {};

    if (payload.merchant !== undefined) data.merchant = String(payload.merchant);
    if (payload.total !== undefined) data.total = Number(payload.total);
    if (payload.currency !== undefined) data.currency = String(payload.currency);
    if (payload.orderDate !== undefined) data.orderDate = payload.orderDate ? new Date(payload.orderDate) : new Date();
    if (payload.notes !== undefined) data.notes = payload.notes ? String(payload.notes) : null;
    if (payload.category !== undefined) data.category = payload.category ? String(payload.category) : null;
    if (payload.isEssential !== undefined) data.isEssential = Boolean(payload.isEssential);

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

    // Ensure it belongs to the user
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