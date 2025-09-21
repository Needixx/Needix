// components/NavUser.tsx
"use client";

import { useSession } from "next-auth/react";

// Safe reader for custom field
function readIsPro(user: unknown): boolean {
  if (typeof user !== "object" || user === null) return false;
  const v = (user as { isPro?: unknown }).isPro;
  return typeof v === "boolean" ? v : false;
}

export function NavUser() {
  const { data } = useSession();
  const email = data?.user?.email;
  const isPro = readIsPro(data?.user);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-300">{email}</span>
      {isPro && (
        <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-2 py-0.5 text-xs font-semibold text-black">
          Pro
        </span>
      )}
    </div>
  );
}
