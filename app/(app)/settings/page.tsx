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
      <main className="mx-auto max-w-6xl px-4 py-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading settings...</span>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return null; // Will redirect
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚙️</span>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple to cyan/70 bg-clip-text text-transparent">
            Settings
          </h1>
        </div>
        <p className="text-white/60 text-lg">
          Customize your Needix experience and manage your account preferences
        </p>
      </div>

      {/* Settings Content */}
      <SettingsClient user={session.user} />
    </main>
  );
}