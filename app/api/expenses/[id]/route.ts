// app/api/expenses/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma, Recurrence } from '@prisma/client';

function toRecurrence(val: unknown): Recurrence | undefined {
  const allowed: Recurrence[] = ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'];
  return allowed.includes(val as Recurrence) ? (val as Recurrence) : undefined;
}

// Helper to extract the dynamic [id] from the request URL.
// Works whether there’s a trailing slash or query string.
function extractIdFromUrl(req: Request): string | null {
  const { pathname } = new URL(req.url);
  const parts = pathname.replace(/\/+$/, '').split('/');
  const id = parts[parts.length - 1] ?? null;
  return id && id.length > 0 ? id : null;
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = extractIdFromUrl(req);
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

    // Confirm the expense belongs to this user
    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const raw: unknown = await req.json();
    const {
      description,
      amount,
      currency,
      date,
      merchant,
      category,
      recurrence,
    } = raw as {
      description?: string;
      amount?: number;
      currency?: string;
      date?: string | null;
      merchant?: string | null;
      category?: string | null;
      recurrence?: unknown;
    };

    const updateData: Prisma.ExpenseUpdateInput = {};
    if (typeof description !== 'undefined') updateData.description = description;
    if (typeof amount !== 'undefined') updateData.amount = amount;
    if (typeof currency !== 'undefined') updateData.currency = currency;

    // Only set date if it’s a string; never write null (column is non-nullable).
    if (typeof date !== 'undefined' && date !== null) {
      updateData.date = new Date(date);
    }

    if (typeof merchant !== 'undefined') updateData.merchant = merchant ?? null;
    if (typeof category !== 'undefined') updateData.category = category ?? null;
    if (typeof recurrence !== 'undefined') {
      const rec = toRecurrence(recurrence);
      if (rec) updateData.recurrence = rec;
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = extractIdFromUrl(req);
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 });

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
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
