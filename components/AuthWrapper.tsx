// components/AuthWrapper.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isNativePlatform, getSessionData, handleMobileAuth } from "@/lib/mobile-auth";

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthWrapper({ children, requireAuth = false }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const [mobileSession, setMobileSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      if (isNativePlatform()) {
        // On mobile, check stored session data
        const storedSession = await getSessionData();
        setMobileSession(storedSession);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Handle mobile auth when web session is available
    if (session?.user && isNativePlatform()) {
      void handleMobileAuth(session.user);
    }
  }, [session]);

  // Handle redirect in a separate useEffect to avoid render-time state updates
  useEffect(() => {
    const isAuthenticated = session?.user || (isNativePlatform() && mobileSession);
    
    if (requireAuth && !isAuthenticated && status !== "loading" && !isLoading) {
      setShouldRedirect(true);
    }
  }, [session, mobileSession, requireAuth, status, isLoading]);

  // Handle the actual redirect
  useEffect(() => {
    if (shouldRedirect) {
      router.push("/signin");
    }
  }, [shouldRedirect, router]);

  // Show loading while checking authentication
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication state
  const isAuthenticated = session?.user || (isNativePlatform() && mobileSession);

  // Show loading during redirect
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}