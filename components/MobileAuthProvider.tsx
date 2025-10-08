// components/MobileAuthProvider.tsx
'use client';

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

type MobileAuthContextType = {
  isAuthenticated: boolean;
  user: { email: string; name?: string } | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const MobileAuthContext = createContext<MobileAuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  logout: async () => {},
});

export const useMobileAuth = () => useContext(MobileAuthContext);

export function MobileAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) {
      setLoading(false);
      return;
    }

    checkAuth();
  }, [isNative]);

  const checkAuth = async () => {
    try {
      const { value: token } = await Preferences.get({ key: 'authToken' });
      const { value: userJson } = await Preferences.get({ key: 'user' });

      if (token && userJson) {
        setUser(JSON.parse(userJson));
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setUser(null);

        const publicRoutes = ['/', '/signin', '/signup', '/privacy', '/terms', '/how-it-works'];
        if (!publicRoutes.includes(pathname)) {
          router.push('/signin');
        }
      }
    } catch (error) {
      console.error('❌ Error checking mobile auth:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!isNative) return;

    try {
      await Preferences.remove({ key: 'authToken' });
      await Preferences.remove({ key: 'user' });
      setIsAuthenticated(false);
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  };

  if (isNative && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MobileAuthContext.Provider value={{ isAuthenticated, user, loading, logout }}>
      {children}
    </MobileAuthContext.Provider>
  );
}