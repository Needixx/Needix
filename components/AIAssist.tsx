// components/AIAssist.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";

type IntakeResultCounts = { subscriptions: number; orders: number; expenses: number };

type ApiOkResponse = {
  ok: true;
  results: {
    createdSubs: { count: number };
    createdOrders: string[];
    createdExpenses: { count: number };
  };
  payload: { subscriptions: unknown[]; orders: unknown[]; expenses: unknown[] };
};

type ApiErrResponse = { error: string; details?: unknown };

type Props = {
  buttonLabel?: string;
  className?: string;
  onSuccess?: () => void;
};

export default function AIAssist({
  buttonLabel = "AI Add by Text",
  className,
  onSuccess,
}: Props) {
  const router = useRouter();
  const { isPro } = useSubscriptionLimit();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<IntakeResultCounts | null>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleOpenClick = () => {
    if (!isPro) {
      // Show upgrade modal or redirect
      router.push("/#pricing");
      return;
    }
    setOpen(true);
  };

  const parseSafely = async (res: Response) => {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) return (await res.json()) as ApiOkResponse | ApiErrResponse;
    const txt = await res.text();
    try {
      return JSON.parse(txt) as ApiOkResponse | ApiErrResponse;
    } catch {
      return { error: txt || `HTTP ${res.status} ${res.statusText}` };
    }
  };

  const onSubmit = async (): Promise<void> => {
    if (!isPro) {
      setError("AI features are only available for Pro users. Please upgrade!");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await parseSafely(res);
      if (!res.ok || !("ok" in (data as ApiOkResponse))) {
        const msg =
          "error" in (data as ApiErrResponse) && typeof (data as ApiErrResponse).error === "string"
            ? (data as ApiErrResponse).error
            : "Failed to create records from AI output.";
        throw new Error(msg);
      }

      const ok = data as ApiOkResponse;
      setResult({
        subscriptions: ok.results.createdSubs?.count ?? 0,
        orders: ok.results.createdOrders?.length ?? 0,
        expenses: ok.results.createdExpenses?.count ?? 0,
      });
      setText("");
      
      router.refresh();
      onSuccess?.();
      window.dispatchEvent(new CustomEvent('needix-data-refresh'));
      
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <button
        onClick={handleOpenClick}
        className={
          className ||
          "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white/90 hover:bg-white/10"
        }
      >
        {isPro ? (
          <>🤖 {buttonLabel}</>
        ) : (
          <>🔒 {buttonLabel} (Pro)</>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <h2 className="text-xl font-bold text-white">AI Assistant</h2>
                  <span className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                    PRO
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-1 text-white/80 hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <p className="mb-4 text-sm text-white/60">
                Describe your subscriptions, orders, or expenses in plain English, and AI will add them for you.
              </p>

              <textarea
                className="mb-4 w-full rounded-xl border border-white/20 bg-white/5 p-4 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                rows={6}
                placeholder="Example: I have Netflix for $15.99/month, Spotify Premium at $10.99, and I need to order a new laptop for $1200 next month..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {result && (
                <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                  <div className="font-semibold text-green-400">✓ Success!</div>
                  <div className="mt-2 text-sm text-white/80">
                    Created: {result.subscriptions} subscriptions, {result.orders} orders,{" "}
                    {result.expenses} expenses
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void onSubmit()}
                  disabled={loading || !text.trim()}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 px-4 py-2 font-medium text-white hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Add with AI"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}