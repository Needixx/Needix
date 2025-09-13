"use client";

import { fmtCurrency } from "@/lib/format";

export default function StatsCards({ 
  monthly, 
  activeCount, 
  renewalsNext30, 
  currency = "USD" 
}: { 
  monthly: number; 
  activeCount: number; 
  renewalsNext30: number; 
  currency?: string 
}) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Card label="Estimated monthly spend" value={fmtCurrency(monthly, currency)} />
      <Card label="Active subscriptions" value={String(activeCount)} />
      <Card label="Next 30d renewals" value={String(renewalsNext30)} />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4">
      <div className="text-sm text-white/60">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
