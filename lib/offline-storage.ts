import { Preferences } from "@capacitor/preferences";
import { debug } from '@/lib/debug';

export interface CachedSubscription {
  id: string;
  name: string;
  price: number;
  period: string;
  nextBillingDate?: string;
  category?: string;
  notes?: string;
  cachedAt: string;
}

export interface OfflineData {
  subscriptions: CachedSubscription[];
  lastSync: string;
  userEmail: string;
}

function isOfflineData(x: unknown): x is OfflineData {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Partial<OfflineData>;
  return (
    Array.isArray(o.subscriptions) &&
    typeof o.lastSync === "string" &&
    typeof o.userEmail === "string"
  );
}

class OfflineStorageManager {
  private static readonly STORAGE_KEY = "needix-offline-data";

  async saveSubscriptions(
    subscriptions: CachedSubscription[],
    userEmail: string,
  ): Promise<void> {
    try {
      const cachedSubscriptions: CachedSubscription[] = subscriptions.map((sub) => ({
        id: sub.id,
        name: sub.name,
        price: sub.price,
        period: sub.period,
        nextBillingDate: sub.nextBillingDate,
        category: sub.category,
        notes: sub.notes,
        cachedAt: new Date().toISOString(),
      }));

      const offlineData: OfflineData = {
        subscriptions: cachedSubscriptions,
        lastSync: new Date().toISOString(),
        userEmail,
      };

      await Preferences.set({
        key: OfflineStorageManager.STORAGE_KEY,
        value: JSON.stringify(offlineData),
      });
      debug.log("Subscriptions cached offline successfully");
    } catch (error) {
      console.error("Failed to cache subscriptions:", error);
    }
  }

  async loadSubscriptions(): Promise<CachedSubscription[]> {
    try {
      const { value } = await Preferences.get({
        key: OfflineStorageManager.STORAGE_KEY,
      });

      if (value) {
        const parsed: unknown = JSON.parse(value);
        if (isOfflineData(parsed)) {
          return parsed.subscriptions ?? [];
        }
      }
      return [];
    } catch (error) {
      console.error("Failed to load cached subscriptions:", error);
      return [];
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({
        key: OfflineStorageManager.STORAGE_KEY,
      });

      if (value) {
        const parsed: unknown = JSON.parse(value);
        if (isOfflineData(parsed)) {
          return parsed.lastSync ?? null;
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to get last sync time:", error);
      return null;
    }
  }

  async hasOfflineData(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({
        key: OfflineStorageManager.STORAGE_KEY,
      });
      return !!value;
    } catch {
      return false;
    }
  }

  async clearOfflineData(): Promise<void> {
    try {
      await Preferences.remove({
        key: OfflineStorageManager.STORAGE_KEY,
      });
      debug.log("Offline data cleared");
    } catch (error) {
      console.error("Failed to clear offline data:", error);
    }
  }

  isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }
}

export const offlineStorage = new OfflineStorageManager();
