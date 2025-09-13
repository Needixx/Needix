// app/api/subscriptions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// GET - Fetch user's subscriptions
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // For now, return demo data
    // In production, fetch from database by user email
    const subscriptions = [
      {
        id: '1',
        name: 'Netflix',
        price: 15.49,
        period: 'monthly',
        nextBillingDate: '2025-10-09',
        category: 'Streaming',
        notes: 'Standard plan'
      },
      {
        id: '2',
        name: 'Spotify Premium',
        price: 10.99,
        period: 'monthly',
        nextBillingDate: '2025-10-15',
        category: 'Music',
        notes: ''
      }
    ];

    return NextResponse.json({ subscriptions });
    
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new subscription
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { name, price, period, nextBillingDate, category, notes } = body;

    // Validation
    if (!name || !price || !period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // For now, just return the created subscription
    // In production, save to database
    const newSubscription = {
      id: Date.now().toString(),
      name,
      price: parseFloat(price),
      period,
      nextBillingDate,
      category: category || '',
      notes: notes || '',
      userId: session.user.email
    };

    return NextResponse.json({ subscription: newSubscription }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
