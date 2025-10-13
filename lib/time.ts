// lib/time.ts
import { DateTime } from "luxon";

/** Safe parser for "HH:MM" -> {h, m} */
function parseHHMM(hhmm: string): { h: number; m: number } {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error("Invalid HH:MM");
  return { h, m };
}

/**
 * Combine a local calendar date (YYYY-MM-DD) and "HH:MM" time in a given IANA zone
 * and return the UTC ISO string for scheduling.
 */
export function dateAndTimeInZoneToUTCISO(dateYYYYMMDD: string, hhmm: string, zone: string): string {
  const { h, m } = parseHHMM(hhmm);
  const local = DateTime.fromISO(`${dateYYYYMMDD}T00:00:00`, { zone }).set({ hour: h, minute: m, second: 0, millisecond: 0 });
  if (!local.isValid) throw new Error("Invalid local date/time or zone");
  return local.toUTC().toISO();
}

export function nowUTCISO(): string {
  return DateTime.utc().toISO();
}
