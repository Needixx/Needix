// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import DashboardLink from "@/components/DashboardLink";
import { useEffect, useState } from "react";
import Portal from "@/components/ui/Portal";

export default function Navbar() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        setIsMobile(Capacitor.isNativePlatform());
      } catch {
        setIsMobile(false);
      }
    };
    void checkMobile();
  }, []);

  return (
    <nav className={`${isMobile ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/90 backdrop-blur-md supports-[backdrop-filter]:bg-black/70 ${isMobile ? 'pt-safe-top' : ''}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">Needix</Link>
        <div className="flex items-center gap-2">
          <DashboardLink />
          <CalendarLink />
          <UserStatus />
          <MenuSheet />
        </div>
      </div>
    </nav>
  );
}

function CalendarLink() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return (
    <Link 
      href="/calendar" 
      className="rounded-xl border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10 transition-colors mobile-touch-target"
    >
      📅 Calendar
    </Link>
  );
}

function UserStatus() {
  const { data: session } = useSession();
  const { isPro } = useSubscriptionLimit();
  
  if (!session?.user) {
    return (
      <Link 
        href="/signin" 
        className="rounded-xl border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10 mobile-touch-target"
      >
        Sign in
      </Link>
    );
  }
  
  const name = session.user.name || session.user.email || "user";
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1 text-sm">
      <span className="text-white/80">@{name.split("@")[0]}</span>
      <span className={"rounded-full px-2 py-0.5 text-xs " + (isPro ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/10 text-white/70 border border-white/20")}>{isPro ? "Pro" : "Free"}</span>
    </div>
  );
}

function MenuSheet() {
  const { data: session } = useSession();
  const { isPro } = useSubscriptionLimit();
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    window.location.href = '/api/auth/signout';
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="rounded-xl border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10 mobile-touch-target"
      >
        Menu
      </button>
      {open && (
        <Portal>
          <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-neutral-900 border-l border-white/10 p-4 overflow-auto pt-safe-top">
              <div className="mb-4 flex items-center justify-between">
                <div className="font-semibold">Menu</div>
                <button className="rounded px-2 py-1 text-white/80 hover:bg-white/10 mobile-touch-target" onClick={() => setOpen(false)}>✕</button>
              </div>
              <div className="grid gap-2 text-sm">
                <LinkItem href="/dashboard" label="🏠 Dashboard" onClick={() => setOpen(false)} />
                <LinkItem href="/calendar" label="📅 Calendar" onClick={() => setOpen(false)} />
                <LinkItem href="/billing" label="💰 Billing" onClick={() => setOpen(false)} />
                <LinkItem href="/settings" label="⚙️ Settings" onClick={() => setOpen(false)} />
                <LinkItem href="/#pricing" label={isPro ? "💎 Pricing" : "⭐ Upgrade to Pro"} onClick={() => setOpen(false)} />
                <LinkItem href="mailto:needix2025@gmail.com" label="💬 Help / Feedback" onClick={() => setOpen(false)} />
                {session?.user && (
                  <button onClick={handleSignOut} className="rounded-xl border border-white/10 px-3 py-2 text-left text-white/90 hover:bg-white/10 mobile-touch-target">
                    🚪 Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function LinkItem({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="rounded-xl border border-white/10 px-3 py-2 text-white/90 hover:bg-white/10 transition-colors mobile-touch-target">
      {label}
    </Link>
  );
}
