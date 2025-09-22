import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Recurrence } from '@prisma/client';

function toRecurrence(val: unknown): Recurrence | undefined {
  const allowed: Recurrence[] = ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'];
  return allowed.includes(val as Recurrence) ? (val as Recurrence) : undefined;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Avoid assigning `any`
    const raw: unknown = await req.json();
    const {
      description,
      amount,
      currency = 'USD',
      date,
      merchant,
      category,
      recurrence = 'none'
    } = raw as {
      description: string;
      amount: number;
      currency?: string;
      date?: string;
      merchant?: string | null;
      category?: string | null;
      recurrence?: unknown;
    };

    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
    });

    const rec: Recurrence = toRecurrence(recurrence) ?? 'none';

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        description,
        amount,
        currency,
        date: date ? new Date(date) : new Date(),
        merchant: merchant ?? null,
        category: category ?? null,
        recurrence: rec
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
