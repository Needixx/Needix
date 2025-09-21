// components/ScrollGuard.tsx
"use client";

import { useEffect } from "react";

export default function ScrollGuard() {
  useEffect(() => {
    // Remove common scroll locks some components leave behind
    document.documentElement.style.overflow = "auto";
    document.body.style.overflowY = "auto";
    document.body.classList.remove("overflow-hidden"); // e.g. from modals

    // Ensure body can grow
    document.body.style.height = "auto";
    document.body.style.position = "static";
  }, []);

  return null;
}
