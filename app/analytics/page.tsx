// app/analytics/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default function AnalyticsPage() {
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
      <main className="min-h-screen bg-black text-white p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return <AnalyticsDashboard />;
}