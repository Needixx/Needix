// components/Navbar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { Button } from "@/components/ui/Button";
import DashboardLink from "@/components/DashboardLink";
import Portal from "@/components/ui/Portal";

export default function Navbar({ isMobile = false }: { isMobile?: boolean }) {
  return (
    <nav className={`${isMobile ? 'fixed' : 'sticky'} top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/90 backdrop-blur-md supports-[backdrop-filter]:bg-black/70 ${isMobile ? 'pt-safe-top' : ''}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">Needix</Link>
        <div className="flex items-center gap-2">
          <DashboardLink />
          <div className="hidden md:block">
            <CalendarLink />
          </div>
          <UserStatusMenu />
        </div>
      </div>
    </nav>
  );
}

function CalendarLink() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  function go() {
    router.push("/calendar");
  }

  return (
    <Button variant="secondary" onClick={go}>
      📅 Calendar
    </Button>
  );
}

function UserStatusMenu() {
  const { data: session } = useSession();
  const { isPro } = useSubscriptionLimit();
  const [open, setOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  function handleSignOutClick() {
    setOpen(false);
    setShowSignOutModal(true);
  }

  function handleConfirmSignOut() {
    setShowSignOutModal(false);
    window.location.href = '/api/auth/signout';
  }

  function handleCancelSignOut() {
    setShowSignOutModal(false);
  }
  
  if (!session?.user) {
    return (
      <Link 
        href="/signin" 
        className="flex items-center justify-center rounded-xl border border-white/10 px-3 py-1 text-sm text-white/80 hover:bg-white/10 mobile-touch-target"
      >
        Sign in
      </Link>
    );
  }
  
  const name = session.user.name || session.user.email || "user";
  
  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1 text-sm hover:bg-white/10 mobile-touch-target transition-colors"
      >
        <span className="text-white/80 truncate max-w-24 md:max-w-none">@{name.split("@")[0]}</span>
        <span className={"rounded-full px-2 py-0.5 text-xs " + (isPro ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/10 text-white/70 border border-white/20")}>
          {isPro ? "Pro" : "Free"}
        </span>
        <span className="text-white/60 text-xs">▾</span>
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
                  <button onClick={handleSignOutClick} className="rounded-xl border border-white/10 px-3 py-2 text-left text-white/90 hover:bg-white/10 mobile-touch-target">
                    🚪 Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}

      {showSignOutModal && (
        <Portal>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
            <div className="bg-slate-900 border border-white/20 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-yellow-400 text-2xl">👋</span>
                <h3 className="text-xl font-bold text-white">Sign Out</h3>
              </div>
              
              <p className="text-white/80 mb-6">
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleCancelSignOut}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSignOut}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 flex-1"
                >
                  Sign Out
                </Button>
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