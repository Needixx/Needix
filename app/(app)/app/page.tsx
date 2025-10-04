// app/(app)/app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardClient from "@/components/DashboardClient";
import { Capacitor } from '@capacitor/core';
import { MobileAuth } from '@/lib/mobile-simple-auth';

export default function DashboardPage() {
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
      <main className="mx-auto max-w-6xl px-4 py-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Your Subscriptions</h1>
      <p className="mb-8 text-white/70">Add, modify, and import your subscriptions here.</p>
      <DashboardClient />
    </main>
  );
}