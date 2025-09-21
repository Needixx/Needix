// app/billing/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import BillingStatus from "@/components/BillingStatus";

type ActionState = "idle" | "loading";
type ApiResponse = { url?: string; error?: string };

// Safe helpers for custom session fields
function readIsPro(user: unknown): boolean {
  if (typeof user !== "object" || user === null) return false;
  const v = (user as { isPro?: unknown }).isPro;
  return typeof v === "boolean" ? v : false;
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const [state, setState] = useState<ActionState>("idle");
  const router = useRouter();
  const q = useSearchParams(); // must be inside <Suspense />
  const { data: session } = useSession();

  const email = session?.user?.email ?? "";
  const isPro = readIsPro(session?.user);
  const status = q.get("status"); // "success" | "cancelled" | null

  async function goToPortal(): Promise<void> {
    try {
      setState("loading");
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.url) throw new Error(data.error ?? "Portal error");
      window.location.href = data.url;
    } catch {
      alert("We couldn’t open your billing portal. Please try again.");
    } finally {
      setState("idle");
    }
  }

  async function startCheckout(): Promise<void> {
    try {
      setState("loading");
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }), // send email for webhook matching
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout error");
      window.location.href = data.url;
    } catch {
      alert("We couldn’t start checkout. Please try again.");
    } finally {
      setState("idle");
    }
  }

  return (
    <main className="min-h-[calc(100svh-64px)] bg-gradient-to-b from-[#0b0b16] via-black to-black">
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-16">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Needix Pro</h1>
            <p className="mt-2 text-zinc-400">
              Unlimited subscriptions, analytics, reminders, and price alerts — all in one.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-zinc-300 hover:bg-zinc-900"
          >
            Back to dashboard
          </Link>
        </header>

        {/* Plan/next bill badge */}
        <BillingStatus />

        {/* Query param feedback */}
        {status === "success" && (
          <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            🎉 Your upgrade was successful. Manage your plan any time below.
          </div>
        )}
        {status === "cancelled" && (
          <div className="mb-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-300">
            Checkout was cancelled. You can try again any time.
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <h2 className="text-xl font-semibold text-white">Free</h2>
            <p className="mt-1 text-zinc-400">For getting started.</p>
            <div className="mt-6">
              <div className="text-4xl font-bold text-white">$0</div>
              <div className="text-sm text-zinc-400">forever</div>
            </div>
            <ul className="mt-6 space-y-3 text-zinc-300">
              <li>• Track up to 5 subscriptions</li>
              <li>• Basic analytics</li>
              <li>• Manual reminders</li>
            </ul>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-8 w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Continue Free
            </button>
          </div>

          {/* Pro – Needix purple/cyan look */}
          <div className="relative rounded-3xl border border-fuchsia-500/30 bg-gradient-to-b from-fuchsia-900/40 via-[#0a0f1c] to-[#05151a] p-6 shadow-[0_0_90px_-20px_rgba(217,70,239,0.5)]">
            <div className="absolute right-4 top-4 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Most Popular
            </div>
            <h2 className="text-xl font-semibold text-white">Pro</h2>
            <p className="mt-1 text-zinc-300">Serious tracking & automations.</p>
            <div className="mt-6">
              <div className="flex items-end gap-2">
                <div className="text-4xl font-bold text-white">$5</div>
                <div className="pb-2 text-sm text-zinc-400">/month</div>
              </div>
              <div className="text-sm text-zinc-400">billed monthly, cancel anytime</div>
            </div>
            <ul className="mt-6 space-y-3 text-zinc-100">
              <li>• Unlimited subscriptions</li>
              <li>• Advanced analytics & CSV export</li>
              <li>• Smart reminders & price alerts</li>
              <li>• Priority support</li>
            </ul>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={() => void startCheckout()} // satisfy no-misused-promises
                disabled={state === "loading" || !email}
                title={!email ? "Sign in to purchase Pro" : undefined}
                className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-3 font-semibold text-black hover:from-fuchsia-400 hover:to-cyan-300 disabled:opacity-60"
              >
                {state === "loading" ? "Loading…" : "Upgrade to Pro"}
              </button>

              <button
                onClick={() => void goToPortal()} // satisfy no-misused-promises
                disabled={state === "loading" || !email || !isPro}
                title={
                  !email
                    ? "Sign in to manage billing"
                    : !isPro
                    ? "Upgrade to access billing portal"
                    : undefined
                }
                className="rounded-2xl border border-cyan-400/40 bg-transparent px-4 py-3 font-medium text-cyan-300 hover:bg-cyan-400/10 disabled:opacity-60"
              >
                Manage billing
              </button>
            </div>

            {/* Trust lockup */}
            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                  <path fill="currentColor" d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z" />
                </svg>
                <span>Payments secured by Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>We accept</span>
                <span className="rounded-md bg-zinc-800 px-2 py-1">Visa</span>
                <span className="rounded-md bg-zinc-800 px-2 py-1">Mastercard</span>
                <span className="rounded-md bg-zinc-800 px-2 py-1">AmEx</span>
                <span className="rounded-md bg-zinc-800 px-2 py-1">Apple&nbsp;Pay</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              You can cancel anytime from the customer portal.
            </p>
          </div>
        </div>

        {/* Extra trust row */}
        <div className="mt-14 grid grid-cols-1 gap-4 text-zinc-400 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            🔒 <span className="font-medium text-zinc-200">Secure by design.</span> We never store
            card numbers; all payments are processed by Stripe.
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            💳 <span className="font-medium text-zinc-200">Cancel anytime.</span> Manage your plan from
            the portal in one click.
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
            🛠️ <span className="font-medium text-zinc-200">Priority support.</span> Pro users jump to
            the front of the line.
          </div>
        </div>
      </section>
    </main>
  );
}

function BillingSkeleton() {
  return (
    <main className="min-h-[calc(100svh-64px)] bg-gradient-to-b from-[#0b0b16] via-black to-black">
      <section className="mx-auto max-w-5xl px-4 pb-24 pt-16">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800/40" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-900/40" />
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-900/40" />
        </div>
      </section>
    </main>
  );
}
