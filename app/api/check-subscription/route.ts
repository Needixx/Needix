// app/api/check-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { email } = await req.json();

    // Find customer in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        isPro: false,
        status: 'no_customer'
      });
    }

    const customer = customers.data[0];

    // Check if customer is valid and not deleted
    if (!customer || customer.deleted) {
      return NextResponse.json({ 
        isPro: false,
        status: 'deleted_customer'
      });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10,
    });

    const hasActiveSubscription = subscriptions.data.length > 0;

    // Simplified subscription data without problematic properties
    const subscriptionData = subscriptions.data.map(sub => ({
      id: sub.id,
      status: sub.status,
    }));

    return NextResponse.json({ 
      isPro: hasActiveSubscription,
      status: hasActiveSubscription ? 'active' : 'cancelled',
      subscriptions: subscriptionData
    });
    
  } catch (error: unknown) {
    console.error('Error checking subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Error checking subscription',
      details: errorMessage 
    }, { status: 500 });
  }
}