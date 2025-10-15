// components/MobileNavigation.tsx
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { debug } from "@/lib/debug";

declare global {
  interface Window {
    StatusBar?: {
      setBackgroundColor: (color: { hex: string }) => void;
      setStyle: (style: { style: string }) => void;
    };
  }
}

export default function MobileNavigation() {
  const router = useRouter();
  const pathname = usePathname(); // string | null

  // ✅ Always run hooks in the same order. Effects can early-return internally.
  useEffect(() => {
    // Set status bar for mobile (Capacitor)
    try {
      if (typeof window !== "undefined" && window.StatusBar) {
        window.StatusBar.setBackgroundColor({ hex: "#000000" });
        window.StatusBar.setStyle({ style: "LIGHT" });
      } else {
        debug.log("StatusBar not available");
      }
    } catch {
      debug.log("Capacitor not available, running in web mode");
    }
  }, []);

  // Routes where the mobile nav should be hidden
  const publicRoutes = new Set<string>([
    "/",
    "/signin",
    "/how-it-works",
    "/privacy",
    "/terms",
  ]);

  const isPublicRoute = pathname ? publicRoutes.has(pathname) : false;
  const hideOnBlog = pathname?.startsWith("/blog") ?? false;

  // Compute visibility without state (prevents hook-order pitfalls)
  const shouldShow = !isPublicRoute && !hideOnBlog;

  if (!shouldShow) return null;

  const navItems: Array<{ path: string; label: string; icon: string }> = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/dashboard/subscriptions", label: "Subscriptions", icon: "💳" },
    { path: "/dashboard/orders", label: "Orders", icon: "📦" },
    { path: "/dashboard/expenses", label: "Expenses", icon: "💰" },
    { path: "/calendar", label: "Calendar", icon: "📅" },
    { path: "/dashboard/ai-insights", label: "AI Insights", icon: "🤖" },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string): boolean => {
    // Active if current path is exactly it or starts with it (for nested routes)
    if (!pathname) return false;
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50 pb-safe-bottom">
      <div className="flex items-center justify-around px-1 py-3 max-w-lg mx-auto">
        {navItems.map(({ path, label, icon }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors min-w-0 ${
                active
                  ? "text-cyan-400 bg-cyan-400/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <span className="text-lg mb-1">{icon}</span>
              <span className="text-xs font-medium text-center leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
