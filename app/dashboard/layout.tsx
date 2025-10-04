// app/dashboard/layout.tsx
"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardTabsBar from "@/components/DashboardTabsBar";
import NotificationManager from "@/components/NotificationManager";
import { Capacitor } from '@capacitor/core';
import { MobileAuth } from '@/lib/mobile-simple-auth';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      // Mobile auth check
      if (isNative) {
        const loggedIn = await MobileAuth.isLoggedIn();
        if (mounted) {
          setIsAuthenticated(loggedIn);
          setIsChecking(false);
          
          if (!loggedIn) {
            router.replace("/signin");
          }
        }
        return;
      }

      // Web auth check
      if (status === "loading") return;
      
      if (mounted) {
        if (!session?.user) {
          router.replace("/signin");
        } else {
          setIsAuthenticated(true);
          setIsChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [session, status, router, isNative]);

  if (isChecking || (!isNative && status === "loading")) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <DashboardTabsBar />
      {children}
      
      {/* Add the NotificationManager to handle automatic notification setup */}
      <NotificationManager 
        autoInit={true}
        autoSetupReminders={true}
        showStatus={process.env.NODE_ENV === 'development'} // Only show status in dev
      />
    </div>
  );
}