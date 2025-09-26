// components/AuthWrapper.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isMobileApp } from "@/lib/mobile-auth";

interface AuthWrapperProps {
  requireAuth?: boolean;
  children: React.ReactNode;
}

export default function AuthWrapper({ 
  requireAuth = false, 
  children 
}: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSession, setMobileSession] = useState(null);

  // Check for mobile session if needed
  useEffect(() => {
    const checkMobileSession = async () => {
      if (isMobileApp() && !session?.user) {
        try {
          const response = await fetch('/api/auth/session');
          const data = await response.json();
          setMobileSession(data?.user || null);
        } catch (error) {
          console.error('Failed to check mobile session:', error);
          setMobileSession(null);
        }
      }
      setIsLoading(false);
    };

    if (status !== "loading") {
      checkMobileSession();
    }
  }, [session, status]);

  // Handle redirect in a separate useEffect to avoid render-time state updates
  useEffect(() => {
    const isAuthenticated = session?.user || (isMobileApp() && mobileSession);
    
    if (requireAuth && !isAuthenticated && status !== "loading" && !isLoading) {
      setShouldRedirect(true);
    }
  }, [session, mobileSession, requireAuth, status, isLoading]);

  // Perform redirect
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/signin');
    }
  }, [shouldRedirect, router]);

  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show nothing during redirect
  if (shouldRedirect) {
    return null;
  }

  // Check authentication if required
  if (requireAuth && !session?.user && !(isMobileApp() && mobileSession)) {
    return null; // Will redirect
  }

  return <>{children}</>;
}