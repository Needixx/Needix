// components/BillingStatus.tsx
"use client";

import { useSession } from "next-auth/react";

// Safe helpers for custom session fields
function toValidDate(v: unknown): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function getUserExtras(user: unknown): {
  isPro: boolean;
  planStatus?: string;
  currentPeriodEnd: Date | null;
} {
  if (typeof user !== "object" || user === null) {
    return { isPro: false, currentPeriodEnd: null };
  }
  const u = user as {
    isPro?: unknown;
    planStatus?: unknown;
    currentPeriodEnd?: unknown;
  };

  const isPro = typeof u.isPro === "boolean" ? u.isPro : false;
  const planStatus = typeof u.planStatus === "string" ? u.planStatus : undefined;
  const currentPeriodEnd = toValidDate(u.currentPeriodEnd);

  return { isPro, planStatus, currentPeriodEnd };
}

function fmt(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BillingStatus() {
  const { data } = useSession();
  const { isPro, planStatus, currentPeriodEnd } = getUserExtras(data?.user);

  if (!isPro) return null;

  const nextAt = fmt(currentPeriodEnd);

  return (
    <div className="mb-8 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-medium text-cyan-100">Plan:</span> Pro
          {planStatus ? <span className="ml-2 text-cyan-300">({planStatus})</span> : null}
          {nextAt ? <span className="ml-2 text-cyan-300">• Next bill {nextAt}</span> : null}
        </div>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const btn = document.getElementById("manage-billing-btn") as HTMLButtonElement | null;
            btn?.click();
          }}
          className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-cyan-200 hover:bg-cyan-400/10"
        >
          Manage billing
        </a>
      </div>
    </div>
  );
}
