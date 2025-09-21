// components/AIAssist.tsx
"use client";

import React from "react";

type IntakeResultCounts = {
  subscriptions: number;
  orders: number;
  expenses: number;
};

type ApiOkResponse = {
  ok: true;
  results: {
    createdSubs: { count: number };
    createdOrders: string[];
    createdExpenses: { count: number };
  };
  payload: {
    subscriptions: unknown[];
    orders: unknown[];
    expenses: unknown[];
  };
};

type ApiErrResponse = { error: string; details?: unknown };

type Props = { buttonLabel?: string; className?: string };

export default function AIAssist({ buttonLabel = "AI Add by Text", className }: Props) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<IntakeResultCounts | null>(null);

  const parseSafely = async (res: Response) => {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      return (await res.json()) as ApiOkResponse | ApiErrResponse;
    }
    // Fall back to text if backend sent HTML/plain
    const text = await res.text();
    try {
      return JSON.parse(text) as ApiOkResponse | ApiErrResponse;
    } catch {
      return { error: text || `HTTP ${res.status} ${res.statusText}` };
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
        const message =
          "error" in (data as ApiErrResponse) && typeof (data as ApiErrResponse).error === "string"
            ? (data as ApiErrResponse).error
            : "Failed to create records from AI output.";
        throw new Error(message);
      }

      const ok = data as ApiOkResponse;
      const subs = ok.results.createdSubs?.count ?? 0;
      const orders = ok.results.createdOrders?.length ?? 0;
      const expenses = ok.results.createdExpenses?.count ?? 0;

      setResult({ subscriptions: subs, orders, expenses });
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const closeAndReset = () => {
    setOpen(false);
    setError(null);
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
        className={`inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${className ?? ""}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-80">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAndReset} />
          <div className="absolute inset-x-0 top-20 mx-auto w-full max-w-2xl px-4">
            <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-xl font-semibold text-white">AI Intake</h2>
                <button
                  onClick={closeAndReset}
                  className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white focus:outline-none"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <p className="mb-3 text-sm text-white/70">
                Paste anything like:{" "}
                <span className="text-white">
                  “Add Netflix $15.49 monthly; iCloud $2.99; Bought Nike shoes $119 on 2025-09-03; Costco order $24 on
                  2025-09-07”
                </span>
                . We’ll parse it into subscriptions, orders, and expenses.
              </p>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste your items here…"
                rows={6}
                className="mb-4 w-full resize-y rounded-xl border border-white/10 bg-neutral-900/60 p-3 text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
              />

              {error && (
                <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {result && (
                <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  Added <strong>{result.subscriptions}</strong> subscriptions,{" "}
                  <strong>{result.orders}</strong> orders, and <strong>{result.expenses}</strong> expenses.
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-white/50">Tip: Amounts unknown? Leave them blank — we won’t invent them.</div>
                <div className="flex items-center gap-2">
                  <button onClick={closeAndReset} className="rounded-xl px-4 py-2 text-sm text-white/70 hover:bg-white/10">
                    Cancel
                  </button>
                  <button
                    onClick={() => void onSubmit()}
                    disabled={loading || text.trim().length === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading && (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" className="opacity-30" />
                        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                    )}
                    {loading ? "Adding…" : "Add with AI"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
