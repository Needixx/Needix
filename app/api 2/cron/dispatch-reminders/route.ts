// app/api/cron/dispatch-reminders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

// Configure for static export compatibility
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// Type definitions to match the actual database structure
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

// Define the snapshot type that matches what we get from serverStore
interface StoredSnapshot {
  id: string;
  userId: string;
  settings: SnapshotSettings | any; // Allow flexible parsing
  items: SnapshotItem[] | any; // Allow flexible parsing
  tzOffsetMinutes: number;
}

// Use dynamic imports to avoid edge runtime issues
async function dispatchReminders() {
  try {
    // Dynamic imports for server-side modules
    const webpush = require('web-push');
    const { listSnapshots, getSubscription, wasSent, markSent } = await import('@/lib/serverStore');

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
        if (!ensureEmailConfigured()) {
          console.log('Email not configured - skipping email notification');
          return false;
        }

        // Get user details from database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true }
        });

        if (!user?.email) {
          console.log(`No email found for user ${userId}`);
          return false;
        }

        // Check if user has email notifications enabled
        const notificationSettings = await prisma.notificationSettings.findUnique({
          where: { userId },
        });

        const hasEmailEnabled = notificationSettings?.channels?.includes('email') || false;
        if (!hasEmailEnabled) {
          console.log(`Email notifications disabled for user ${userId}`);
          return false;
        }

        const userName = user.name || 'Needix User';
        const subscriptionName = item.name || 'Your subscription';
        
        let title: string;
        let body: string;
        
        if (lead === 0) {
          title = `${subscriptionName} renews TODAY`;
          body = `Your ${subscriptionName} subscription renews today. Make sure your payment method is up to date to avoid any service interruptions.`;
        } else if (lead === 1) {
          title = `${subscriptionName} renews TOMORROW`;
          body = `Your ${subscriptionName} subscription will renew tomorrow. This is a friendly reminder to review your subscription and ensure your billing information is current.`;
        } else {
          title = `${subscriptionName} renews in ${lead} days`;
          body = `Your ${subscriptionName} subscription will renew in ${lead} days. You have time to make any changes or cancel if needed.`;
        }

        // Send email using Resend
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

        console.log(`Email reminder sent to ${user.email} for ${subscriptionName}`);
        return true;
      } catch (error) {
        console.error('Failed to send email notification:', error);
        return false;
      }
    }

    const webPushConfigured = ensureWebPushConfigured();
    const emailConfigured = ensureEmailConfigured();
    
    if (!webPushConfigured && !emailConfigured) {
      console.log('Neither web push nor email configured - no reminders sent');
      return { ok: true, processed: 0, warnings: ['No notification channels configured'] };
    }

    const dbSnapshots = await prisma.reminderSnapshot.findMany({
      where: { isActive: true },
      select: {
        id: true,
        userId: true,
        settings: true,
        subscriptions: true, // This is the items array
        tzOffsetMinutes: true,
      }
    });

    if (!dbSnapshots.length) return { ok: true, processed: 0 };

    const now = Date.now();
    const windowMs = 5 * 60_000; // 5-minute window
    let sent = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    return { 
      ok: true, 
      processed: sent,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      capabilities: {
        webPush: webPushConfigured,
        email: emailConfigured
      }
    };
  } catch (e: unknown) {
    const errorMessage = String((e as Error)?.message || e);
    console.error('Cron dispatch failed:', errorMessage);
    throw new Error(`Cron failed: ${errorMessage}`);
  }
}

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
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="background: ${urgencyColor}; padding: 20px; border-radius: 16px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">💰 Needix</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 5px 0 0 0; font-size: 14px;">Subscription Reminder</p>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">${title}</h2>
        
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
          Hi ${userName}! 👋
        </p>
        
        <p style="color: #475569; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
          ${body}
        </p>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📋 Subscription Details</h3>
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Service:</td>
              <td style="color: #1e293b; padding: 4px 0; font-weight: 600;">${subscriptionName}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Renewal Date:</td>
              <td style="color: #1e293b; padding: 4px 0; font-weight: 600;">${formatDate(renewalDate)}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0; font-weight: 500;">Days Until Renewal:</td>
              <td style="color: ${daysUntilRenewal <= 1 ? '#dc2626' : daysUntilRenewal <= 3 ? '#f59e0b' : '#16a34a'}; padding: 4px 0; font-weight: 600;">
                ${daysUntilRenewal === 0 ? 'TODAY' : daysUntilRenewal === 1 ? 'TOMORROW' : `${daysUntilRenewal} days`}
              </td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" 
             style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block;">
            Manage Subscription
          </a>
        </div>
      </div>

      <div style="text-align: center; color: #64748b; font-size: 14px;">
        <p style="margin: 0 0 8px 0;">
          This reminder was sent from your Needix account.
        </p>
        <p style="margin: 0;">
          <a href="${process.env.NEXTAUTH_URL}/settings" style="color: #0284c7; text-decoration: none;">Manage Notifications</a> | 
          <a href="${process.env.NEXTAUTH_URL}/privacy" style="color: #0284c7; text-decoration: none;">Privacy Policy</a>
        </p>
        <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">
          Needix • Never miss a subscription renewal again
        </p>
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
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return `
${title}

Hi ${userName}!

${body}

SUBSCRIPTION DETAILS:
Service: ${subscriptionName}
Renewal Date: ${formatDate(renewalDate)}
Days Until Renewal: ${daysUntilRenewal === 0 ? 'TODAY' : daysUntilRenewal === 1 ? 'TOMORROW' : `${daysUntilRenewal} days`}

Manage Subscription: ${process.env.NEXTAUTH_URL}/dashboard

---
This reminder was sent from your Needix account.
Manage Notifications: ${process.env.NEXTAUTH_URL}/settings
Privacy Policy: ${process.env.NEXTAUTH_URL}/privacy

Needix • Never miss a subscription renewal again
  `.trim();
}

export async function GET() {
  try {
    const result = await dispatchReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Dispatch reminders error:', error);
    return NextResponse.json(
      { error: 'Cron failed', details: String(error) }, 
      { status: 500 }
    );
  }
}