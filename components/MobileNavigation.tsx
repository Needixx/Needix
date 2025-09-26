// components/MobileNavigation.tsx
"use client";

import { useState, useEffect } from "react";
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
  const pathname = usePathname();

  useEffect(() => {
    // Set status bar for mobile
    if (typeof window !== "undefined") {
      try {
        if (window.StatusBar) {
          window.StatusBar.setBackgroundColor({ hex: "#000000" });
          window.StatusBar.setStyle({ style: "LIGHT" });
        } else {
          debug.log("StatusBar not available");
        }
      } catch (error) {
        debug.log("Capacitor not available, running in web mode");
      }
    }
  }, []);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/dashboard/subscriptions", label: "Subscriptions", icon: "💳" },
    { path: "/dashboard/orders", label: "Orders", icon: "📦" },
    { path: "/dashboard/expenses", label: "Expenses", icon: "💰" },
    { path: "/calendar", label: "Calendar", icon: "📅" },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 z-50">
      <div className="flex items-center justify-around px-2 py-3 max-w-md mx-auto">
        {navItems.map(({ path, label, icon }) => (
          <button
            key={path}
            onClick={() => handleNavigation(path)}
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors min-w-0 ${
              pathname === path
                ? "text-cyan-400 bg-cyan-400/10"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <span className="text-lg mb-1">{icon}</span>
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}