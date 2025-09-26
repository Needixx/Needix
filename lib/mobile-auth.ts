// lib/mobile-auth.ts
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const isNativePlatform = () => {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};

// Store session data for mobile
export const storeSessionData = async (sessionData: any) => {
  if (isNativePlatform()) {
    try {
      await Preferences.set({
        key: 'user_session',
        value: JSON.stringify(sessionData),
      });
    } catch (error) {
      console.error('Failed to store session data:', error);
    }
  }
};

// Retrieve session data for mobile
export const getSessionData = async () => {
  if (isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: 'user_session' });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Failed to retrieve session data:', error);
      return null;
    }
  }
  return null;
};

// Clear session data for mobile
export const clearSessionData = async () => {
  if (isNativePlatform()) {
    try {
      await Preferences.remove({ key: 'user_session' });
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }
};

// Check if Google OAuth should be available
export const isGoogleOAuthAvailable = () => {
  // For now, disable Google OAuth on native platforms
  // This can be enabled later with proper Google OAuth setup for mobile
  return !isNativePlatform();
};

// Handle mobile-specific authentication flow
export const handleMobileAuth = async (user: any) => {
  if (isNativePlatform()) {
    await storeSessionData(user);
    
    // You can add mobile-specific logic here
    // Such as setting up local notifications, preferences, etc.
    
    console.log('Mobile authentication successful for:', user.email);
  }
};