// app/dashboard/layout.tsx

"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DashboardTabsBar from "@/components/DashboardTabsBar";
import NotificationManager from "@/components/NotificationManager";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading
    if (!session?.user) {
      router.push("/signin");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
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