// components/ClientLayoutWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

// Dynamically import MobileNavigation to avoid SSR issues
const MobileNavigation = dynamic(() => import("@/components/MobileNavigation"), {
  ssr: false
});

export default function ClientLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileNavigation />
      {children}
    </>
  );
}