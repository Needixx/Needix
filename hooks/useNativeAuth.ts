// hooks/useNativeAuth.ts

'use client';

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useNativeAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    isAuthenticated: false,
  });

  const isNative = Capacitor.isNativePlatform();

  // Load token from Preferences on mount
  useEffect(() => {
    if (!isNative) {
      setAuthState({ user: null, token: null, loading: false, isAuthenticated: false });
      return;
    }

    const loadAuth = async () => {
      try {
        const { value: token } = await Preferences.get({ key: 'authToken' });
        const { value: userJson } = await Preferences.get({ key: 'user' });

        if (token && userJson) {
          const user = JSON.parse(userJson);
          
          // Verify token is still valid
          const response = await fetch('/api/auth/native-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          if (response.ok) {
            setAuthState({ user, token, loading: false, isAuthenticated: true });
          } else {
            // Token invalid, clear storage
            await Preferences.remove({ key: 'authToken' });
            await Preferences.remove({ key: 'user' });
            setAuthState({ user: null, token: null, loading: false, isAuthenticated: false });
          }
        } else {
          setAuthState({ user: null, token: null, loading: false, isAuthenticated: false });
        }
      } catch (error) {
        console.error('Error loading auth:', error);
        setAuthState({ user: null, token: null, loading: false, isAuthenticated: false });
      }
    };

    loadAuth();
  }, [isNative]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/native-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const { token, user } = await response.json();

      // Store in Capacitor Preferences
      if (isNative) {
        await Preferences.set({ key: 'authToken', value: token });
        await Preferences.set({ key: 'user', value: JSON.stringify(user) });
      }

      setAuthState({ user, token, loading: false, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const logout = async () => {
    if (isNative) {
      await Preferences.remove({ key: 'authToken' });
      await Preferences.remove({ key: 'user' });
    }
    setAuthState({ user: null, token: null, loading: false, isAuthenticated: false });
  };

  return {
    ...authState,
    login,
    logout,
    isNative,
  };
}