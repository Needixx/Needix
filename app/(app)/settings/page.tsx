// app/(app)/settings/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import SettingsClient from "@/components/SettingsClient";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth gate
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) router.push("/signin");
  }, [session, status, router]);

  // Read once into stable strings so we can safely use in deps
  const tab = useMemo(() => (searchParams?.get("tab") || "").toLowerCase().trim(), [searchParams]);
  const section = useMemo(() => (searchParams?.get("section") || "").toLowerCase().trim(), [searchParams]);

  // Deep-link to AI & Privacy section
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Map common query values to the element id used on the page
    const mapToId = (key: string): string | null => {
      if (!key) return null;
      if (["ai", "privacy", "ai-privacy", "ai_privacy", "aiandprivacy"].includes(key)) {
        return "ai-privacy"; // <-- change if your section uses a different id
      }
      return key; // allow direct ids like ?section=billing
    };

    const targetId =
      mapToId(tab) ||
      mapToId(section) ||
      (window.location.hash ? window.location.hash.slice(1) : null);

    if (!targetId) return;

    // Try a few likely ids if the primary one isn't found
    const candidates = [
      targetId,
      // fallback guesses if your SettingsClient uses different anchors
      "ai-privacy",
      "ai_privacy",
      "ai",
      "privacy",
      "ai-settings",
      "aiSettings",
    ];

    // Update the URL hash (keeps query params intact)
    const url = new URL(window.location.href);
    url.hash = `#${targetId}`;
    window.history.replaceState(null, "", url.toString());

    // Scroll after paint
    requestAnimationFrame(() => {
      const el = candidates
        .map((id) => document.getElementById(id))
        .find((node): node is HTMLElement => Boolean(node));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [tab, section]);

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading settings...</span>
        </div>
      </main>
    );
  }

  if (!session?.user) return null;

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
