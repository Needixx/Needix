// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import type Stripe from 'stripe';
import { z } from 'zod';

const DEFAULT_PRICE_ID = 'price_1S4Ut40WmSMb2aa0kCC1Bcdb';

const BodySchema = z.object({
  priceId: z.string().min(1).optional(),
  mode: z.enum(['subscription', 'payment']).optional().default('subscription'),
});

export async function POST(req: NextRequest) {
  try {
    console.log('=== Checkout Session API Called ===');

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Stripe configuration error - missing secret key' },
        { status: 500 }
      );
    }

    const session = await auth();
    console.log(
      'Session check:',
      session?.user?.email ? 'Authenticated' : 'Not authenticated'
    );

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const raw = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { priceId, mode } = parsed.data;

    console.log('Request body:', { priceId, mode });
    console.log('User email:', session.user.email);

    // Validate the price ID exists in Stripe
    const priceToUse = priceId ?? DEFAULT_PRICE_ID;
    try {
      const price = await stripe.prices.retrieve(priceToUse);
      console.log('Price found:', price.id, price.unit_amount);
    } catch (priceError) {
      console.error('Invalid price ID:', priceError);
      return NextResponse.json(
        {
          error: 'Invalid price ID',
          details: 'The price ID does not exist in Stripe',
        },
        { status: 400 }
      );
    }

    console.log('Creating checkout session...');

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer_email: session.user.email,
      payment_method_types: ['card'],
      mode,
      line_items: [
        {
          price: priceToUse,
          quantity: 1,
        },
      ],
      success_url: `${
        process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'
      }/dashboard?success=true`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'
      }/dashboard?canceled=true`,
      metadata: {
        userId: session.user.email,
      },
      allow_promotion_codes: true,
    };

    if (mode === 'payment') {
      sessionConfig.customer_creation = 'always';
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Checkout session created successfully:', checkoutSession.id);
    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error: unknown) {
    console.error('=== Detailed API Error ===');
    console.error('Error type:', typeof error);
    console.error(
      'Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error('Full error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: errorMessage,
        type: typeof error,
      },
      { status: 500 }
    );
  }
}
