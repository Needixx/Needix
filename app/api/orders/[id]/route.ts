// app/api/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, OrderStatus } from '@prisma/client';
import { debug } from '@/lib/debug';

interface UpdateOrderBody {
  merchant?: string;
  total?: number;
  currency?: string;
  orderDate?: string;
  status?: 'active' | 'completed' | 'cancelled';
  notes?: string | null;
  category?: string | null;
  isEssential?: boolean;
}

function getId(req: NextRequest): string | null {
  const pathname = req.nextUrl.pathname;
  // Remove trailing slash and split
  const segments = pathname.replace(/\/$/, '').split('/');
  const id = segments[segments.length - 1];
  debug.log('Extracting ID from pathname:', pathname, 'segments:', segments, 'id:', id);
  return id && id !== 'route.ts' && id.length > 0 ? id : null;
}

export const PATCH = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = getId(req);
    if (!id) {
      console.error('No ID provided in PATCH request');
      return NextResponse.json({ error: 'Bad request - no ID' }, { status: 400 });
    }

    // Ensure it belongs to the user
    const existing = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let payload: UpdateOrderBody;
    try {
      payload = (await req.json()) as UpdateOrderBody;
      debug.log('PATCH payload received:', JSON.stringify(payload, null, 2));
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Validate payload has at least one field to update
    if (Object.keys(payload).length === 0) {
      console.error('Empty payload received');
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const data: Prisma.OrderUpdateInput = {};

    // Build update data with proper validation
    if (payload.merchant !== undefined) {
      data.merchant = String(payload.merchant);
    }
    if (payload.total !== undefined) {
      const total = Number(payload.total);
      if (isNaN(total) || total < 0) {
        return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
      }
      data.total = total;
    }
    if (payload.currency !== undefined) {
      data.currency = String(payload.currency);
    }
    if (payload.orderDate !== undefined) {
      try {
        data.orderDate = payload.orderDate ? new Date(payload.orderDate) : new Date();
      } catch (_error) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
    }
    
    // Handle status updates with proper enum casting
    if (payload.status !== undefined) {
      const validStatuses: OrderStatus[] = ['active', 'completed', 'cancelled'];
      if (!validStatuses.includes(payload.status as OrderStatus)) {
        console.error('Invalid status value:', payload.status);
        return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
      }
      data.status = payload.status as OrderStatus;
      debug.log('Setting status to:', payload.status);
    }

    if (payload.notes !== undefined) {
      data.notes = payload.notes ? String(payload.notes) : null;
    }
    if (payload.category !== undefined) {
      data.category = payload.category ? String(payload.category) : null;
    }
    if (payload.isEssential !== undefined) {
      data.isEssential = Boolean(payload.isEssential);
    }

    debug.log('Final Prisma update data:', JSON.stringify(data, null, 2));

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });

    debug.log('Order updated successfully:', order.id, 'status:', order.status);
    return NextResponse.json(order);
  } catch (err) {
    console.error('Error updating order:', err);
    
    // More specific error handling
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma error code:', err.code);
      console.error('Prisma error message:', err.message);
      
      if (err.code === 'P2002') {
        return NextResponse.json({ error: 'Duplicate constraint violation' }, { status: 400 });
      }
      if (err.code === 'P2025') {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
      }
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
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