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
      window.dispatchEvent(new CustomEvent('needix-data-refresh'));
      
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    setOpen(false);
    setError(null);
    setResult(null);
  };

  if (!mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-neutral-900 to-neutral-800 border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900/80 to-cyan-900/80 backdrop-blur-sm px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors rounded-lg p-2 hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!result && (
            <>
              <div className="space-y-3">
                <p className="text-white/80">
                  Paste receipts, billing info, or describe your purchases. I'll automatically categorize and add them to your subscriptions, orders, and expenses.
                </p>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-white/60 mb-2">Examples:</p>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• "Netflix subscription $15.99/month, next billing Dec 15"</li>
                    <li>• "Amazon order: iPhone case $25, wireless charger $30"</li>
                    <li>• "Monthly gym membership $89, electricity bill $150"</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-white/80">
                  Describe your purchases or paste receipt text:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste receipt text or describe your purchases..."
                  className="w-full h-32 px-4 py-3 bg-neutral-800 border border-white/10 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { void onSubmit(); }}  // <-- wrap async
                  disabled={!text.trim() || loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "✨ Add with AI"}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {result && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full mb-4">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Successfully Added!</h3>
                <p className="text-white/70">Your items have been categorized and added.</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{result.subscriptions}</div>
                  <div className="text-sm text-white/70">Subscriptions</div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{result.orders}</div>
                  <div className="text-sm text-white/70">Orders</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{result.expenses}</div>
                  <div className="text-sm text-white/70">Expenses</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setText("");
                  }}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white rounded-xl transition-all duration-200"
                >
                  Add More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-6 py-3 font-medium text-white rounded-xl transition-all duration-200 hover:scale-[1.02] ${
          className || "bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
        }`}
      >
        <span className="text-lg">🤖</span>
        {buttonLabel}
      </button>
      {open && createPortal(modal, document.body)}
    </>
  );
}
