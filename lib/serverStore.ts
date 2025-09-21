import crypto from "crypto";
import type { Subscription } from "@/lib/types";

type KVClient = {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
};

function hashId(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 16);
}

function kvAvailable(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

let kv: KVClient | null = null;

async function getKV(): Promise<KVClient> {
  if (kv) return kv;
  if (!kvAvailable()) throw new Error("KV not configured");
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  kv = {
    async get<T = unknown>(key: string): Promise<T | null> {
      const res = await redis.get(key);
      return (res as T) ?? null;
    },
    async set(key, value, opts) {
      const options = opts?.ex ? ({ ex: opts.ex } as { ex: number }) : undefined;
      await (redis as unknown as { set: (k: string, v: unknown, o?: { ex?: number }) => Promise<unknown> }).set(
        key,
        value,
        options,
      );
    },
    async del(key) {
      await redis.del(key);
    },
    async sadd(key, member) {
      await redis.sadd(key, member);
    },
    async smembers(key) {
      return (await redis.smembers(key)) as unknown as string[];
    },
  };
  return kv;
}

export type PushSubscriptionRecord = {
  id: string; // hash of endpoint
  endpoint: string;
  data: unknown; // full PushSubscription JSON
  userEmail?: string | null;
  createdAt: number;
  updatedAt: number;
};

export type ReminderSnapshot = {
  id: string; // same as subscription id
  userEmail?: string | null;
  tzOffsetMinutes: number; // user's local timezone offset in minutes
  settings: { leadDays: number[]; timeOfDay: string };
  items: { id: string; name: string; nextBillingDate?: string }[];
  updatedAt: number;
};

const SET_SUBS = "needix:push:subs";
const SET_SNAPS = "needix:reminder:snaps";
const KEY_SUB = (id: string) => `needix:push:sub:${id}`;
const KEY_SNAP = (id: string) => `needix:reminder:snap:${id}`;
const KEY_SENT = (id: string, ymd: string, lead: number) => `needix:lastsent:${id}:${ymd}:${lead}`;
const KEY_USER_SUBS = (email: string) => `needix:user:subs:${email}`;

export function makeSubId(endpoint: string): string {
  return hashId(endpoint);
}

export async function saveSubscription(
  record: Omit<PushSubscriptionRecord, "id" | "createdAt" | "updatedAt"> & { id?: string },
) {
  if (!kvAvailable()) return;
  const store = await getKV();
  const id = record.id ?? makeSubId(record.endpoint);
  const now = Date.now();
  const rec: PushSubscriptionRecord = {
    id,
    endpoint: record.endpoint,
    data: record.data,
    userEmail: record.userEmail ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await store.set(KEY_SUB(id), rec);
  await store.sadd(SET_SUBS, id);
}

export async function saveSnapshot(snap: ReminderSnapshot) {
  if (!kvAvailable()) return;
  const store = await getKV();
  const copy: ReminderSnapshot = { ...snap, updatedAt: Date.now() };
  await store.set(KEY_SNAP(copy.id), copy);
  await store.sadd(SET_SNAPS, copy.id);
}

export async function listSnapshots(): Promise<ReminderSnapshot[]> {
  if (!kvAvailable()) return [];
  const store = await getKV();
  const ids = await store.smembers(SET_SNAPS);
  const results: ReminderSnapshot[] = [];
  for (const id of ids) {
    const s = await store.get<ReminderSnapshot>(KEY_SNAP(id));
    if (s) results.push(s);
  }
  return results;
}

export async function getSubscription(id: string): Promise<PushSubscriptionRecord | null> {
  if (!kvAvailable()) return null;
  const store = await getKV();
  return (await store.get<PushSubscriptionRecord>(KEY_SUB(id))) || null;
}

export async function markSent(id: string, ymd: string, lead: number) {
  if (!kvAvailable()) return;
  const store = await getKV();
  await store.set(KEY_SENT(id, ymd, lead), 1, { ex: 60 * 60 * 24 * 7 });
}

export async function wasSent(id: string, ymd: string, lead: number): Promise<boolean> {
  if (!kvAvailable()) return false;
  const store = await getKV();
  const val = await store.get<number>(KEY_SENT(id, ymd, lead));
  return !!val;
}

export function kvConfigured(): boolean {
  return kvAvailable();
}

export async function saveUserSubscriptions(email: string, items: Subscription[]) {
  if (!kvAvailable()) return;
  const store = await getKV();
  await store.set(KEY_USER_SUBS(email), { items, updatedAt: Date.now() });
}

export async function loadUserSubscriptions(email: string): Promise<Subscription[] | null> {
  if (!kvAvailable()) return null;
  const store = await getKV();
  const data = await store.get<{ items: Subscription[] }>(KEY_USER_SUBS(email));
  return data?.items ?? null;
}
