// lib/data-sync.ts
"use client";

// Helper to ensure data persistence works correctly
export const syncData = {
  // Add with retry mechanism
  async add(endpoint: string, data: any) {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          return await response.json();
        }
        
        // If unauthorized, wait a bit for auth to settle
        if (response.status === 401 && attempts < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          continue;
        }
        
        throw new Error(`Server error: ${response.status}`);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error(`Failed to add after ${maxAttempts} attempts:`, error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  },

  // Force refresh from server
  async refresh(endpoint: string) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to refresh from server:', error);
      return null;
    }
  },

  // Sync localStorage with server after successful operations
  syncToStorage(key: string, data: any[]) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      // Trigger a storage event to sync across tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(data),
        url: window.location.href
      }));
    } catch (error) {
      console.error('Failed to sync to storage:', error);
    }
  }
};