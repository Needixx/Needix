// app/api/notifications/verify-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Decimal } from '@prisma/client/runtime/library';

// Configure for static export compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubscriptionData {
  id: string;
  name: string;
  nextBillingDate: string | null;
  nextBillingAt: Date | null;
  amount: Decimal;
  status: string;
}

interface SchedulingTestResult {
  leadDaysConfigured: number[];
  timeOfDay: string;
  totalRemindersScheduled: number;
  upcomingReminders: Array<{
    subscriptionId: string;
    subscriptionName: string;
    billingDate: string;
    leadDays: number;
    scheduledFor: string;
    isUpcoming: boolean;
  }>;
  allReminders: Array<{
    subscriptionId: string;
    subscriptionName: string;
    billingDate: string;
    leadDays: number;
    scheduledFor: string;
    isUpcoming: boolean;
  }>;
}

interface UpcomingSubscription {
  id: string;
  name: string;
  nextBillingDate: string | null;
  daysUntilRenewal: number | null;
  amount: Decimal;
  status: string;
}

interface VerificationResponse {
  userId: string;
  timestamp: string;
  notificationSettings: {
    exists: boolean;
    enabled: boolean;
    leadDays: number[];
    timeOfDay: string;
    channels: string[];
  };
  subscriptions: {
    total: number;
    withBillingDates: number;
    upcoming: UpcomingSubscription[];
  };
  reminders: {
    snapshotsExist: boolean;
    latestSnapshot: {
      id: string;
      createdAt: Date;
      settings: any;
      itemCount: number;
    } | null;
    totalSnapshots: number;
  };
  notifications: {
    recentCount: number;
    recent: Array<{
      type: string;
      title: string;
      sentAt: Date;
      status: string;
    }>;
  };
  capabilities: {
    webPush: boolean;
    email: boolean;
    database: boolean;
  };
  environment: {
    vapidPublicKey: string;
    vapidPrivateKey: string;
    resendApiKey: string;
    resendFrom: string;
  };
  schedulingTest?: SchedulingTestResult | { error: string; details: string };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkScheduling = searchParams.get('checkScheduling') === 'true';

    // Get user's notification settings
    const notificationSettings = await prisma.notificationSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Get user's subscriptions with proper type handling
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        nextBillingDate: true,
        nextBillingAt: true,
        amount: true,
        status: true,
      }
    });

    // Check for reminder snapshots
    const reminderSnapshots = await prisma.reminderSnapshot.findMany({
      where: { 
        userId: session.user.id,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Check notification logs
    const recentNotifications = await prisma.notificationLog.findMany({
      where: { userId: session.user.id },
      orderBy: { sentAt: 'desc' },
      take: 10
    });

    // Helper function to convert billing date to string
    const getBillingDateString = (sub: SubscriptionData): string | null => {
      if (sub.nextBillingDate) return sub.nextBillingDate;
      if (sub.nextBillingAt) return sub.nextBillingAt.toISOString().slice(0, 10);
      return null;
    };

    const verification: VerificationResponse = {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
      
      // Notification settings status
      notificationSettings: {
        exists: !!notificationSettings,
        enabled: notificationSettings?.enabled || false,
        leadDays: notificationSettings?.leadDays ? 
          notificationSettings.leadDays.split(',').map(d => parseInt(d.trim(), 10)) : [],
        timeOfDay: notificationSettings?.timeOfDay || 'Not set',
        channels: notificationSettings?.channels ? 
          notificationSettings.channels.split(',') : [],
      },

      // Subscription data
      subscriptions: {
        total: subscriptions.length,
        withBillingDates: subscriptions.filter(s => s.nextBillingDate || s.nextBillingAt).length,
        upcoming: subscriptions.filter(s => {
          const billingDate = getBillingDateString(s);
          if (!billingDate) return false;
          const date = new Date(billingDate);
          const now = new Date();
          const diffTime = date.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 30; // Next 30 days
        }).map(s => {
          const billingDate = getBillingDateString(s);
          const daysUntilRenewal = billingDate ? (() => {
            const date = new Date(billingDate);
            const now = new Date();
            const diffTime = date.getTime() - now.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          })() : null;

          return {
            id: s.id,
            name: s.name,
            nextBillingDate: billingDate,
            daysUntilRenewal,
            amount: s.amount,
            status: s.status
          };
        })
      },

      // Reminder system status
      reminders: {
        snapshotsExist: reminderSnapshots.length > 0,
        latestSnapshot: reminderSnapshots[0] ? {
          id: reminderSnapshots[0].id,
          createdAt: reminderSnapshots[0].createdAt,
          settings: reminderSnapshots[0].settings,
          itemCount: Array.isArray(reminderSnapshots[0].subscriptions) ? 
            (reminderSnapshots[0].subscriptions as any[]).length : 0
        } : null,
        totalSnapshots: reminderSnapshots.length
      },

      // Recent notification activity
      notifications: {
        recentCount: recentNotifications.length,
        recent: recentNotifications.map(n => ({
          type: n.type,
          title: n.title,
          sentAt: n.sentAt,
          status: n.status
        }))
      },

      // System capabilities
      capabilities: {
        webPush: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        email: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM),
        database: true, // If we got this far, DB is working
      },

      // Environment check
      environment: {
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY ? 'Configured' : 'Missing',
        vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ? 'Configured' : 'Missing',
        resendApiKey: process.env.RESEND_API_KEY ? 'Configured' : 'Missing',
        resendFrom: process.env.RESEND_FROM || 'Missing',
      }
    };

    // If requested, also check scheduling logic
    if (checkScheduling && notificationSettings?.enabled) {
      const schedulingTest = await testSchedulingLogic(
        session.user.id, 
        notificationSettings,
        subscriptions
      );
      verification.schedulingTest = schedulingTest;
    }

    return NextResponse.json({
      success: true,
      verification
    });

  } catch (error) {
    console.error('Verification failed:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: String(error) },
      { status: 500 }
    );
  }
}

async function testSchedulingLogic(
  userId: string,
  settings: any,
  subscriptions: SubscriptionData[]
): Promise<SchedulingTestResult | { error: string; details: string }> {
  try {
    const leadDays = settings.leadDays ? 
      settings.leadDays.split(',').map((d: string) => parseInt(d.trim(), 10)) : [];
    const timeOfDay = settings.timeOfDay || '09:00';
    const tzOffsetMinutes = 0; // Assume UTC for now

    const scheduledReminders: Array<{
      subscriptionId: string;
      subscriptionName: string;
      billingDate: string;
      leadDays: number;
      scheduledFor: string;
      isUpcoming: boolean;
    }> = [];

    // Helper function to get billing date string
    const getBillingDateString = (sub: SubscriptionData): string | null => {
      if (sub.nextBillingDate) return sub.nextBillingDate;
      if (sub.nextBillingAt) return sub.nextBillingAt.toISOString().slice(0, 10);
      return null;
    };

    for (const sub of subscriptions) {
      const billingDate = getBillingDateString(sub);
      if (!billingDate) continue;

      const billing = new Date(billingDate);
      const now = new Date();

      if (billing <= now) continue; // Skip past dates

      for (const lead of [0, ...leadDays]) {
        const reminderDate = new Date(billing);
        reminderDate.setDate(reminderDate.getDate() - lead);
        
        // Set time of day
        const [hours, minutes] = timeOfDay.split(':');
        reminderDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        // Adjust for timezone
        const scheduledUtc = new Date(reminderDate.getTime() - (tzOffsetMinutes * 60 * 1000));

        if (scheduledUtc > now) {
          scheduledReminders.push({
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            billingDate: billingDate,
            leadDays: lead,
            scheduledFor: scheduledUtc.toISOString(),
            isUpcoming: (scheduledUtc.getTime() - now.getTime()) < (7 * 24 * 60 * 60 * 1000) // Next 7 days
          });
        }
      }
    }

    return {
      leadDaysConfigured: leadDays,
      timeOfDay,
      totalRemindersScheduled: scheduledReminders.length,
      upcomingReminders: scheduledReminders.filter(r => r.isUpcoming),
      allReminders: scheduledReminders.slice(0, 10) // Limit to first 10 for response size
    };

  } catch (error) {
    return {
      error: 'Failed to test scheduling logic',
      details: String(error)
    };
  }
}

// Also create a simple test endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { testType } = await request.json();

    switch (testType) {
      case 'schedule_test_reminder':
        // Create a test reminder for immediate dispatch
        const testDate = new Date();
        testDate.setMinutes(testDate.getMinutes() + 2); // 2 minutes from now

        const testSnapshot = {
          userId: session.user.id,
          settings: {
            enabled: true,
            leadDays: [0],
            timeOfDay: testDate.toTimeString().slice(0, 5), // HH:MM format
            channels: ['web', 'email']
          },
          items: [{
            id: 'test-sub-' + Date.now(),
            name: 'Test Subscription',
            nextBillingDate: testDate.toISOString().slice(0, 10), // YYYY-MM-DD
          }],
          tzOffsetMinutes: 0
        };

        // Save test snapshot
        await prisma.reminderSnapshot.create({
          data: {
            userId: session.user.id,
            settings: testSnapshot.settings,
            subscriptions: testSnapshot.items,
            tzOffsetMinutes: 0,
            isActive: true
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Test reminder scheduled',
          scheduledFor: testDate.toISOString(),
          note: 'This test reminder should trigger within 2 minutes if the cron job is running'
        });

      default:
        return NextResponse.json(
          { error: 'Unknown test type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json(
      { error: 'Test failed', details: String(error) },
      { status: 500 }
    );
  }
}