// lib/offline-storage.ts

import { Preferences } from '@capacitor/preferences';

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

class OfflineStorageManager {
  private static readonly STORAGE_KEY = 'needix-offline-data';

  // Save subscriptions to local storage
  async saveSubscriptions(subscriptions: CachedSubscription[], userEmail: string): Promise<void> {
    try {
      const cachedSubscriptions: CachedSubscription[] = subscriptions.map((sub: CachedSubscription) => ({
        id: sub.id,
        name: sub.name,
        price: sub.price,
        period: sub.period,
        nextBillingDate: sub.nextBillingDate,
        category: sub.category,
        notes: sub.notes,
        cachedAt: new Date().toISOString()
      }));

      const offlineData: OfflineData = {
        subscriptions: cachedSubscriptions,
        lastSync: new Date().toISOString(),
        userEmail
      };

      await Preferences.set({
        key: OfflineStorageManager.STORAGE_KEY,
        value: JSON.stringify(offlineData)
      });

      console.log('Subscriptions cached offline successfully');
    } catch (error) {
      console.error('Failed to cache subscriptions:', error);
    }
  }

  // Load subscriptions from local storage
  async loadSubscriptions(): Promise<CachedSubscription[]> {
    try {
      const { value } = await Preferences.get({
        key: OfflineStorageManager.STORAGE_KEY
      });

      if (value) {
        const offlineData: OfflineData = JSON.parse(value);
        return offlineData.subscriptions || [];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to load cached subscriptions:', error);
      return [];
    }
  }

  // Get last sync time
  async getLastSyncTime(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({
        key: OfflineStorageManager.STORAGE_KEY
      });

      if (value) {
        const offlineData: OfflineData = JSON.parse(value);
        return offlineData.lastSync;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  // Check if data exists offline
  async hasOfflineData(): Promise<boolean> {
    try {
      const { value } = await Preferences.get({
        key: OfflineStorageManager.STORAGE_KEY
      });
      return !!value;
    } catch {
      return false;
    }
  }

  // Clear offline data
  async clearOfflineData(): Promise<void> {
    try {
      await Preferences.remove({
        key: OfflineStorageManager.STORAGE_KEY
      });
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  // Check if device is online
  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineStorage = new OfflineStorageManager();