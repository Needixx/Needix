// app/api/cron/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Configure for proper static export compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// Type definitions - Updated to match expected structure
interface SnapshotItem {
  id: string;
  name: string;
  nextBillingDate?: string;
  nextBillingAt?: string;
}

interface SnapshotSettings {
  enabled: boolean;
  leadDays: number[];
  timeOfDay: string;
  channels: string[];
}

// Combined cron job that handles both notifications and reminder dispatching
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (optional)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Running combined notification cron job...');

    const results = {
      reminderDispatches: 0,
      generalNotifications: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // === PART 1: DISPATCH SUBSCRIPTION REMINDERS ===
    try {
      const reminderResult = await dispatchReminders();
      results.reminderDispatches = reminderResult.processed;
      if (reminderResult.errors) results.errors.push(...reminderResult.errors);
      if (reminderResult.warnings) results.warnings.push(...reminderResult.warnings);
    } catch (error) {
      console.error('Reminder dispatch failed:', error);
      results.errors.push(`Reminder dispatch failed: ${String(error)}`);
    }

    // === PART 2: GENERAL NOTIFICATIONS (Weekly digest, etc.) ===
    try {
      const now = new Date();
      const isWeekly = now.getDay() === 0 && now.getHours() === 9; // Sunday at 9 AM
      
      if (isWeekly) {
        const digestResult = await sendWeeklyDigests();
        results.generalNotifications = digestResult.sent;
        if (digestResult.errors) results.errors.push(...digestResult.errors);
      }
    } catch (error) {
      console.error('Weekly digest failed:', error);
      results.errors.push(`Weekly digest failed: ${String(error)}`);
    }

    console.log('Combined notification cron job completed:', results);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      results
    });
  } catch (error) {
    console.error("Combined notification cron job failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process notifications",
        timestamp: new Date().toISOString(),
        details: String(error)
      },
      { status: 500 }
    );
  }
}

// === REMINDER DISPATCH LOGIC ===
async function dispatchReminders() {
  // Dynamic imports for server-side modules
  const webpush = require('web-push');
  const { getSubscription, wasSent, markSent } = await import('@/lib/serverStore');

  function ensureWebPushConfigured() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@needix.app';
    if (!publicKey || !privateKey) {
      console.log('Web push not configured - skipping push notifications');
      return false;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  }

  function ensureEmailConfigured() {
    return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  }

  function scheduledUtcMs(ymd: string, timeHHMM: string, tzOffsetMinutes: number, lead: number) {
    const parts = ymd.split('-');
    const y = Number(parts[0] ?? '0');
    const m = Number(parts[1] ?? '1');
    const d = Number(parts[2] ?? '1');
    const tparts = timeHHMM.split(':');
    const hh = Number(tparts[0] ?? '9');
    const mm = Number(tparts[1] ?? '0');
    const date = new Date(Date.UTC(y, (m - 1), d, hh, mm));
    date.setUTCDate(date.getUTCDate() - lead);
    const utcMs = date.getTime() - tzOffsetMinutes * 60_000;
    return utcMs;
  }

  async function sendEmailNotification(userId: string, item: SnapshotItem, lead: number, ymd: string) {
    try {
      if (!ensureEmailConfigured()) return false;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      });

      if (!user?.email) return false;

      const notificationSettings = await prisma.notificationSettings.findUnique({
        where: { userId },
      });

      const hasEmailEnabled = notificationSettings?.channels?.includes('email') || false;
      if (!hasEmailEnabled) return false;

      const userName = user.name || 'Needix User';
      const subscriptionName = item.name || 'Your subscription';
      
      let title: string;
      let body: string;
      
      if (lead === 0) {
        title = `${subscriptionName} renews TODAY`;
        body = `Your ${subscriptionName} subscription renews today. Make sure your payment method is up to date.`;
      } else if (lead === 1) {
        title = `${subscriptionName} renews TOMORROW`;
        body = `Your ${subscriptionName} subscription will renew tomorrow. Review your subscription and billing info.`;
      } else {
        title = `${subscriptionName} renews in ${lead} days`;
        body = `Your ${subscriptionName} subscription will renew in ${lead} days. You have time to make changes if needed.`;
      }

      await resend.emails.send({
        from: process.env.RESEND_FROM!,
        to: user.email,
        subject: `🔔 ${title} - Needix`,
        html: generateReminderEmailHTML({
          userName,
          subscriptionName,
          daysUntilRenewal: lead,
          renewalDate: ymd,
          title,
          body
        }),
        text: generateReminderEmailText({
          userName,
          subscriptionName,
          daysUntilRenewal: lead,
          renewalDate: ymd,
          title,
          body
        })
      });

      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  const webPushConfigured = ensureWebPushConfigured();
  const emailConfigured = ensureEmailConfigured();
  
  if (!webPushConfigured && !emailConfigured) {
    return { processed: 0, warnings: ['No notification channels configured'] };
  }

  // Get snapshots directly from database
  const dbSnapshots = await prisma.reminderSnapshot.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      settings: true,
      subscriptions: true,
      tzOffsetMinutes: true,
    }
  });

  if (!dbSnapshots.length) return { processed: 0 };

  const now = Date.now();
  const windowMs = 30 * 60_000; // 30-minute window (more forgiving for daily cron)
  let sent = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const dbSnap of dbSnapshots) {
    // Parse settings
    let settings: SnapshotSettings;
    try {
      if (typeof dbSnap.settings === 'object' && dbSnap.settings !== null && 'enabled' in dbSnap.settings) {
        const rawSettings = dbSnap.settings as any;
        settings = {
          enabled: rawSettings.enabled || false,
          leadDays: rawSettings.leadDays || [],
          timeOfDay: rawSettings.timeOfDay || '09:00',
          channels: rawSettings.channels || []
        };
      } else {
        const parsed = JSON.parse(String(dbSnap.settings)) as any;
        settings = {
          enabled: parsed.enabled || false,
          leadDays: parsed.leadDays || [],
          timeOfDay: parsed.timeOfDay || '09:00',
          channels: parsed.channels || []
        };
      }
    } catch {
      console.error(`Failed to parse settings for snapshot ${dbSnap.id}`);
      continue;
    }

    // Parse items
    let items: SnapshotItem[];
    try {
      if (Array.isArray(dbSnap.subscriptions)) {
        items = (dbSnap.subscriptions as any[]).map(item => ({
          id: item.id || '',
          name: item.name || '',
          nextBillingDate: item.nextBillingDate,
          nextBillingAt: item.nextBillingAt
        }));
      } else {
        const parsed = JSON.parse(String(dbSnap.subscriptions)) as any[];
        items = parsed.map(item => ({
          id: item.id || '',
          name: item.name || '',
          nextBillingDate: item.nextBillingDate,
          nextBillingAt: item.nextBillingAt
        }));
      }
    } catch {
      console.error(`Failed to parse items for snapshot ${dbSnap.id}`);
      continue;
    }

    const leads = Array.from(new Set([0, ...(settings.leadDays || [])]))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .sort((a, b) => a - b);

    for (const item of items) {
      const billingDate = item.nextBillingDate || item.nextBillingAt;
      if (!billingDate) continue;
      
      for (const lead of leads) {
        const at = scheduledUtcMs(billingDate, settings.timeOfDay || '09:00', dbSnap.tzOffsetMinutes || 0, lead);
        
        if (now >= at && now <= at + windowMs) {
          const ymd = billingDate;
          
          if (await wasSent(dbSnap.id, ymd, lead)) continue;

          let pushSent = false;
          let emailSent = false;

          // Try push notification
          if (webPushConfigured) {
            try {
              const sub = await getSubscription(dbSnap.id);
              if (sub) {
                await webpush.sendNotification(sub.data, JSON.stringify({
                  title: 'Upcoming subscription renewal',
                  body: lead > 0 
                    ? `${item.name} renews in ${lead} day${lead === 1 ? '' : 's'} (${ymd})` 
                    : `${item.name} renews today (${ymd})`,
                  icon: '/icons/icon-192.png',
                  badge: '/icons/badge-72.png',
                  tag: 'subscription-reminder',
                  data: {
                    subscriptionId: item.id,
                    leadDays: lead,
                    url: '/dashboard'
                  }
                }));
                pushSent = true;
              }
            } catch (pushError) {
              errors.push(`Push failed for ${item.name}: ${String(pushError)}`);
            }
          }

          // Try email notification
          if (emailConfigured) {
            try {
              emailSent = await sendEmailNotification(dbSnap.userId, item, lead, ymd);
            } catch (emailError) {
              errors.push(`Email failed for ${item.name}: ${String(emailError)}`);
            }
          }

          // Mark as sent if at least one method succeeded
          if (pushSent || emailSent) {
            await markSent(dbSnap.id, ymd, lead);
            sent++;
            
            const methods = [];
            if (pushSent) methods.push('push');
            if (emailSent) methods.push('email');
            console.log(`Reminder sent via ${methods.join(' + ')} for ${item.name}`);
          } else {
            warnings.push(`Failed to send any notifications for ${item.name}`);
          }
        }
      }
    }
  }

  return { 
    processed: sent,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

// === WEEKLY DIGEST LOGIC ===
async function sendWeeklyDigests() {
  try {
    // Get users who have weekly digest enabled
    const usersWithDigest = await prisma.notificationSettings.findMany({
      where: { 
        weeklyDigest: true,
        enabled: true,
        channels: { contains: 'email' }
      },
      include: { user: true }
    });

    let sent = 0;
    const errors: string[] = [];

    for (const setting of usersWithDigest) {
      try {
        if (!setting.user.email) continue;

        // Get user's subscription summary for the week
        const subscriptions = await prisma.subscription.findMany({
          where: { userId: setting.userId },
          select: { name: true, amount: true, currency: true, nextBillingAt: true }
        });

        const totalMonthly = subscriptions.reduce((sum, sub) => {
          return sum + Number(sub.amount || 0);
        }, 0);

        await resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: setting.user.email,
          subject: `📊 Your Weekly Subscription Summary - Needix`,
          html: generateWeeklyDigestHTML({
            userName: setting.user.name || 'Needix User',
            subscriptionCount: subscriptions.length,
            totalMonthly: totalMonthly,
            subscriptions: subscriptions.slice(0, 5) // Top 5
          })
        });

        sent++;
      } catch (error) {
        errors.push(`Failed to send digest to ${setting.user.email}: ${String(error)}`);
      }
    }

    return { sent, errors: errors.length > 0 ? errors : undefined };
  } catch (error) {
    return { sent: 0, errors: [`Weekly digest failed: ${String(error)}`] };
  }
}

// === EMAIL TEMPLATE FUNCTIONS ===
function generateReminderEmailHTML(params: {
  userName: string;
  subscriptionName: string;
  daysUntilRenewal: number;
  renewalDate: string;
  title: string;
  body: string;
}) {
  const { userName, subscriptionName, daysUntilRenewal, renewalDate, title, body } = params;
  
  const urgencyColor = daysUntilRenewal <= 1 
    ? 'linear-gradient(135deg, #DC2626, #B91C1C)' 
    : daysUntilRenewal <= 3 
    ? 'linear-gradient(135deg, #F59E0B, #EF4444)' 
    : 'linear-gradient(135deg, #8B5CF6, #06B6D4)';

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    } catch { return dateString; }
  };

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: ${urgencyColor}; padding: 20px; border-radius: 16px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💰 Needix</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Subscription Reminder</p>
        </div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">${title}</h2>
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px;">Hi ${userName}! 👋</p>
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px;">${body}</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 16px;">📋 Subscription Details</h3>
          <p><strong>Service:</strong> ${subscriptionName}</p>
          <p><strong>Renewal Date:</strong> ${formatDate(renewalDate)}</p>
          <p><strong>Days Until Renewal:</strong> ${daysUntilRenewal === 0 ? 'TODAY' : daysUntilRenewal === 1 ? 'TOMORROW' : `${daysUntilRenewal} days`}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block;">Manage Subscription</a>
        </div>
      </div>
    </div>
  `;
}

function generateReminderEmailText(params: {
  userName: string;
  subscriptionName: string;
  daysUntilRenewal: number;
  renewalDate: string;
  title: string;
  body: string;
}) {
  const { userName, subscriptionName, daysUntilRenewal, renewalDate, title, body } = params;
  
  return `
${title}

Hi ${userName}!

${body}

SUBSCRIPTION DETAILS:
Service: ${subscriptionName}
Renewal Date: ${renewalDate}
Days Until Renewal: ${daysUntilRenewal === 0 ? 'TODAY' : daysUntilRenewal === 1 ? 'TOMORROW' : `${daysUntilRenewal} days`}

Manage Subscription: ${process.env.NEXTAUTH_URL}/dashboard
  `.trim();
}

function generateWeeklyDigestHTML(params: {
  userName: string;
  subscriptionCount: number;
  totalMonthly: number;
  subscriptions: any[];
}) {
  const { userName, subscriptionCount, totalMonthly } = params;
  
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); padding: 20px; border-radius: 16px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 Needix</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Weekly Summary</p>
        </div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px;">Your Weekly Subscription Summary</h2>
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px;">Hi ${userName}! 👋</p>
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px;">Here's your subscription overview for this week:</p>
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p><strong>Total Subscriptions:</strong> ${subscriptionCount}</p>
          <p><strong>Monthly Total:</strong> $${totalMonthly.toFixed(2)}</p>
          <p><strong>Annual Total:</strong> $${(totalMonthly * 12).toFixed(2)}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: linear-gradient(135deg, #8B5CF6, #06B6D4); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block;">View Dashboard</a>
        </div>
      </div>
    </div>
  `;
}

// Health check endpoint
export function GET() {
  return NextResponse.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "combined-notification-cron"
  });
}