// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import DashboardLink from "@/components/DashboardLink";
import UserMenu from "@/components/UserMenu";
import UpgradeButton from "@/components/UpgradeButton";

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { data: session } = useSession();
  const { isPro } = useSubscriptionLimit();

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-black/70 pt-safe-top">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Needix
          {session?.user && isPro && (
            <span className="ml-2 inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-2 py-1 text-xs font-bold text-black">
              PRO
            </span>
          )}
        </Link>

        {!minimal && (
          <div className="hidden gap-6 md:flex">
            <Link href="/#features" className="text-white/80 hover:text-white">Features</Link>
            <Link href="/#pricing" className="text-white/80 hover:text-white">Pricing</Link>
            <Link href="/#faq" className="text-white/80 hover:text-white">FAQ</Link>
          </div>
        )}

        <div className="flex items-center gap-3">
          {session?.user && !isPro && (
            <UpgradeButton 
              size="sm" 
              variant="secondary" 
              className="hidden md:flex bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30"
            >
              ⭐ Upgrade
            </UpgradeButton>
          )}
          {session?.user && isPro && (
            <div className="hidden md:flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 px-3 py-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-cyan-300 font-medium">Pro Active</span>
            </div>
          )}
          <DashboardLink />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}