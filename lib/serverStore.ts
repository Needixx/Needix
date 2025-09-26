// lib/serverStore.ts
import { Redis } from '@upstash/redis';

// Initialize Redis client if environment variables are available
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Redis not configured or unavailable:', error);
}

type SnapshotItem = {
  name: string;
  nextBillingDate: string | null;
};

type SnapshotSettings = {
  leadDays: number[];
  timeOfDay: string;
};

type Snapshot = {
  id: string;
  items: SnapshotItem[];
  settings: SnapshotSettings;
  tzOffsetMinutes: number;
};

type StoredSubscription = {
  data: any; // PushSubscription data
};

export async function listSnapshots(): Promise<Snapshot[]> {
  if (!redis) {
    console.warn('Redis not available, returning empty snapshots');
    return [];
  }

  try {
    const keys = await redis.keys('snapshot:*');
    const snapshots: Snapshot[] = [];

    for (const key of keys) {
      const snapshot = await redis.get(key);
      if (snapshot && typeof snapshot === 'object') {
        snapshots.push(snapshot as Snapshot);
      }
    }

    return snapshots;
  } catch (error) {
    console.error('Error listing snapshots:', error);
    return [];
  }
}

export async function getSubscription(snapshotId: string): Promise<StoredSubscription | null> {
  if (!redis) {
    console.warn('Redis not available, cannot get subscription');
    return null;
  }

  try {
    const subscription = await redis.get(`subscription:${snapshotId}`);
    return subscription ? (subscription as StoredSubscription) : null;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

export async function wasSent(snapshotId: string, ymd: string, lead: number): Promise<boolean> {
  if (!redis) {
    console.warn('Redis not available, assuming not sent');
    return false;
  }

  try {
    const key = `sent:${snapshotId}:${ymd}:${lead}`;
    const result = await redis.get(key);
    return !!result;
  } catch (error) {
    console.error('Error checking if sent:', error);
    return false;
  }
}

export async function markSent(snapshotId: string, ymd: string, lead: number): Promise<void> {
  if (!redis) {
    console.warn('Redis not available, cannot mark as sent');
    return;
  }

  try {
    const key = `sent:${snapshotId}:${ymd}:${lead}`;
    // Mark as sent with 7 day expiry
    await redis.setex(key, 7 * 24 * 60 * 60, '1');
  } catch (error) {
    console.error('Error marking as sent:', error);
  }
}

// Store snapshot for cron processing
export async function storeSnapshot(id: string, snapshot: Omit<Snapshot, 'id'>): Promise<void> {
  if (!redis) {
    console.warn('Redis not available, cannot store snapshot');
    return;
  }

  try {
    await redis.set(`snapshot:${id}`, { id, ...snapshot });
  } catch (error) {
    console.error('Error storing snapshot:', error);
  }
}

// Store push subscription
export async function storeSubscription(id: string, subscription: StoredSubscription): Promise<void> {
  if (!redis) {
    console.warn('Redis not available, cannot store subscription');
    return;
  }

  try {
    await redis.set(`subscription:${id}`, subscription);
  } catch (error) {
    console.error('Error storing subscription:', error);
  }
}

// Save snapshot (alias for storeSnapshot)
export const saveSnapshot = storeSnapshot;

// User subscription functions
export async function loadUserSubscriptions(userId: string): Promise<any[]> {
  if (!redis) {
    console.warn('Redis not available, returning empty subscriptions');
    return [];
  }

  try {
    const subscriptions = await redis.get(`user_subscriptions:${userId}`);
    return subscriptions ? (subscriptions as any[]) : [];
  } catch (error) {
    console.error('Error loading user subscriptions:', error);
    return [];
  }
}

export async function saveUserSubscriptions(userId: string, subscriptions: any[]): Promise<void> {
  if (!redis) {
    console.warn('Redis not available, cannot save user subscriptions');
    return;
  }

  try {
    await redis.set(`user_subscriptions:${userId}`, subscriptions);
  } catch (error) {
    console.error('Error saving user subscriptions:', error);
  }
}