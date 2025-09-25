// lib/hooks/useNotifications.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import NotificationService, { type NotificationPayload, type ReminderSettings } from "@/lib/notifications/NotificationService";

interface NotificationHookReturn {
  // Status
  isSupported: boolean;
  hasPermission: boolean;
  platform: "web" | "native" | "unknown";
  settings: ReminderSettings;
  
  // Actions
  initialize: () => Promise<boolean>;
  updateSettings: (settings: Partial<ReminderSettings>) => Promise<void>;
  requestPermission: () => Promise<boolean>;
  testNotification: () => Promise<boolean>;
  setupReminders: (subscriptions: Array<{
    id: string;
    name: string;
    nextBillingDate?: string;
    nextBillingAt?: string;
  }>) => Promise<void>;
  sendNotification: (payload: NotificationPayload) => Promise<boolean>;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastTestResult: boolean | null;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  leadDays: [7, 3, 1],
  timeOfDay: "09:00",
  channels: {
    web: true,
    mobile: true,
    email: false,
  },
};

const SETTINGS_KEY = "needix_notification_settings";

export function useNotifications(): NotificationHookReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [platform, setPlatform] = useState<"web" | "native" | "unknown">("unknown");
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTestResult, setLastTestResult] = useState<boolean | null>(null);
  
  // Get notification service instance
  const getNotificationService = useCallback((): NotificationService => {
    return NotificationService.getInstance();
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings) as ReminderSettings;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
      setError("Failed to load notification settings");
    }
  }, []);

  // Check initial permission status
  useEffect(() => {
    const checkStatus = async (): Promise<void> => {
      try {
        const notificationService = getNotificationService();
        const status = await notificationService.getPermissionStatus();
        setIsSupported(status.supported);
        setHasPermission(status.granted);
        setPlatform(status.platform);
      } catch (error) {
        console.error("Failed to check notification status:", error);
        setError("Failed to check notification status");
      }
    };

    void checkStatus();
  }, [getNotificationService]);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: ReminderSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save notification settings:", error);
      setError("Failed to save notification settings");
    }
  }, []);

  // Initialize notification service
  const initialize = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const notificationService = getNotificationService();
      const success = await notificationService.initialize();
      
      if (success) {
        const status = await notificationService.getPermissionStatus();
        setIsSupported(status.supported);
        setHasPermission(status.granted);
        setPlatform(status.platform);
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize notifications";
      setError(errorMessage);
      console.error("Notification initialization failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getNotificationService]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await initialize();
      if (success) {
        const notificationService = getNotificationService();
        const status = await notificationService.getPermissionStatus();
        setHasPermission(status.granted);
        
        // Auto-enable notifications if permission granted
        if (status.granted && !settings.enabled) {
          const newSettings = { ...settings, enabled: true };
          saveSettings(newSettings);
        }
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to request permission";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [initialize, getNotificationService, settings, saveSettings]);

  // Update notification settings
  const updateSettings = useCallback(async (newSettings: Partial<ReminderSettings>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      saveSettings(updatedSettings);
      
      // Sync settings to server if user is logged in
      if (typeof window !== "undefined") {
        try {
          await fetch("/api/user/notification-settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedSettings),
          });
        } catch (error) {
          console.warn("Failed to sync settings to server:", error);
          // Don't throw - local settings are still saved
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update settings";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [settings, saveSettings]);

  // Test notification functionality
  const testNotification = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setError("Permission required to send test notification");
          setLastTestResult(false);
          return false;
        }
      }
      
      const notificationService = getNotificationService();
      const success = await notificationService.testNotification();
      setLastTestResult(success);
      
      if (!success) {
        setError("Test notification failed to send");
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Test notification failed";
      setError(errorMessage);
      setLastTestResult(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestPermission, getNotificationService]);

  // Setup subscription reminders
  const setupReminders = useCallback(async (
    subscriptions: Array<{ 
      id: string; 
      name: string; 
      nextBillingDate?: string;
      nextBillingAt?: string;
    }>
  ): Promise<void> => {
    if (!settings.enabled || !hasPermission) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const notificationService = getNotificationService();
      await notificationService.setupSubscriptionReminders(subscriptions, settings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to setup reminders";
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [settings, hasPermission, getNotificationService]);

  // Send immediate notification
  const sendNotification = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          setError("Permission required to send notification");
          return false;
        }
      }
      
      const notificationService = getNotificationService();
      const success = await notificationService.sendNotification(payload);
      
      if (!success) {
        setError("Failed to send notification");
      }
      
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send notification";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [hasPermission, requestPermission, getNotificationService]);

  return {
    isSupported,
    hasPermission,
    platform,
    settings,
    updateSettings,
    initialize,
    requestPermission,
    testNotification,
    setupReminders,
    sendNotification,
    isLoading,
    error,
    lastTestResult,
  };
}