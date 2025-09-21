// app/api/create-portal-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import type Stripe from 'stripe';
import { z } from 'zod';

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    console.log('=== Portal Session API Called ===');

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const raw = (await req.json()) as unknown;
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { email } = parsed.data;

    console.log('Looking for customer with email:', email);

    // Find existing customer
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    console.log('Found customers:', existingCustomers.data.length);

    if (existingCustomers.data.length === 0) {
      return NextResponse.json(
        {
          error: 'No subscription found',
          details: 'Please upgrade to Pro first before managing billing.',
        },
        { status: 404 }
      );
    }

    const customer = existingCustomers.data[0];

    if (!customer || !customer.id) {
      return NextResponse.json(
        {
          error: 'Invalid customer data',
          details: 'Customer record is corrupted.',
        },
        { status: 500 }
      );
    }

    console.log('Customer found:', customer.id);

    // Create portal session with proper typing
    const portalConfig: Stripe.BillingPortal.SessionCreateParams = {
      customer: customer.id,
      return_url: `${process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000'}/dashboard`,
    };

    const portalSession = await stripe.billingPortal.sessions.create(portalConfig);

    console.log('Portal session created:', portalSession.id);
    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error('=== Portal Session Error ===');
    console.error('Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        error: 'Error creating portal session',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
