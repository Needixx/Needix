// lib/mobile-auth.ts
import { Capacitor } from '@capacitor/core';

export const isMobileApp = () => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

// Legacy export for compatibility
export const isNativePlatform = isMobileApp;

export const handleMobileAuth = async (result: any) => {
  if (!isMobileApp()) {
    return result;
  }

  // For mobile apps, we need to handle auth results differently
  if (result?.ok) {
    // Force a hard navigation for mobile
    window.location.href = '/dashboard';
    return result;
  }

  return result;
};

export const mobileRedirect = (path: string) => {
  if (isMobileApp()) {
    // Use hard redirect for mobile
    window.location.href = path;
  } else {
    // Use router for web
    return path;
  }
};

// Check if we're running in development mode with dev auth enabled
export const isDevAuthEnabled = () => {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH === '1';
};

// Mobile-safe session check
export const checkMobileSession = async () => {
  try {
    const response = await fetch('/api/auth/session');
    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Session check failed:', error);
    return null;
  }
};

// Get session data for mobile compatibility
export const getSessionData = async () => {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) return null;
    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Failed to get session data:', error);
    return null;
  }
};