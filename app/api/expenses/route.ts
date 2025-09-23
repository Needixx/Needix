// app/api/expenses/route.ts - TYPE SAFE VERSION
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Recurrence } from '@prisma/client';

interface CreateExpenseBody {
  description: string;
  amount: number;
  currency?: string;
  date?: string;
  merchant?: string | null;
  category?: string | null;
  recurrence?: string;
  isEssential?: boolean;
}

export const GET = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as CreateExpenseBody;
    const {
      description,
      amount,
      currency = 'USD',
      date,
      merchant,
      category,
      recurrence = 'none',
      isEssential = false,
    } = body;

    if (!description || amount === undefined) {
      return NextResponse.json(
        { error: 'Description and amount are required' },
        { status: 400 }
      );
    }

    // Validate recurrence
    const validRecurrences: Recurrence[] = ['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'];
    const mappedRecurrence: Recurrence = validRecurrences.includes(recurrence as Recurrence) 
      ? (recurrence as Recurrence) 
      : 'none';

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        description: String(description),
        amount: Number(amount),
        currency: String(currency),
        date: date ? new Date(date) : new Date(),
        merchant: merchant ? String(merchant) : null,
        category: category ? String(category) : null,
        recurrence: mappedRecurrence,
        isEssential: Boolean(isEssential),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (err) {
    console.error('Error creating expense:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
};