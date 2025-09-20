// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

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

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);
      
      if (session.customer_email) {
        console.log(`User ${session.customer_email} is now Pro`);
        // In a real app, you'd save this to your database
        // For now, we'll rely on the success URL parameter
      }
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log('Subscription updated:', subscription.id);
      
      if (subscription.customer && typeof subscription.customer === 'string') {
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (customer && !customer.deleted && customer.email) {
          console.log(`Subscription ${subscription.status} for ${customer.email}`);
        }
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('Subscription cancelled:', deletedSubscription.id);
      
      // Handle immediate cancellation
      if (deletedSubscription.customer && typeof deletedSubscription.customer === 'string') {
        const customer = await stripe.customers.retrieve(deletedSubscription.customer);
        if (customer && !customer.deleted && customer.email) {
          console.log(`IMMEDIATE CANCELLATION: Removing Pro status for ${customer.email}`);
          
          // Here you would remove Pro status from your database
          // For localStorage approach, we'll create an API endpoint
          await removeProStatus(customer.email);
        }
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      console.log('Payment succeeded for invoice:', invoice.id);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log('Payment failed for invoice:', failedInvoice.id);
      
      // Handle failed payment - could downgrade immediately or after grace period
      if (failedInvoice.customer && typeof failedInvoice.customer === 'string') {
        const customer = await stripe.customers.retrieve(failedInvoice.customer);
        if (customer && !customer.deleted && customer.email) {
          console.log(`Payment failed for ${customer.email} - consider downgrading`);
        }
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Helper function to remove Pro status
async function removeProStatus(email: string) {
  // Since we're using localStorage, we need to create a way to revoke Pro status
  // In a real app, this would update your database
  
  // For now, we'll log it and rely on the client to check subscription status
  console.log(`Would remove Pro status for: ${email}`);
  
  // You could also call Stripe to verify the subscription status
  // and update your database accordingly
}