// components/NativeCleanup.tsx

'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export function NativeCleanup({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(!Capacitor.isNativePlatform());
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || hasRun) {
      setIsReady(true);
      return;
    }

    const forceCleanup = async () => {
      try {
        console.log('========================================');
        console.log('NATIVE CLEANUP - ROOT LAYOUT');
        console.log('========================================');
        
        // Check what exists
        const keys = ['user', 'authToken', 'needix_mobile_users', 'needix_mobile_session'];
        console.log('Checking stored data:');
        
        for (const key of keys) {
          const { value } = await Preferences.get({ key });
          if (value) {
            console.log(`  ${key}: EXISTS (${value.substring(0, 50)}...)`);
          }
        }
        
        // Nuclear clear
        console.log('Clearing ALL Preferences...');
        await Preferences.clear();
        
        // Wait
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify
        console.log('Verifying cleanup:');
        let anyRemaining = false;
        
        for (const key of keys) {
          const { value } = await Preferences.get({ key });
          if (value) {
            console.error(`  ${key}: STILL EXISTS!`);
            anyRemaining = true;
          } else {
            console.log(`  ${key}: cleared ✓`);
          }
        }
        
        if (anyRemaining) {
          console.error('ERROR: Some data persists after cleanup!');
          alert('WARNING: Old auth data could not be cleared. App may not work correctly.');
        } else {
          console.log('SUCCESS: All old auth data cleared');
        }
        
        console.log('========================================');
        
        setHasRun(true);
        
      } catch (error) {
        console.error('Cleanup error:', error);
      } finally {
        // Wait before allowing navigation
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsReady(true);
      }
    };

    forceCleanup();
  }, [hasRun]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <p className="text-white text-lg mb-2">Setting up...</p>
          <p className="text-white/60 text-sm">Check Xcode console</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}