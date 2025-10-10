// components/ClientLayoutWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import { ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

// Dynamically import MobileNavigation to avoid SSR issues
const MobileNavigation = dynamic(() => import("@/components/MobileNavigation"), {
  ssr: false,
});

const PUBLIC_PREFIXES = ["/", "/signin", "/how-it-works", "/privacy", "/terms"];

/**
 * Returns true if pathname is a public route or a child of a public prefix.
 * Examples: "/", "/privacy", "/privacy/anything", "/terms/foo" → public
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const { status } = useSession();

  // Only show the mobile nav when:
  // - user is authenticated
  // - AND we're not on a public path
  // While status is "loading", hide to avoid flicker on public pages.
  const shouldShowMobileNav = useMemo(() => {
    if (status !== "authenticated") return false;
    return !isPublicPath(pathname);
  }, [status, pathname]);

  return (
    <>
      {shouldShowMobileNav && <MobileNavigation />}
      {children}
    </>
  );
}
