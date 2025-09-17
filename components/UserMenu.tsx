// components/UserMenu.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { Button } from "@/components/ui/Button";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const { isPro } = useSubscriptionLimit();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  if (status === "loading") return null;

  // Not signed in → show "Sign in" button that goes to Google and returns to /app
  if (!session?.user) {
    return (
      <Button onClick={() => signIn("google", { callbackUrl: "/app" })}>
        Sign in
      </Button>
    );
  }

  const userLabel = session.user.name ?? session.user.email ?? "Account";

  return (
    <div ref={boxRef} className="flex items-center gap-3">
      {/* Status pill - Show username/email when logged in */}
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1">
        <span className={`inline-block h-2 w-2 rounded-full ${isPro ? 'bg-cyan-400' : 'bg-green-500'}`} />
        <span className="text-sm text-white/80">
          {userLabel}
        </span>
      </div>

      {/* Simple dropdown */}
      <div className="relative">
        <Button variant="ghost" onClick={() => setOpen((v) => !v)}>
          Menu ▾
        </Button>
        {open && (
          <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-black/95 p-1 shadow-lg">
            <MenuItem onClick={() => router.push("/app")} label="Dashboard" />
            <MenuItem onClick={() => router.push("/billing")} label="💳 Billing" />
            {!isPro && (
              <MenuItem onClick={() => router.push("/#pricing")} label="⭐ Upgrade to Pro" />
            )}
            {/* Admin link for specific admin email */}
            {session?.user?.email === 'needix2025@gmail.com' && (
              <>
                <MenuItem onClick={() => router.push("/analytics")} label="📊 Analytics" />
                <Divider />
              </>
            )}
            <MenuItem onClick={() => router.push("/settings")} label="Settings" />
            <MenuItem onClick={() => {
              try {
                // Clear Needix-related local data
                const keys: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const k = localStorage.key(i);
                  if (!k) continue;
                  if (k.startsWith('needix.')) keys.push(k);
                }
                keys.forEach((k) => localStorage.removeItem(k));
                // Force subscribers to reload
                window.dispatchEvent(new Event('needix:subscriptions-changed'));
                // Optional: refresh the page
                window.location.reload();
              } catch {}
            }} label="🧹 Clear local data" />
            <Divider />
            <MenuItem onClick={() => router.push("/how-it-works")} label="Features" />
            <MenuItem onClick={() => router.push("/#pricing")} label="Pricing" />
            <MenuItem onClick={() => router.push("/#faq")} label="FAQ" />
            <Divider />
            <MenuItem onClick={() => signOut({ callbackUrl: "/" })} label="Sign out" />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
    >
      {label}
    </button>
  );
}

function Divider() {
  return <div className="my-1 h-px w-full bg-white/10" />;
}
