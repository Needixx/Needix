// components/ImportCsv.tsx
"use client";

import { useMemo, useState } from "react";
import type { Subscription, BillingPeriod } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Mapping = {
  name?: number;
  price?: number;
  currency?: number;
  period?: number;
  nextBillingDate?: number;
  category?: number;
  notes?: number;
};

type PreviewRow = {
  name: string;
  price: number;
  currency: string;
  period: BillingPeriod;
  nextBillingDate?: string;
  category?: string;
  notes?: string;
  errors: string[];
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        cur.push(field.trim());
        field = "";
      } else if (ch === "\n") {
        cur.push(field.trim());
        rows.push(cur);
        cur = [];
        field = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        field += ch;
      }
    }
  }
  if (field.length || cur.length) {
    cur.push(field.trim());
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.length));
}

function normalizePeriod(p: string): BillingPeriod {
  const v = (p || "").toLowerCase().trim();
  if (v === "monthly" || v === "yearly" || v === "weekly" || v === "custom") return v;
  return "monthly";
}

function isYMD(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default function ImportCsv({ onImport }: { onImport: (rows: Subscription[]) => void }) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Mapping>({});
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const toast = useToast();

  async function handleFile(file: File): Promise<void> {
    const text = await file.text();
    const parsed = parseCSV(text);
    if (parsed.length === 0) return;

    // ✅ After the guard, assert non-null so hdr is string[]
    const hdr = parsed[0]!;
    const rest = parsed.slice(1);

    setFileName(file.name);
    setHeaders(hdr);
    setRows(rest);

    // Auto-map using case-insensitive header names
    const lower = hdr.map((h) => (h || "").toLowerCase());
    const auto: Mapping = {};

    const want: Array<[keyof Mapping, string[]]> = [
      ["name", ["name", "service"]],
      ["price", ["price", "amount"]],
      ["currency", ["currency"]],
      ["period", ["period", "billing period"]],
      ["nextBillingDate", ["nextbillingdate", "next billing date", "next_renewal", "renewal"]],
      ["category", ["category"]],
      ["notes", ["notes", "note"]],
    ];

    for (const [k, names] of want) {
      for (const n of names) {
        const idx = lower.indexOf(n);
        if (idx >= 0) {
          auto[k] = idx;
          break;
        }
      }
    }
    setMap(auto);
    setOpen(true);
  }

  const preview: PreviewRow[] = useMemo(() => {
    return rows.map((r) => {
      const name = map.name !== undefined ? r[map.name] ?? "" : "";
      const priceStr = map.price !== undefined ? r[map.price] ?? "" : "";
      const currency = (map.currency !== undefined ? r[map.currency] ?? "" : "") || defaultCurrency;
      const periodStr =
        (map.period !== undefined ? r[map.period] ?? "monthly" : "monthly") || "monthly";
      const dateStr = map.nextBillingDate !== undefined ? r[map.nextBillingDate] ?? "" : "";
      const category = map.category !== undefined ? r[map.category] ?? "" : "";
      const notes = map.notes !== undefined ? r[map.notes] ?? "" : "";

      const errors: string[] = [];
      if (!name) errors.push("Missing name");

      const priceNum = Number(priceStr);
      if (Number.isNaN(priceNum)) errors.push("Invalid price");

      const period = normalizePeriod(periodStr);
      if (dateStr && !isYMD(dateStr)) errors.push("Date must be YYYY-MM-DD");

      return {
        name,
        price: Number.isNaN(priceNum) ? 0 : priceNum,
        currency,
        period,
        nextBillingDate: dateStr || undefined,
        category: category || undefined,
        notes: notes || undefined,
        errors,
      };
    });
  }, [rows, map, defaultCurrency]);

  const validCount = useMemo(
    () => preview.filter((p) => p.name && p.errors.length === 0).length,
    [preview]
  );

  function doImport(): void {
    const nowISO = new Date().toISOString();
    const subs: Subscription[] = preview
      .filter((p) => p.name && p.errors.length === 0)
      .map((p) => ({
        id: crypto.randomUUID(),
        name: p.name,
        price: p.price,
        currency: p.currency,
        period: p.period,
        nextBillingDate: p.nextBillingDate,
        category: p.category,
        notes: p.notes,
        createdAt: nowISO,
        updatedAt: nowISO,
      }));

    onImport(subs);
    toast(`Imported ${subs.length} rows`, subs.length ? "success" : "info");
    setOpen(false);
    setRows([]);
    setHeaders([]);
    setMap({});
  }

  return (
    <>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5">
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.currentTarget.files?.[0];
            if (f) void handleFile(f);
            e.currentTarget.value = "";
          }}
        />
        <span>Import CSV</span>
      </label>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl border border-white/10 bg-neutral-900 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">Import CSV</div>
                  <div className="text-xs text-white/60">{fileName}</div>
                </div>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Close
                </Button>
              </div>

              {/* Mapping */}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                {(
                  ["name", "price", "currency", "period", "nextBillingDate", "category", "notes"] as const
                ).map((k) => (
                  <label key={k} className="text-sm">
                    <div className="mb-1 text-white/70">{k}</div>
                    <select
                      className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
                      value={map[k] ?? ""}
                      onChange={(e) =>
                        setMap({
                          ...map,
                          [k]: e.target.value === "" ? undefined : Number(e.target.value),
                        })
                      }
                    >
                      <option value="">— Not Mapped —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h || `(column ${i + 1})`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="text-sm">
                  <div className="mb-1 text-white/70">Default currency</div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-neutral-800 px-3 py-2 text-white outline-none"
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
                  />
                </label>
              </div>

              {/* Preview */}
              <div className="mb-2 text-sm text-white/70">
                Valid rows: {validCount} / {preview.length}
              </div>
              <div className="overflow-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <thead className="bg-white/5 text-white/70">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Price</th>
                      <th className="px-3 py-2 text-left">Currency</th>
                      <th className="px-3 py-2 text-left">Period</th>
                      <th className="px-3 py-2 text-left">Next bill</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Notes</th>
                      <th className="px-3 py-2 text-left">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 50).map((r, idx) => (
                      <tr key={idx} className="border-t border-white/10">
                        <td className="px-3 py-2">
                          {r.name || <span className="text-white/40">(missing)</span>}
                        </td>
                        <td className="px-3 py-2">{r.price}</td>
                        <td className="px-3 py-2">{r.currency}</td>
                        <td className="px-3 py-2">{r.period}</td>
                        <td className="px-3 py-2">
                          {r.nextBillingDate || <span className="text-white/40">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {r.category || <span className="text-white/40">—</span>}
                        </td>
                        <td className="px-3 py-2">
                          {r.notes || <span className="text-white/40">—</span>}
                        </td>
                        <td className="px-3 py-2 text-red-400">{r.errors.join("; ")}</td>
                      </tr>
                    ))}
                    {preview.length === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-center text-white/60" colSpan={8}>
                          No rows parsed
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={doImport} disabled={!validCount}>
                  Import {validCount || ""}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
