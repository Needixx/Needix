"use client";

import { Button } from "@/components/ui/Button";
import type { Subscription } from "@/lib/types";

export default function ImportCsv({ onImport }: { onImport: (rows: Subscription[]) => void }) {
  async function handleFile(file: File) {
    const text = await file.text();
    // Expected headers (case-insensitive): name,price,currency,period,nextBillingDate,category,notes
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [header, ...rows] = lines;
    const cols = header.toLowerCase().split(",").map((c) => c.trim());

    function col(name: string) {
      const idx = cols.indexOf(name);
      return (parts: string[]) => (idx >= 0 ? parts[idx]?.trim() : "");
    }

    const get = {
      name: col("name"),
      price: col("price"),
      currency: col("currency"),
      period: col("period"),
      nextBillingDate: col("nextbillingdate"),
      category: col("category"),
      notes: col("notes"),
    };

    const parsed: Subscription[] = rows.map((r) => {
      const parts = r.split(",");
      return {
        id: crypto.randomUUID(),
        name: get.name(parts),
        price: Number(get.price(parts) || 0),
        currency: (get.currency(parts) || "USD").toUpperCase(),
        period: (get.period(parts) as any) || "monthly",
        nextBillingDate: get.nextBillingDate(parts) || undefined,
        category: get.category(parts) || undefined,
        notes: get.notes(parts) || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }).filter((r) => r.name);

    onImport(parsed);
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5">
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.currentTarget.value = "";
        }}
      />
      <span>Import CSV</span>
    </label>
  );
}
