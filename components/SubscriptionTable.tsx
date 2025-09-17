// components/SubscriptionTable.tsx
"use client";

import type { Subscription } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";

export default function SubscriptionTable({
  items,
  onDelete,
  onEdit,
}: {
  items: Subscription[];
  onDelete: (id: string) => void;
  onEdit?: (sub: Subscription) => void;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 p-8 text-center text-white/70">
        No subscriptions yet. Add one or import a CSV.
      </div>
    );
  }

  return (
    <div id="subscription-table" className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-white/70">
          <tr>
            <Th>Name</Th>
            <Th>Price</Th>
            <Th>Period</Th>
            <Th>Next bill</Th>
            <Th>Category</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="border-t border-white/10">
              <Td>
                <span className="font-medium">{s.name}</span>
              </Td>

              <Td>{fmtCurrency(s.price, s.currency)}</Td>

              <Td>{s.period}</Td>

              <Td>
                {s.nextBillingDate
                  ? new Date(`${s.nextBillingDate}T00:00:00`).toLocaleDateString()
                  : "—"}
              </Td>

              <Td>{s.category || "—"}</Td>

              <Td className="whitespace-nowrap">
                <div className="flex gap-2">
                  {s.link && (
                    <a
                      className="rounded-lg border border-white/10 px-2 py-1 text-white/80 hover:bg-white/10"
                      href={s.link}
                      target="_blank"
                      rel="noreferrer"
                      title="Open manage link"
                    >
                      🔗 Open
                    </a>
                  )}
                  <button
                    className="rounded-lg border border-white/10 px-2 py-1 text-white/80 hover:bg-white/10"
                    onClick={() => onEdit?.(s)}
                    aria-label={`Edit ${s.name}`}
                    title="Edit"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="rounded-lg border border-red-500/30 px-2 py-1 text-red-400 hover:bg-red-500/10"
                    onClick={() => onDelete(s.id)}
                    aria-label={`Delete ${s.name}`}
                    title="Delete"
                  >
                    Delete
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-normal">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
