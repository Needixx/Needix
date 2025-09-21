"use client";

import { useEffect, useState } from "react";

export default function MobileNavigation() {
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkCapacitor = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        const native = Capacitor.isNativePlatform();
        setIsCapacitor(native);

        if (native) {
          document.body.classList.add("mobile-app");

          try {
            // Import defensively; the plugin may not be installed
            const statusBarModule = await import("@capacitor/status-bar").catch(
              () => null
            );
            if (statusBarModule) {
              const { StatusBar, Style } = statusBarModule;
              await StatusBar.setStyle({ style: Style.Dark });
              await StatusBar.setBackgroundColor({ color: "#000000" });
            }
          } catch {
            // Optional plugin, ignore if missing
            console.log("StatusBar not available");
          }
        }
      } catch {
        console.log("Capacitor not available, running in web mode");
        setIsCapacitor(false);
      }
    };

    // Avoid no-floating-promises
    void checkCapacitor();
  }, []);

  // Client-only component, but keep this guard harmlessly
  if (typeof window === "undefined") return null;

  return <>{isCapacitor && <div className="h-safe-top bg-black" />}</>;
}
