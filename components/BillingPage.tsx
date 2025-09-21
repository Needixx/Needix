"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";

type UrlResponse = { url: string };

export default function BillingPage() {
  const { isPro, isLoading } = useSubscriptionLimit();
  const [busy, setBusy] = useState(false);

  async function startCheckout() {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start checkout");
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "url" in data &&
        typeof (data as { url: unknown }).url === "string"
      ) {
        window.location.href = (data as UrlResponse).url;
      } else {
        throw new Error("Unexpected checkout response");
      }
    } catch (err) {
      console.error(err);
      alert("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }

  async function openBillingPortal() {
    setBusy(true);
    try {
      const res = await fetch("/api/billing-portal", { method: "POST" });
      if (!res.ok) throw new Error("Failed to open billing portal");
      const data: unknown = await res.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "url" in data &&
        typeof (data as { url: unknown }).url === "string"
      ) {
        window.location.href = (data as UrlResponse).url;
      } else {
        throw new Error("Unexpected portal response");
      }
    } catch (err) {
      console.error(err);
      alert("Could not open billing portal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold mb-2">Needix Pro</h1>
        <p className="text-white/70">
          Unlimited subscriptions, analytics, reminders, and price alerts.
        </p>

        <div className="mt-4 flex gap-3">
          {isPro ? (
            <Button
              onClick={() => void openBillingPortal()}
              disabled={busy || isLoading}
            >
              Manage billing
            </Button>
          ) : (
            <Button
              onClick={() => void startCheckout()}
              disabled={busy || isLoading}
            >
              Upgrade to Pro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
