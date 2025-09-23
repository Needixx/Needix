// app/api/orders/route.ts - TYPE SAFE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface OrderItemInput {
  name: string;
  qty?: number;
  unitPrice?: number;
}

interface CreateOrderBody {
  merchant: string;
  total: number;
  currency?: string;
  orderDate?: string;
  notes?: string | null;
  category?: string | null;
  items?: OrderItemInput[];
  isEssential?: boolean;
}

export const GET = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { orderDate: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as CreateOrderBody;
    const {
      merchant,
      total,
      currency = 'USD',
      orderDate,
      notes,
      category,
      items = [],
      isEssential = false,
    } = body;

    if (!merchant || total === undefined) {
      return NextResponse.json(
        { error: 'Merchant and total are required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        merchant: String(merchant),
        total: Number(total),
        currency: String(currency),
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        notes: notes ? String(notes) : null,
        category: category ? String(category) : null,
        isEssential: Boolean(isEssential),
        items: {
          create: Array.isArray(items) ? items.map((item: OrderItemInput) => ({
            name: String(item.name),
            qty: Number(item.qty) || 1,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
          })) : [],
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error('Error creating order:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};