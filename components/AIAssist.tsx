// components/AIAssist.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

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
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<IntakeResultCounts | null>(null);

  React.useEffect(() => setMounted(true), []);

  // Lock scroll when modal is open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setOpen(false);
    setError(null);
    setResult(null);
  };

  const openDialog = () => {
    setResult(null);
    setError(null);
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={openDialog}
        className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all ${className ?? ""}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {buttonLabel}
      </button>

      {/* Modal in a portal so it sits above all page content */}
      {mounted && open &&
        createPortal(
          <div
            className="fixed inset-0 z-[10000] flex items-start justify-center p-4 sm:p-6 md:p-8"
            aria-modal="true"
            role="dialog"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              onClick={closeAndReset}
            />

            {/* Dialog */}
            <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/20 bg-neutral-900/95 shadow-2xl ring-1 ring-black/40">
              <div className="p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">AI Intake</h2>
                    <p className="text-sm text-white/60 mt-1">Smart financial data entry</p>
                  </div>
                  <button
                    onClick={closeAndReset}
                    className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white focus:outline-none transition-colors"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                <p className="mb-4 text-sm text-white/70 bg-white/5 rounded-xl p-3 border border-white/10">
                  <span className="text-emerald-400 font-medium">Example:</span>{" "}
                  <span className="text-white">
                    "Add Netflix $15.49 monthly; iCloud $2.99; Bought Nike shoes $119 on 2025-09-03; Costco order $24 on
                    2025-09-07"
                  </span>
                  <br />
                  <span className="text-white/50 text-xs mt-1 block">
                    We’ll parse it into subscriptions, orders, and expenses.
                  </span>
                </p>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type or paste your items here…"
                  rows={6}
                  className="mb-4 w-full resize-y rounded-xl border border-white/10 bg-neutral-900/60 p-4 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 transition-all"
                />

                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span className="font-medium">Error:</span>
                    </div>
                    <div className="mt-1">{error}</div>
                  </div>
                )}

                {result && (
                  <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
                    <div className="flex items-center gap-2 text-emerald-300 mb-2">
                      <span>✅</span>
                      <span className="font-medium">Success!</span>
                    </div>
                    <div className="text-emerald-200">
                      Added <strong className="text-white">{result.subscriptions}</strong> subscriptions,{" "}
                      <strong className="text-white">{result.orders}</strong> orders, and{" "}
                      <strong className="text-white">{result.expenses}</strong> expenses.
                    </div>
                    <div className="mt-3 text-xs text-emerald-300">
                      ✨ Your dashboard will refresh automatically to show the new items.
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/50">
                    💡 Tip: Amounts unknown? Leave them blank — we won’t invent them.
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeAndReset}
                      className="rounded-xl px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => void onSubmit()}
                      disabled={loading || text.trim().length === 0}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-2 text-sm font-semibold text-black hover:from-cyan-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60 transition-all transform hover:scale-105 disabled:hover:scale-100"
                    >
                      {loading && (
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-30" />
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
                        </svg>
                      )}
                      {loading ? "Processing..." : "Add with AI"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
