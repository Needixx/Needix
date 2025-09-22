// app/calendar/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import CalendarClient from "@/components/CalendarClient";
import AuroraBackground from "@/components/AuroraBackground";

export default function CalendarPage() {
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
      <main className="relative min-h-screen bg-black text-center pt-20">
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

  return (
    <main className="relative min-h-screen">
      <div className="relative min-h-screen">
        <AuroraBackground />
      <div/>
        <CalendarClient />
      </div>
    </main>
  );
}