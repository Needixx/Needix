// app/api/cron/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PushNotificationService } from '@/lib/notifications/pushNotifications';

// Configure for proper static export compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job (e.g., Vercel Cron or external service)
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Running notification cron job...');

    // Send subscription reminders (if PushNotificationService exists)
    if (typeof PushNotificationService !== 'undefined') {
      await PushNotificationService.sendSubscriptionReminders();

      // Clean up expired push subscriptions (run weekly)
      const now = new Date();
      const isWeekly = now.getDay() === 0 && now.getHours() === 2; // Sunday at 2 AM
      if (isWeekly) {
        await PushNotificationService.cleanupExpiredSubscriptions();
      }
    }

    console.log('Notification cron job completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      message: "Notifications processed successfully"
    });
  } catch (error) {
    console.error("Notification cron job failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process notifications",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export function GET() {
  return NextResponse.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "notification-cron"
  });
}