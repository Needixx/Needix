// components/TimezoneBootstrap.tsx
"use client";

import { useEffect, useRef } from "react";

function getBrowserTimeZone(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof tz === "string" && tz.includes("/") ? tz : null;
  } catch {
    return null;
  }
}

export default function TimezoneBootstrap() {
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const tz = getBrowserTimeZone();
    if (!tz) return;

    // Avoid needless POSTs
    const cookieTz = document.cookie
      .split("; ")
      .find((row) => row.startsWith("tz="))
      ?.split("=")[1];

    if (cookieTz === tz) return;

    void fetch("/api/user/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ timeZone: tz }),
    }).catch(() => {});
  }, []);

  return null;
}
