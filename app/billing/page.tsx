// app/billing/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import BillingStatus from "@/components/BillingStatus";

type ActionState = "idle" | "loading";
type ApiResponse = { url?: string; error?: string };

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
  const q = useSearchParams();
  const { data: session } = useSession();
  const { isPro, isLoading } = useSubscriptionLimit();

  const email = session?.user?.email ?? "";
  const status = q.get("status");

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
    } catch (error) {
      console.error("Portal error:", error);
      alert("We couldn't open your billing portal. Please try again.");
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
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout error");
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("We couldn't start checkout. Please try again.");
    } finally {
      setState("idle");
    }
  }

  // If still loading, show skeleton
  if (isLoading) {
    return <BillingSkeleton />;
  }

  // If user is Pro, show simplified billing management page
  if (isPro) {
    return (
      <main className="min-h-[calc(100svh-64px)] bg-gradient-to-b from-[#0b0b16] via-black to-black">
        <section className="mx-auto max-w-4xl px-4 pb-24 pt-16">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Billing Management</h1>
              <p className="mt-2 text-zinc-400">
                Manage your Needix Pro subscription and billing details
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-2 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors"
            >
              Back to dashboard
            </Link>
          </header>

          <BillingStatus />

          {/* Success message */}
          {status === "success" && (
            <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-300">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                🎉 Your upgrade was successful. Manage your plan below.
              </div>
            </div>
          )}

          {/* Main Pro billing card */}
          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5 p-8 shadow-2xl backdrop-blur-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">Needix Pro</h2>
                  <span className="rounded-full bg-cyan-400/20 border border-cyan-400/30 px-3 py-1 text-xs font-medium text-cyan-300">
                    Active
                  </span>
                </div>
                <p className="text-zinc-400">
                  Unlimited subscriptions, advanced analytics, smart reminders, and priority support.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">$5</div>
                <div className="text-sm text-zinc-400">/month</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-4">
                <div className="flex items-center gap-2 text-cyan-300 mb-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Unlimited Tracking</span>
                </div>
                <p className="text-sm text-zinc-400">Track unlimited subscriptions with no limits</p>
              </div>
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-4">
                <div className="flex items-center gap-2 text-cyan-300 mb-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium">Advanced Analytics</span>
                </div>
                <p className="text-sm text-zinc-400">Deep insights and CSV export capabilities</p>
              </div>
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-4">
                <div className="flex items-center gap-2 text-cyan-300 mb-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17H4l5 5v-5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9" />
                  </svg>
                  <span className="font-medium">Smart Alerts</span>
                </div>
                <p className="text-sm text-zinc-400">Price changes and renewal reminders</p>
              </div>
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 p-4">
                <div className="flex items-center gap-2 text-cyan-300 mb-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 110 19.5 9.75 9.75 0 010-19.5z" />
                  </svg>
                  <span className="font-medium">Priority Support</span>
                </div>
                <p className="text-sm text-zinc-400">Jump to the front of the support queue</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="manage-billing-btn"
                onClick={() => void goToPortal()}
                disabled={state === "loading"}
                className="flex-1 rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-6 py-3 font-semibold text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {state === "loading" ? "Opening..." : "Manage Billing"}
              </button>
              <Link
                href="/dashboard"
                className="flex-1 rounded-2xl border border-zinc-700/50 bg-zinc-900/50 px-6 py-3 font-semibold text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-all duration-200 text-center"
              >
                Back to Dashboard
              </Link>
            </div>

            {/* Security notice */}
            <div className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z" />
              </svg>
              <span>All billing managed securely through Stripe. Cancel anytime from the portal.</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Free user version - show upgrade options
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
            className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-2 text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors"
          >
            Back to dashboard
          </Link>
        </header>

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
          {/* Free Plan */}
          <div className="rounded-3xl border border-zinc-800/50 bg-zinc-950/40 p-6 shadow-2xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-2">Free</h2>
            <p className="text-zinc-400 mb-6">For getting started.</p>
            <div className="mb-6">
              <div className="text-4xl font-bold text-white">$0</div>
              <div className="text-sm text-zinc-400">forever</div>
            </div>
            <ul className="space-y-3 text-zinc-300 mb-8">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Track up to 2 Subscriptions, 2 Orders, and 2 Expenses
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Basic analytics
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-zinc-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Manual reminders
              </li>
            </ul>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full rounded-2xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 font-medium text-zinc-100 hover:bg-zinc-800/50 hover:border-zinc-600/50 transition-colors"
            >
              Continue Free
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-3xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-cyan-500/10 p-6 shadow-[0_0_60px_-12px_rgba(217,70,239,0.3)] backdrop-blur-sm">
            <div className="absolute right-4 top-4 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              Most Popular
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Pro</h2>
            <p className="text-zinc-300 mb-6">Serious tracking & automations.</p>
            <div className="mb-6">
              <div className="flex items-end gap-2">
                <div className="text-4xl font-bold text-white">$5</div>
                <div className="pb-2 text-sm text-zinc-400">/month</div>
              </div>
              <div className="text-sm text-zinc-400">billed monthly, cancel anytime</div>
            </div>
            <ul className="space-y-3 text-zinc-100 mb-8">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Unlimited subscriptions
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Advanced analytics & CSV export
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Smart reminders & price alerts
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => void startCheckout()}
                disabled={state === "loading" || !email}
                title={!email ? "Sign in to purchase Pro" : undefined}
                className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-3 font-semibold text-black hover:from-fuchsia-400 hover:to-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
              >
                {state === "loading" ? "Loading…" : "Upgrade to Pro"}
              </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
                  <path fill="currentColor" d="M12 2l7 3v6c0 5-3.5 9.74-7 11-3.5-1.26-7-6-7-11V5l7-3z" />
                </svg>
                <span>Payments secured by Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span>We accept</span>
                <span className="rounded-md bg-zinc-800/50 px-2 py-1">Visa</span>
                <span className="rounded-md bg-zinc-800/50 px-2 py-1">Mastercard</span>
                <span className="rounded-md bg-zinc-800/50 px-2 py-1">AmEx</span>
                <span className="rounded-md bg-zinc-800/50 px-2 py-1">Apple Pay</span>
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              You can cancel anytime from the customer portal.
            </p>
          </div>
        </div>

        {/* Trust section */}
        <div className="mt-14 grid grid-cols-1 gap-4 text-zinc-400 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/20 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔒</span>
              <span className="font-medium text-zinc-200">Secure by design</span>
            </div>
            <p className="text-sm">We never store card numbers; all payments are processed by Stripe.</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/20 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💳</span>
              <span className="font-medium text-zinc-200">Cancel anytime</span>
            </div>
            <p className="text-sm">Manage your plan from the portal in one click.</p>
          </div>
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-950/20 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🛠️</span>
              <span className="font-medium text-zinc-200">Priority support</span>
            </div>
            <p className="text-sm">Pro users jump to the front of the line.</p>
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