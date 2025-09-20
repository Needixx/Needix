import { NextResponse } from 'next/server';
import { listSnapshots, getSubscription, wasSent, markSent } from '@/lib/serverStore';
import webpush from 'web-push';
import type { PushSubscription as WPPushSubscription } from 'web-push';

function ensureWebPushConfigured() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@needix.app';
  if (!publicKey || !privateKey) throw new Error('Missing VAPID keys');
  webpush.setVapidDetails(subject, publicKey, privateKey);
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

export async function GET() {
  try {
    ensureWebPushConfigured();
    const snaps = await listSnapshots();
    if (!snaps.length) return NextResponse.json({ ok: true, processed: 0 });

    const now = Date.now();
    const windowMs = 5 * 60_000;
    let sent = 0;

    for (const snap of snaps) {
      const leads = Array.from(new Set([0, ...(snap.settings.leadDays || [])]))
        .filter((n) => Number.isFinite(n) && n >= 0)
        .sort((a, b) => a - b);

      for (const item of snap.items) {
        if (!item.nextBillingDate) continue;
        for (const lead of leads) {
          const at = scheduledUtcMs(item.nextBillingDate, snap.settings.timeOfDay || '09:00', snap.tzOffsetMinutes || 0, lead);
          if (now >= at && now <= at + windowMs) {
            const ymd = item.nextBillingDate;
            if (await wasSent(snap.id, ymd, lead)) continue;
            const sub = await getSubscription(snap.id);
            if (!sub) continue;
            try {
              await webpush.sendNotification(sub.data as WPPushSubscription, JSON.stringify({
                title: 'Upcoming subscription renewal',
                body: lead > 0 ? `${item.name} renews in ${lead} day${lead === 1 ? '' : 's'} (${ymd})` : `${item.name} renews today (${ymd})`,
              }));
              await markSent(snap.id, ymd, lead);
              sent++;
            } catch {
              // ignore per-sub errors
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true, processed: sent });
  } catch (e: unknown) {
    return NextResponse.json({ error: 'Cron failed', details: String((e as Error)?.message || e) }, { status: 500 });
  }
}
