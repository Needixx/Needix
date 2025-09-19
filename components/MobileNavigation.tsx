// components/MobileNavigation.tsx
"use client";

import { useEffect, useState } from 'react';

export default function MobileNavigation() {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Check if we're running in Capacitor
      const checkCapacitor = async () => {
        try {
          // Dynamic import to avoid SSR issues
          const { Capacitor } = await import('@capacitor/core');
          setIsCapacitor(Capacitor.isNativePlatform());
          
          if (Capacitor.isNativePlatform()) {
            // Apply mobile-specific styling
            document.body.classList.add('mobile-app');
            
            // Handle status bar if available - make import conditional
            try {
              // Check if status-bar package is available before importing
              const statusBarModule = await import('@capacitor/status-bar').catch(() => null);
              if (statusBarModule) {
                const { StatusBar, Style } = statusBarModule;
                await StatusBar.setStyle({ style: Style.Dark });
                await StatusBar.setBackgroundColor({ color: '#000000' });
              }
            } catch (error) {
              console.log('StatusBar not available:', error);
            }
          }
        } catch (error) {
          console.log('Capacitor not available, running in web mode');
          setIsCapacitor(false);
        }
      };
      
      checkCapacitor();
    }
  }, []);

  // Don't render anything on server side
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <>
      {isCapacitor && (
        <div className="h-safe-top bg-black" />
      )}
    </>
  );
}