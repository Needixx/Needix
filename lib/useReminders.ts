"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Subscription } from "@/lib/types";

type PermissionState = NotificationPermission | "unsupported";

export type RemindersSettings = {
  enabled: boolean;
  leadDays: number[]; // e.g., [7,3,1]
  timeOfDay: string; // "HH:MM" 24h local time
};

const SETTINGS_KEY = "needix.reminders.v1";
const SHOWN_KEY_PREFIX = "needix.reminders.shown"; // needix.reminders.shown.<id>.<date>
const SCHEDULED_IDS_KEY = "needix.reminders.scheduled.v1"; // stores array of numeric IDs

const DEFAULT_SETTINGS: RemindersSettings = { enabled: false, leadDays: [3, 1], timeOfDay: "09:00" };

function loadSettings(): RemindersSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Backfill defaults if upgrading from older schema
      if (!parsed || typeof parsed !== 'object') throw new Error('bad');
      return {
        enabled: Boolean(parsed.enabled),
        leadDays: Array.isArray(parsed.leadDays) ? parsed.leadDays : [3, 1],
        timeOfDay: typeof parsed.timeOfDay === 'string' ? parsed.timeOfDay : '09:00',
      } as RemindersSettings;
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: RemindersSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

function isSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function todayLocalMidnight(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function parseLocalDateOnly(ymd: string): Date {
  return new Date(`${ymd}T00:00:00`);
}

function parseTimeHM(time: string): { h: number; m: number } {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!m) return { h: 9, m: 0 };
  return { h: Number(m[1]), m: Number(m[2]) };
}

function daysUntil(date: Date): number {
  const t0 = todayLocalMidnight().getTime();
  const t1 = new Date(date).getTime();
  return Math.round((t1 - t0) / 86400000);
}

function alreadyShown(subId: string, dateStr: string, lead: number): boolean {
  try {
    const key = `${SHOWN_KEY_PREFIX}.${subId}.${dateStr}.${lead}`;
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markShown(subId: string, dateStr: string, lead: number) {
  try {
    const key = `${SHOWN_KEY_PREFIX}.${subId}.${dateStr}.${lead}`;
    localStorage.setItem(key, "1");
  } catch {}
}

function fireNotification(title: string, body: string) {
  try {
    // Fallback if Notification not available
    if (!isSupported()) return;
    if (Notification.permission !== "granted") return;
    new Notification(title, { body });
  } catch {}
}

// Hash a string to a stable positive 31-bit int
function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 2147483647;
}

function loadScheduledIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SCHEDULED_IDS_KEY);
    if (raw) return new Set<number>(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveScheduledIds(ids: Set<number>) {
  try {
    localStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function useReminders(items: Subscription[]) {
  // Use SSR-stable default to avoid hydration mismatch; load actual saved settings on mount
  const [settings, setSettingsState] = useState<RemindersSettings>(DEFAULT_SETTINGS);
  // Initialize to a stable placeholder; compute real permission on client
  const [permission, setPermission] = useState<PermissionState>("default");

  // Keep permission state in sync on native
  useEffect(() => {
    // Load saved settings from localStorage after mount
    try {
      const saved = loadSettings();
      setSettingsState(saved);
    } catch {}

    // Only run on client
    if (typeof window === 'undefined') return;
    (async () => {
      try {
        if (isNative()) {
          const p = await LocalNotifications.checkPermissions();
          const mapped = p.display === "granted" ? "granted" : p.display === "denied" ? "denied" : "default";
          setPermission(mapped as PermissionState);
        } else if (isSupported()) {
          setPermission(Notification.permission);
        } else {
          setPermission("unsupported");
        }
      } catch {}
    })();
  }, []);

  const setSettings = useCallback((s: RemindersSettings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const requestPermission = useCallback(async () => {
    if (isNative()) {
      try {
        const res = await LocalNotifications.requestPermissions();
        const mapped = res.display === "granted" ? "granted" : res.display === "denied" ? "denied" : "default";
        setPermission(mapped as PermissionState);
        return mapped as PermissionState;
      } catch {
        return permission;
      }
    }
    if (!isSupported()) return "unsupported" as PermissionState;
    try {
      const p = await Notification.requestPermission();
      setPermission(p);
      return p;
    } catch {
      return Notification.permission;
    }
  }, [permission]);

  const [lastTest, setLastTest] = useState<{ ok: boolean; at: number } | null>(null);

  const sendTest = useCallback(async () => {
    // Try native first if running in app
    if (isNative()) {
      try {
        const res = await LocalNotifications.checkPermissions();
        if (res.display !== "granted") {
          await LocalNotifications.requestPermissions();
        }
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1_000_000),
              title: "Needix test notification",
              body: "If you see this, native notifications work!",
              schedule: { at: new Date(Date.now() + 1000) },
            },
          ],
        });
        setLastTest({ ok: true, at: Date.now() });
        return true;
      } catch {
        // fallthrough to web
      }
    }

    // Web fallback
    if (!isSupported()) return false;
    try {
      if (Notification.permission !== "granted") {
        const p = await Notification.requestPermission();
        if (p !== "granted") return false;
        setPermission(p);
      }
      new Notification("Needix test notification", { body: "If you see this, web notifications work!" });
      setLastTest({ ok: true, at: Date.now() });
      return true;
    } catch {
      setLastTest({ ok: false, at: Date.now() });
      return false;
    }
  }, []);

  const notifyNow = useCallback(async (title: string, body: string) => {
    if (isNative()) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            { id: Math.floor(Math.random() * 1_000_000), title, body, schedule: { at: new Date(Date.now() + 500) } },
          ],
        });
        setLastTest({ ok: true, at: Date.now() });
        return true;
      } catch {}
    }
    if (!isSupported()) return false;
    try {
      if (Notification.permission !== "granted") {
        const p = await Notification.requestPermission();
        if (p !== "granted") return false;
        setPermission(p);
      }
      new Notification(title, { body });
      setLastTest({ ok: true, at: Date.now() });
      return true;
    } catch {
      setLastTest({ ok: false, at: Date.now() });
      return false;
    }
  }, []);

  const upcoming = useMemo(() => {
    if (!settings.enabled) return [] as { id: string; name: string; when: Date; lead: number }[];
    const out: { id: string; name: string; when: Date; lead: number }[] = [];
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 1); // next 24h window
    const { h, m } = parseTimeHM(settings.timeOfDay);
    for (const s of items) {
      if (!s.nextBillingDate) continue;
      const base = parseLocalDateOnly(s.nextBillingDate);
      const leads = Array.from(new Set([0, ...settings.leadDays])).sort((a, b) => a - b);
      for (const lead of leads) {
        const at = new Date(base);
        at.setDate(at.getDate() - lead);
        at.setHours(h, m, 0, 0);
        if (at >= now && at <= end) {
          out.push({ id: s.id, name: s.name, when: at, lead });
        }
      }
    }
    return out.sort((a, b) => a.when.getTime() - b.when.getTime());
  }, [items, settings.enabled, settings.leadDays, settings.timeOfDay]);

  // Native: schedule/cancel local notifications to match items/settings
  const syncNativeSchedules = useCallback(async () => {
    if (!isNative()) return;
    if (!settings.enabled) {
      // If disabled, cancel previously scheduled Needix notifications
      const prev = loadScheduledIds();
      if (prev.size) {
        try {
          await LocalNotifications.cancel({ notifications: Array.from(prev).map((id) => ({ id })) });
        } catch {}
        saveScheduledIds(new Set());
      }
      return;
    }

    // Build desired schedule ids and notifications
    const desiredIds = new Set<number>();
    const toSchedule: { id: number; title: string; body: string; at: Date }[] = [];
    const now = new Date();

    const { h, m } = parseTimeHM(settings.timeOfDay);
    for (const s of items) {
      if (!s.nextBillingDate) continue;
      const base = parseLocalDateOnly(s.nextBillingDate);
      // include day-of (0) as well as leadDays
      const leads = Array.from(new Set([0, ...settings.leadDays])).sort((a, b) => a - b);
      for (const lead of leads) {
        const at = new Date(base);
        at.setDate(at.getDate() - lead);
        // Send at configured local time
        at.setHours(h, m, 0, 0);
        if (at <= now) continue; // don't schedule past times
        const key = `${s.id}|${s.nextBillingDate}|${lead}`;
        const id = hashId(key);
        desiredIds.add(id);
        toSchedule.push({
          id,
          title: "Upcoming subscription renewal",
          body: lead > 0
            ? `${s.name} renews in ${lead} day${lead === 1 ? "" : "s"} (${base.toLocaleDateString()})`
            : `${s.name} renews today (${base.toLocaleDateString()})`,
          at,
        });
      }
    }

    const prev = loadScheduledIds();
    const toCancel = Array.from(prev).filter((id) => !desiredIds.has(id));
    const newOnes = toSchedule.filter((n) => !prev.has(n.id));

    try {
      if (toCancel.length) {
        await LocalNotifications.cancel({ notifications: toCancel.map((id) => ({ id })) });
      }
      if (newOnes.length) {
        await LocalNotifications.schedule({
          notifications: newOnes.map((n) => ({ id: n.id, title: n.title, body: n.body, schedule: { at: n.at } })),
        });
      }
    } catch {}

    saveScheduledIds(desiredIds);
  }, [items, settings.enabled, settings.leadDays, settings.timeOfDay]);

  const checkAndNotify = useCallback(() => {
    if (!settings.enabled) return;
    if (isNative()) {
      // Native devices: ensure schedules are up to date
      syncNativeSchedules();
      return;
    }
    if (!isSupported() || Notification.permission !== "granted") return;

    const { h, m } = parseTimeHM(settings.timeOfDay);
    const now = new Date();
    for (const s of items) {
      if (!s.nextBillingDate) continue;
      const d = parseLocalDateOnly(s.nextBillingDate);
      const diff = daysUntil(d);
      if (settings.leadDays.includes(diff) || diff === 0) {
        // Only fire after scheduled time today
        const scheduled = new Date(d);
        scheduled.setDate(scheduled.getDate() - diff);
        scheduled.setHours(h, m, 0, 0);
        if (now >= scheduled) {
          if (!alreadyShown(s.id, s.nextBillingDate, diff)) {
            const body = diff > 0
              ? `${s.name} renews in ${diff} day${diff === 1 ? "" : "s"} (${d.toLocaleDateString()})`
              : `${s.name} renews today (${d.toLocaleDateString()})`;
            fireNotification("Upcoming subscription renewal", body);
            markShown(s.id, s.nextBillingDate, diff);
          }
        }
      }
    }
  }, [items, settings.enabled, settings.leadDays, settings.timeOfDay, syncNativeSchedules]);

  // Re-run when items or settings change
  useEffect(() => {
    checkAndNotify();
  }, [checkAndNotify]);

  // Periodic check (every 1 minute for web, 6 hours for native resync)
  useEffect(() => {
    if (!settings.enabled) return;
    const id = setInterval(checkAndNotify, isNative() ? 6 * 60 * 60 * 1000 : 60 * 1000);
    return () => clearInterval(id);
  }, [settings.enabled, checkAndNotify]);

  const diagnostics = {
    supported: typeof window !== 'undefined' ? isSupported() : false,
    native: isNative(),
    secure: typeof window !== 'undefined' ? window.isSecureContext : false,
    permission,
    upcoming,
    lastTest,
  } as const;

  return { settings, setSettings, permission, requestPermission, sendTest, notifyNow, diagnostics };
}
