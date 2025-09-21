// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

function isCheckoutSession(obj: Stripe.Event.Data.Object): obj is Stripe.Checkout.Session {
  return (obj as { object?: string }).object === 'checkout.session';
}
function isSubscription(obj: Stripe.Event.Data.Object): obj is Stripe.Subscription {
  return (obj as { object?: string }).object === 'subscription';
}
function isInvoice(obj: Stripe.Event.Data.Object): obj is Stripe.Invoice {
  return (obj as { object?: string }).object === 'invoice';
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      if (isCheckoutSession(obj)) {
        console.log('Payment successful for session:', obj.id);
        if (obj.customer_email) {
          console.log(`User ${obj.customer_email} is now Pro`);
          // Persist Pro status in DB in a real app
        }
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      if (isSubscription(obj)) {
        console.log('Subscription updated:', obj.id);

        if (obj.customer && typeof obj.customer === 'string') {
          const customer = await stripe.customers.retrieve(obj.customer);
          if (customer && !('deleted' in customer) && customer.email) {
            console.log(`Subscription ${obj.status} for ${customer.email}`);
          }
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      if (isSubscription(obj)) {
        console.log('Subscription cancelled:', obj.id);

        if (obj.customer && typeof obj.customer === 'string') {
          const customer = await stripe.customers.retrieve(obj.customer);
          if (customer && !('deleted' in customer) && customer.email) {
            console.log(
              `IMMEDIATE CANCELLATION: Removing Pro status for ${customer.email}`
            );
            removeProStatus(customer.email);
          }
        }
      }
      break;
    }

    case 'invoice.payment_succeeded': {
      if (isInvoice(obj)) {
        console.log('Payment succeeded for invoice:', obj.id);
      }
      break;
    }

    case 'invoice.payment_failed': {
      if (isInvoice(obj)) {
        console.log('Payment failed for invoice:', obj.id);

        if (obj.customer && typeof obj.customer === 'string') {
          const customer = await stripe.customers.retrieve(obj.customer);
          if (customer && !('deleted' in customer) && customer.email) {
            console.log(`Payment failed for ${customer.email} - consider downgrading`);
          }
        }
      }
      break;
    }

    default: {
      console.log(`Unhandled event type: ${event.type}`);
    }
  }

  return NextResponse.json({ received: true });
}

// Helper function to remove Pro status (not async; no awaits inside)
function removeProStatus(email: string): void {
  // In a real app, update your database to revoke Pro status
  console.log(`Would remove Pro status for: ${email}`);
}
