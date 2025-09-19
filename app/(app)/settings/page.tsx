// app/(app)/settings/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SettingsClient from "@/components/SettingsClient";

export default function SettingsPage() {
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
      <main className="mx-auto max-w-4xl px-4 py-10 text-center">
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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          ⚙️ Settings
        </h1>
        <p className="text-white/60 mt-1">Manage your account preferences and data</p>
      </div>

      <SettingsClient user={session.user} />
    </main>
  );
}