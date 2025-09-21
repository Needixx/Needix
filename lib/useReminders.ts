// lib/useReminders.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

type PermissionState = NotificationPermission | "unsupported";

export type RemindersSettings = {
  enabled: boolean;
  leadDays: number[]; // e.g., [7,3,1]
  timeOfDay: string; // "HH:MM" 24h local time
};

// Basic subscription type to avoid imports
interface BasicSubscription {
  id: string;
  name: string;
  nextBillingDate?: string;
}

const SETTINGS_KEY = "needix.reminders.v1";
const SHOWN_KEY_PREFIX = "needix.reminders.shown";
const SCHEDULED_IDS_KEY = "needix.reminders.scheduled.v1";

const DEFAULT_SETTINGS: RemindersSettings = {
  enabled: false,
  leadDays: [3, 1],
  timeOfDay: "09:00",
};

function loadSettings(): RemindersSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed) {
        const p = parsed as Partial<RemindersSettings>;
        const leadDays =
          Array.isArray(p.leadDays) &&
          p.leadDays.every((n) => typeof n === "number")
            ? p.leadDays
            : [3, 1];
        return {
          enabled: Boolean(p.enabled),
          leadDays,
          timeOfDay: typeof p.timeOfDay === "string" ? p.timeOfDay : "09:00",
        };
      }
    }
  } catch {
    /* noop */
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(s: RemindersSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
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

// Helper function to parse date strings as local dates (avoiding timezone shifts)
function parseLocalDate(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2]!, 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  return new Date(year, month, day);
}

function parseTimeHM(time: string): { h: number; m: number } {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!m) return { h: 9, m: 0 };
  return { h: Number(m[1]), m: Number(m[2]) };
}

function daysUntil(date: Date): number {
  const t0 = todayLocalMidnight().getTime();
  const t1 = new Date(date).getTime();
  return Math.ceil((t1 - t0) / (24 * 60 * 60 * 1000));
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(h);
}

function loadScheduledIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SCHEDULED_IDS_KEY);
    if (raw) {
      const arr: unknown = JSON.parse(raw);
      if (Array.isArray(arr) && arr.every((n) => typeof n === "number")) {
        return new Set(arr);
      }
    }
  } catch {
    /* noop */
  }
  return new Set();
}

function saveScheduledIds(ids: Set<number>) {
  try {
    localStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* noop */
  }
}

function alreadyShown(
  subId: string,
  billingDate: string,
  leadDays: number,
): boolean {
  try {
    const key = `${SHOWN_KEY_PREFIX}.${subId}.${billingDate}.${leadDays}`;
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markShown(subId: string, billingDate: string, leadDays: number) {
  try {
    const key = `${SHOWN_KEY_PREFIX}.${subId}.${billingDate}.${leadDays}`;
    localStorage.setItem(key, "1");
  } catch {
    /* noop */
  }
}

function fireNotification(title: string, body: string) {
  try {
    new Notification(title, { body });
  } catch {
    /* noop */
  }
}

export function useReminders(items: BasicSubscription[]) {
  const [settings, setSettingsState] = useState<RemindersSettings>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<PermissionState>("default");
  const [lastTest, setLastTest] = useState<Date | null>(null);

  useEffect(() => {
    setSettingsState(loadSettings());
    if (isSupported()) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const setSettings = useCallback((s: RemindersSettings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch {
      return false;
    }
  }, []);

  const sendTest = useCallback(() => {
    if (!isSupported() || Notification.permission !== "granted") return;
    fireNotification("Test notification", "Your reminders are working!");
    setLastTest(new Date());
  }, []);

  const notifyNow = useCallback(
    (sub: BasicSubscription, leadDays: number) => {
      if (!settings.enabled || !isSupported() || Notification.permission !== "granted") return;
      if (!sub.nextBillingDate) return;
      
      const d = parseLocalDate(sub.nextBillingDate);
      const body =
        leadDays > 0
          ? `${sub.name} renews in ${leadDays} day${leadDays === 1 ? "" : "s"} (${d.toLocaleDateString()})`
          : `${sub.name} renews today (${d.toLocaleDateString()})`;
      fireNotification("Upcoming subscription renewal", body);
    },
    [settings.enabled],
  );

  const upcoming = useMemo(() => {
    if (!settings.enabled)
      return [] as { id: string; name: string; when: Date; lead: number }[];
    const out: { id: string; name: string; when: Date; lead: number }[] = [];
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 1);
    const { h, m } = parseTimeHM(settings.timeOfDay);
    for (const s of items) {
      if (!s.nextBillingDate) continue;
      const base = parseLocalDate(s.nextBillingDate);
      const leads = Array.from(new Set([0, ...settings.leadDays])).sort(
        (a, b) => a - b,
      );
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

  const syncNativeSchedules = useCallback(async () => {
    if (!isNative()) return;
    if (!settings.enabled) {
      const prev = loadScheduledIds();
      if (prev.size) {
        try {
          await LocalNotifications.cancel({
            notifications: Array.from(prev).map((id) => ({ id })),
          });
        } catch {
          /* noop */
        }
        saveScheduledIds(new Set());
      }
      return;
    }

    const desiredIds = new Set<number>();
    const toSchedule: { id: number; title: string; body: string; at: Date }[] =
      [];
    const now = new Date();

    const { h, m } = parseTimeHM(settings.timeOfDay);
    for (const s of items) {
      if (!s.nextBillingDate) continue;
      const base = parseLocalDate(s.nextBillingDate);
      const leads = Array.from(new Set([0, ...settings.leadDays])).sort(
        (a, b) => a - b,
      );
      for (const lead of leads) {
        const at = new Date(base);
        at.setDate(at.getDate() - lead);
        at.setHours(h, m, 0, 0);
        if (at <= now) continue;
        const key = `${s.id}|${s.nextBillingDate}|${lead}`;
        const id = hashId(key);
        desiredIds.add(id);
        toSchedule.push({
          id,
          title: "Upcoming subscription renewal",
          body:
            lead > 0
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
        await LocalNotifications.cancel({
          notifications: toCancel.map((id) => ({ id })),
        });
      }
      if (newOnes.length) {
        await LocalNotifications.schedule({
          notifications: newOnes.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            schedule: { at: n.at },
          })),
        });
      }
    } catch {
      /* noop */
    }

    saveScheduledIds(desiredIds);
  }, [items, settings.enabled, settings.leadDays, settings.timeOfDay]);

  const checkAndNotify = useCallback(() => {
    if (!settings.enabled) return;
    if (isNative()) {
      void syncNativeSchedules();
      return;
    }
    if (!isSupported() || Notification.permission !== "granted") return;

    const { h, m } = parseTimeHM(settings.timeOfDay);
    const now = new Date();
    for (const s of items) {
      if (!s.nextBillingDate) continue;
      const d = parseLocalDate(s.nextBillingDate);
      const diff = daysUntil(d);
      if (settings.leadDays.includes(diff) || diff === 0) {
        const scheduled = new Date(d);
        scheduled.setDate(scheduled.getDate() - diff);
        scheduled.setHours(h, m, 0, 0);
        if (now >= scheduled) {
          if (!alreadyShown(s.id, s.nextBillingDate, diff)) {
            const body =
              diff > 0
                ? `${s.name} renews in ${diff} day${diff === 1 ? "" : "s"} (${d.toLocaleDateString()})`
                : `${s.name} renews today (${d.toLocaleDateString()})`;
            fireNotification("Upcoming subscription renewal", body);
            markShown(s.id, s.nextBillingDate, diff);
          }
        }
      }
    }
  }, [items, settings.enabled, settings.leadDays, settings.timeOfDay, syncNativeSchedules]);

  useEffect(() => {
    checkAndNotify();
  }, [checkAndNotify]);

  useEffect(() => {
    if (!settings.enabled) return;
    const id = setInterval(() => {
      checkAndNotify();
    }, isNative() ? 6 * 60 * 60 * 1000 : 60 * 1000);
    return () => clearInterval(id);
  }, [settings.enabled, checkAndNotify]);

  const diagnostics = {
    supported: typeof window !== "undefined" ? isSupported() : false,
    native: isNative(),
    secure: typeof window !== "undefined" ? window.isSecureContext : false,
    permission,
    upcoming,
    lastTest,
  } as const;

  return {
    settings,
    setSettings,
    permission,
    requestPermission,
    sendTest,
    notifyNow,
    diagnostics,
  };
}