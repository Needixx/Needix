// app/api/expenses/[id]/route.ts - TYPE SAFE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Recurrence } from '@prisma/client';

interface UpdateExpenseBody {
  description?: string;
  amount?: number;
  currency?: string;
  date?: string;
  merchant?: string | null;
  category?: string | null;
  recurrence?: string;
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
    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = (await req.json()) as UpdateExpenseBody;
    const data: Prisma.ExpenseUpdateInput = {};

    if (payload.description !== undefined) data.description = String(payload.description);
    if (payload.amount !== undefined) data.amount = Number(payload.amount);
    if (payload.currency !== undefined) data.currency = String(payload.currency);
    if (payload.date !== undefined) data.date = payload.date ? new Date(payload.date) : new Date();
    if (payload.merchant !== undefined) data.merchant = payload.merchant ? String(payload.merchant) : null;
    if (payload.category !== undefined) data.category = payload.category ? String(payload.category) : null;
    if (payload.recurrence !== undefined) data.recurrence = payload.recurrence as Prisma.EnumRecurrenceFieldUpdateOperationsInput | Recurrence;
    if (payload.isEssential !== undefined) data.isEssential = Boolean(payload.isEssential);

    const expense = await prisma.expense.update({
      where: { id },
      data,
    });

    return NextResponse.json(expense);
  } catch (err) {
    console.error('Error updating expense:', err);
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
    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting expense:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};