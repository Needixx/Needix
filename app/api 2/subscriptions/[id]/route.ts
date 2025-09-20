// app/api/subscriptions/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// PUT - Update subscription
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { id: _id } = await params;
    void _id;
    const body = await req.json();
    const { name, price, period, nextBillingDate, category, notes } = body;

    // In production, update in database
    const updatedSubscription = {
      id: _id,
      name,
      price: parseFloat(price),
      period,
      nextBillingDate,
      category: category || '',
      notes: notes || '',
      userId: session.user.email
    };

    return NextResponse.json({ subscription: updatedSubscription });
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete subscription
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { id: _id } = await params;
    void _id;

    // In production, delete from database
    return NextResponse.json({ message: 'Subscription deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
