// app/api/cron/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import { dateAndTimeInZoneToUTCISO } from '@/lib/time'; // uses Luxon under the hood
import { DateTime, Settings } from 'luxon';
import { getEffectiveZone } from '@/lib/effectiveZone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------- Types ----------
interface SnapshotItem {
  id: string;
  name: string;
  nextBillingDate?: string; // "YYYY-MM-DD"
  nextBillingAt?: string;   // ISO string
}

interface SnapshotSettings {
  enabled: boolean;
  leadDays: number[];
  timeOfDay: string;     // "HH:MM"
  channels: string[];    // ["web","email","mobile"]
  zone?: string | null;  // IANA timezone, e.g. "America/Denver"
}

// ---------- Entry ----------
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      reminderDispatches: 0,
      generalNotifications: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // PART 1: Reminders
    try {
      const reminderResult = await dispatchReminders();
      results.reminderDispatches = reminderResult.processed;
      if (reminderResult.errors) results.errors.push(...reminderResult.errors);
      if (reminderResult.warnings) results.warnings.push(...reminderResult.warnings);
    } catch (err) {
      results.errors.push(`Reminder dispatch failed: ${String(err)}`);
    }

    // PART 2: Weekly digests (Sun @ 09:00 UTC; adjust if you want local)
    try {
      const now = DateTime.utc();
      const isWeekly = now.weekday === 7 && now.hour === 9;
      if (isWeekly) {
        const digestResult = await sendWeeklyDigests();
        results.generalNotifications = digestResult.sent;
        if (digestResult.errors) results.errors.push(...digestResult.errors);
      }
    } catch (err) {
      results.errors.push(`Weekly digest failed: ${String(err)}`);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process notifications', details: String(error) },
      { status: 500 }
    );
  }
}

// ---------- Reminder dispatch core (DST-safe with IANA zones) ----------
async function dispatchReminders() {
  const webpush = require('web-push') as typeof import('web-push');
  const { getSubscription, wasSent, markSent } = await import('@/lib/serverStore');

  function ensureWebPushConfigured() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@needix.app';
    if (!publicKey || !privateKey) return false;
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  }

  const webPushConfigured = ensureWebPushConfigured();
  const emailConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  if (!webPushConfigured && !emailConfigured) {
    return { processed: 0, warnings: ['No notification channels configured'] };
  }

  // Pull active snapshots
  const dbSnapshots = await prisma.reminderSnapshot.findMany({
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      settings: true,
      subscriptions: true,
      tzOffsetMinutes: true, // legacy fallback
    },
  });

  if (!dbSnapshots.length) return { processed: 0 };

  const nowMs = Date.now();
  const windowMs = 30 * 60_000; // 30-minute window
  let sent = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const snap of dbSnapshots) {
    // Parse settings + items
    const settings = coerceSettings(snap.settings);
    const items = coerceItems(snap.subscriptions);

    // Get zone from settings (preferred), else derive effective zone, else fallback to legacy offset flow
    let zone = settings.zone;
    if (!zone || typeof zone !== 'string' || !zone.includes('/')) {
      // derive (reads User.timezone -> tz cookie -> UTC)
      zone = await getEffectiveZone(snap.userId);
    }

    const leads = Array.from(new Set([0, ...(settings.leadDays || [])]))
      .filter((n) => Number.isFinite(n) && n >= 0)
      .sort((a, b) => a - b);

    for (const item of items) {
      const billingYMD = normalizeBillingDate(item.nextBillingDate, item.nextBillingAt);
      if (!billingYMD) continue;

      for (const lead of leads) {
        // Compute the target local calendar date (billing minus lead)
        const localBilling = DateTime.fromISO(`${billingYMD}T00:00:00`, { zone: 'utc' });
        const reminderLocalYMD = localBilling.minus({ days: lead }).toISODate(); // YYYY-MM-DD
        if (!reminderLocalYMD) continue;

        // Convert local date + time in IANA zone → UTC
        let atMs: number | null = null;
        if (zone && zone.includes('/')) {
          try {
            const utcISO = dateAndTimeInZoneToUTCISO(reminderLocalYMD, settings.timeOfDay || '09:00', zone);
            atMs = DateTime.fromISO(utcISO, { zone: 'utc' }).toMillis();
          } catch {
            // If zone conversion fails, fallback to legacy offset math
          }
        }
        if (atMs === null) {
          // Legacy fallback with tzOffsetMinutes (pre-zone behavior)
          atMs = legacyScheduledUtcMs(
            billingYMD,
            settings.timeOfDay || '09:00',
            snap.tzOffsetMinutes || 0,
            lead
          );
        }

        // Fire within window, once
        if (nowMs >= atMs && nowMs <= atMs + windowMs) {
          if (await wasSent(snap.id, billingYMD, lead)) continue;

          let pushSent = false;
          let emailSent = false;
          const title = lead === 0
            ? `${item.name} renews TODAY`
            : lead === 1
              ? `${item.name} renews TOMORROW`
              : `${item.name} renews in ${lead} days`;
          const body = lead === 0
            ? `Your ${item.name} subscription renews today.`
            : lead === 1
              ? `Your ${item.name} subscription renews tomorrow.`
              : `Your ${item.name} subscription will renew in ${lead} days.`;

          // Push
          if (webPushConfigured) {
            try {
              const sub = await getSubscription(snap.id);
              if (sub) {
                await webpush.sendNotification(
                  sub.data,
                  JSON.stringify({
                    title: 'Upcoming subscription renewal',
                    body: lead > 0
                      ? `${item.name} renews in ${lead} day${lead === 1 ? '' : 's'} (${billingYMD})`
                      : `${item.name} renews today (${billingYMD})`,
                    icon: '/icons/icon-192.png',
                    badge: '/icons/badge-72.png',
                    tag: 'subscription-reminder',
                    data: { subscriptionId: item.id, leadDays: lead, url: '/dashboard' },
                  })
                );
                pushSent = true;
              }
            } catch (err) {
              errors.push(`Push failed for ${item.name}: ${String(err)}`);
            }
          }

          // Email
          if (emailConfigured) {
            try {
              emailSent = await sendEmailNotification(snap.userId, item, lead, billingYMD);
            } catch (err) {
              errors.push(`Email failed for ${item.name}: ${String(err)}`);
            }
          }

          if (pushSent || emailSent) {
            await markSent(snap.id, billingYMD, lead);
            sent++;
          } else {
            warnings.push(`No channel delivered for ${item.name}`);
          }
        }
      }
    }
  }

  return {
    processed: sent,
    errors: errors.length ? errors : undefined,
    warnings: warnings.length ? warnings : undefined,
  };
}

// ---------- Helpers ----------
function coerceSettings(raw: any): SnapshotSettings {
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      enabled: !!s?.enabled,
      leadDays: Array.isArray(s?.leadDays) ? s.leadDays : [],
      timeOfDay: typeof s?.timeOfDay === 'string' ? s.timeOfDay : '09:00',
      channels: Array.isArray(s?.channels) ? s.channels : [],
      zone: typeof s?.zone === 'string' ? s.zone : null,
    };
  } catch {
    return { enabled: false, leadDays: [], timeOfDay: '09:00', channels: [], zone: null };
  }
}

function coerceItems(raw: any): SnapshotItem[] {
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(String(raw));
    return arr.map((i: any) => ({
      id: String(i?.id ?? ''),
      name: String(i?.name ?? ''),
      nextBillingDate: i?.nextBillingDate ?? undefined,
      nextBillingAt: i?.nextBillingAt ?? undefined,
    }));
  } catch {
    return [];
  }
}

function normalizeBillingDate(nextBillingDate?: string, nextBillingAt?: string): string | null {
  if (nextBillingDate) return nextBillingDate; // "YYYY-MM-DD"
  if (nextBillingAt) return new Date(nextBillingAt).toISOString().slice(0, 10);
  return null;
}

// Legacy offset-based scheduler (kept as fallback)
function legacyScheduledUtcMs(ymd: string, timeHHMM: string, tzOffsetMinutes: number, lead: number) {
  const [y, m, d] = ymd.split('-').map((x) => Number(x));
  const [hh, mm] = timeHHMM.split(':').map((x) => Number(x));
  const date = new Date(Date.UTC(y, (m - 1), d, hh, mm));
  date.setUTCDate(date.getUTCDate() - lead);
  return date.getTime() - tzOffsetMinutes * 60_000;
}

// ---------- Email + weekly digest ----------
async function sendEmailNotification(userId: string, item: SnapshotItem, lead: number, ymd: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return false;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
  if (!user?.email) return false;

  const settings = await prisma.notificationSettings.findUnique({ where: { userId } });
  const hasEmailEnabled = settings?.channels?.includes('email') || false;
  if (!hasEmailEnabled) return false;

  const userName = user.name || 'Needix User';
  const title = lead === 0
    ? `${item.name} renews TODAY`
    : lead === 1
      ? `${item.name} renews TOMORROW`
      : `${item.name} renews in ${lead} days`;
  const body = lead === 0
    ? `Your ${item.name} subscription renews today. Make sure your payment method is up to date.`
    : lead === 1
      ? `Your ${item.name} subscription will renew tomorrow. Review your subscription and billing info.`
      : `Your ${item.name} subscription will renew in ${lead} days. You have time to make changes if needed.`;

  await resend.emails.send({
    from: process.env.RESEND_FROM!,
    to: user.email,
    subject: `🔔 ${title} - Needix`,
    html: generateReminderEmailHTML({
      userName, subscriptionName: item.name, daysUntilRenewal: lead, renewalDate: ymd, title, body
    }),
    text: generateReminderEmailText({
      userName, subscriptionName: item.name, daysUntilRenewal: lead, renewalDate: ymd, title, body
    }),
  });
  return true;
}

async function sendWeeklyDigests() {
  try {
    const usersWithDigest = await prisma.notificationSettings.findMany({
      where: { weeklyDigest: true, enabled: true, channels: { contains: 'email' } },
      include: { user: true },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const setting of usersWithDigest) {
      try {
        if (!setting.user.email) continue;

        const subs = await prisma.subscription.findMany({
          where: { userId: setting.userId },
          select: { name: true, amount: true, currency: true, nextBillingAt: true }
        });

        const totalMonthly = subs.reduce((sum, s) => sum + Number(s.amount || 0), 0);

        await resend.emails.send({
          from: process.env.RESEND_FROM!,
          to: setting.user.email,
          subject: `📊 Your Weekly Subscription Summary - Needix`,
          html: generateWeeklyDigestHTML({
            userName: setting.user.name || 'Needix User',
            subscriptionCount: subs.length,
            totalMonthly,
            subscriptions: subs.slice(0, 5),
          }),
        });
        sent++;
      } catch (err) {
        errors.push(`Digest to ${setting.user.email} failed: ${String(err)}`);
      }
    }
    return { sent, errors: errors.length ? errors : undefined };
  } catch (err) {
    return { sent: 0, errors: [`Weekly digest failed: ${String(err)}`] };
  }
}

function generateReminderEmailHTML(params: {
  userName: string; subscriptionName: string; daysUntilRenewal: number; renewalDate: string; title: string; body: string;
}) {
  const { userName, subscriptionName, daysUntilRenewal, renewalDate, title, body } = params;
  const urgency = daysUntilRenewal <= 1 ? '#DC2626' : daysUntilRenewal <= 3 ? '#F59E0B' : '#8B5CF6';
  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `
    <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; max-width:600px; margin:0 auto; padding:20px;">
      <div style="background:${urgency};color:white;padding:16px;border-radius:12px;margin-bottom:16px">
        <strong>💰 Needix</strong>
      </div>
      <h2 style="margin:0 0 12px 0;">${title}</h2>
      <p>Hi ${userName}! 👋</p>
      <p>${body}</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px">
        <p><strong>Service:</strong> ${subscriptionName}</p>
        <p><strong>Renewal Date:</strong> ${formatDate(renewalDate)}</p>
        <p><strong>Days Until Renewal:</strong> ${daysUntilRenewal === 0 ? 'TODAY' : daysUntilRenewal === 1 ? 'TOMORROW' : `${daysUntilRenewal} days`}</p>
      </div>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard">Manage Subscription</a></p>
    </div>
  `;
}

function generateReminderEmailText(params: {
  userName: string; subscriptionName: string; daysUntilRenewal: number; renewalDate: string; title: string; body: string;
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
  userName: string; subscriptionCount: number; totalMonthly: number; subscriptions: any[];
}) {
  const { userName, subscriptionCount, totalMonthly } = params;
  return `
    <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; max-width:600px; margin:0 auto; padding:20px;">
      <div style="background:linear-gradient(135deg,#8B5CF6,#06B6D4);color:white;padding:16px;border-radius:12px;margin-bottom:16px">
        <strong>📊 Needix</strong>
      </div>
      <h2>Your Weekly Subscription Summary</h2>
      <p>Hi ${userName}! 👋</p>
      <p>Total Subscriptions: <strong>${subscriptionCount}</strong></p>
      <p>Monthly Total: <strong>$${totalMonthly.toFixed(2)}</strong></p>
      <p>Annual Total: <strong>$${(totalMonthly * 12).toFixed(2)}</strong></p>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard">View Dashboard</a></p>
    </div>
  `;
}

// Health check
export function GET() {
  return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'combined-notification-cron' });
}
