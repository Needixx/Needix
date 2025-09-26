// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    debug.log('=== Checkout Session API Called ===');
    
    // Check environment variables first
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return NextResponse.json({ 
        error: 'Stripe configuration error - missing secret key' 
      }, { status: 500 });
    }

    const session = await auth();
    debug.log('Session check:', session?.user?.email ? 'Authenticated' : 'Not authenticated');
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, mode = 'subscription' } = body;

    debug.log('Request body:', { priceId, mode });
    debug.log('User email:', session.user.email);

    // Validate the price ID exists in Stripe
    try {
      const price = await stripe.prices.retrieve(priceId || 'price_1S4Ut40WmSMb2aa0kCC1Bcdb');
      debug.log('Price found:', price.id, price.unit_amount);
    } catch (priceError) {
      console.error('Invalid price ID:', priceError);
      return NextResponse.json({ 
        error: 'Invalid price ID',
        details: 'The price ID does not exist in Stripe' 
      }, { status: 400 });
    }

    debug.log('Creating checkout session...');
    
    // Build session config with proper Stripe types
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer_email: session.user.email,
      payment_method_types: ['card'],
      mode: mode as 'subscription' | 'payment',
      line_items: [
        {
          price: priceId || 'price_1S4Ut40WmSMb2aa0kCC1Bcdb',
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/app?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/app?canceled=true`,
      metadata: {
        userId: session.user.email,
      },
      allow_promotion_codes: true,
    };

    // Only add customer_creation for payment mode
    if (mode === 'payment') {
      sessionConfig.customer_creation = 'always';
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    debug.log('Checkout session created successfully:', checkoutSession.id);
    return NextResponse.json({ sessionId: checkoutSession.id });
    
  } catch (error: unknown) {
    console.error('=== Detailed API Error ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: errorMessage,
      type: typeof error
    }, { status: 500 });
  }
}