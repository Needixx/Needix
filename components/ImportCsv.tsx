// components/ImportCsv.tsx
"use client";

import type { Subscription, BillingPeriod } from "@/lib/types";

export default function ImportCsv({ onImport }: { onImport: (rows: Subscription[]) => void }) {
  async function handleFile(file: File) {
    const text = await file.text();
    // Expected headers (case-insensitive): name,price,currency,period,nextBillingDate,category,notes
    const lines = text.split(/\r?\n/).filter(Boolean);
    const [header, ...rows] = lines;
    
    if (!header) return;
    
    const cols = header.toLowerCase().split(",").map((c) => c.trim());

    function col(name: string) {
      const idx = cols.indexOf(name);
      return (parts: string[]) => (idx >= 0 && parts[idx] !== undefined ? parts[idx].trim() : "");
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

    // Helper function to validate billing period
    function validateBillingPeriod(period: string): BillingPeriod {
      const validPeriods: BillingPeriod[] = ["monthly", "yearly", "weekly", "custom"];
      const normalizedPeriod = period.toLowerCase().trim() as BillingPeriod;
      return validPeriods.includes(normalizedPeriod) ? normalizedPeriod : "monthly";
    }

    const parsed: Subscription[] = [];

    for (const row of rows) {
      const parts = row.split(",");
      const name = get.name(parts);
      
      // Skip rows without a name
      if (!name) continue;

      const priceStr = get.price(parts);
      const currencyStr = get.currency(parts);
      const periodStr = get.period(parts);
      const nextBillingDateStr = get.nextBillingDate(parts);
      const categoryStr = get.category(parts);
      const notesStr = get.notes(parts);

      const subscription: Subscription = {
        id: crypto.randomUUID(),
        name: name,
        price: Number(priceStr) || 0,
        currency: currencyStr || "USD",
        period: validateBillingPeriod(periodStr),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add optional fields only if they have values
      if (nextBillingDateStr) {
        subscription.nextBillingDate = nextBillingDateStr;
      }
      if (categoryStr) {
        subscription.category = categoryStr;
      }
      if (notesStr) {
        subscription.notes = notesStr;
      }

      parsed.push(subscription);
    }

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