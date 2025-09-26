// app/api/admin/analytics/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const session = await auth();
    
    // Check if user is admin (replace with your admin email)
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    debug.log('Fetching analytics data...');

    // Get all customers from Stripe
    const customers = await stripe.customers.list({
      limit: 100,
    });

    // Get all active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    // Get all cancelled subscriptions (for churn calculation)
    const cancelledSubscriptions = await stripe.subscriptions.list({
      status: 'canceled',
      limit: 100,
    });

    // Calculate metrics
    const totalCustomers = customers.data.length;
    const totalActiveSubscriptions = activeSubscriptions.data.length;
    const totalCancelledSubscriptions = cancelledSubscriptions.data.length;
    
    // Calculate MRR (assuming $4.99 per subscription)
    const mrr = activeSubscriptions.data.length * 4.99;
    
    // Calculate conversion rate (active subscribers / total customers)
    const conversionRate = totalCustomers > 0 ? (totalActiveSubscriptions / totalCustomers) * 100 : 0;
    
    // Calculate churn rate (cancelled / total ever subscribed)
    const totalEverSubscribed = totalActiveSubscriptions + totalCancelledSubscriptions;
    const churnRate = totalEverSubscribed > 0 ? (totalCancelledSubscriptions / totalEverSubscribed) * 100 : 0;

    // Get recent subscription activity (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const recentSubscriptions = activeSubscriptions.data.filter(sub => 
      sub.created > thirtyDaysAgo
    );

    const metrics = {
      totalCustomers,
      totalActiveSubscriptions,
      totalCancelledSubscriptions,
      mrr,
      conversionRate,
      churnRate,
      recentSubscriptions: recentSubscriptions.length,
      avgRevenuePerUser: totalActiveSubscriptions > 0 ? mrr / totalActiveSubscriptions : 0,
    };

    debug.log('Analytics metrics:', metrics);
    return NextResponse.json(metrics);
    
  } catch (error: unknown) {
    console.error('Analytics error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: errorMessage 
    }, { status: 500 });
  }
}

function isAdmin(email: string): boolean {
  // Replace with your admin email addresses
  const adminEmails = [
    'needix2025@gmail.com', // Add your admin email here
    'devannaastad@gmail.com' // Add other admin emails
  ];
  return adminEmails.includes(email);
}
