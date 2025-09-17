"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; message: string; kind: ToastKind; actionLabel?: string; onAction?: () => void };

type NotifyOptions = { actionLabel?: string; onAction?: () => void; durationMs?: number };
const ToastCtx = createContext<{ notify: (msg: string, kind?: ToastKind, opts?: NotifyOptions) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const inc = useRef(0);

  const notify = useCallback((message: string, kind: ToastKind = "info", opts?: NotifyOptions) => {
    let id: string;
    try {
      const hasUUID = typeof crypto !== 'undefined' && (crypto as unknown as { randomUUID?: () => string }).randomUUID;
      id = hasUUID ? (crypto as unknown as { randomUUID: () => string }).randomUUID() : `${Date.now()}-${inc.current++}`;
    } catch {
      id = `${Date.now()}-${inc.current++}`;
    }
    setToasts((prev) => [...prev, { id, message, kind, actionLabel: opts?.actionLabel, onAction: opts?.onAction }]);
    const duration = opts?.durationMs ?? 3500;
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "min-w-[240px] max-w-[360px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm",
              t.kind === "success" && "border-green-500/30 bg-green-500/10 text-green-100",
              t.kind === "error" && "border-red-500/30 bg-red-500/10 text-red-100",
              t.kind === "info" && "border-white/20 bg-white/10 text-white",
            ].join(" ")}
          >
            <div className="text-sm flex items-center justify-between gap-3">
              <span>{t.message}</span>
              {t.actionLabel && t.onAction && (
                <button
                  className="text-xs px-2 py-1 rounded border border-white/20 hover:bg-white/10"
                  onClick={t.onAction}
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.notify;
}
