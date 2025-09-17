// components/ExpenseTable.tsx
"use client";

import type { Expense } from "@/lib/types/expenses";
import { fmtCurrency } from "@/lib/format";

export default function ExpenseTable({
  items,
  onDelete,
  onEdit,
}: {
  items: Expense[];
  onDelete: (id: string) => void;
  onEdit?: (expense: Expense) => void;
}) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 p-8 text-center text-white/70">
        No expenses tracked yet. Add your first expense to get started.
      </div>
    );
  }

  return (
    <div id="expense-table" className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead className="bg-white/5 text-white/70">
          <tr>
            <Th>Name</Th>
            <Th>Amount</Th>
            <Th>Category</Th>
            <Th>Frequency</Th>
            <Th>Next Due</Th>
            <Th>Type</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((expense) => (
            <tr key={expense.id} className="border-t border-white/10">
              <Td>
                <span className="font-medium">{expense.name}</span>
                {expense.notes && (
                  <div className="text-xs text-white/50 mt-1">{expense.notes}</div>
                )}
              </Td>

              <Td>
                <span className="font-medium">
                  {fmtCurrency(expense.amount, expense.currency)}
                </span>
                {expense.frequency !== 'one-time' && (
                  <div className="text-xs text-white/50">
                    /{expense.frequency.replace('-', ' ')}
                  </div>
                )}
              </Td>

              <Td>
                <span className="rounded-lg bg-white/10 px-2 py-1 text-xs">
                  {expense.category}
                </span>
              </Td>

              <Td>
                <span className="capitalize">
                  {expense.isRecurring ? expense.frequency : 'One-time'}
                </span>
              </Td>

              <Td>
                {expense.nextPaymentDate
                  ? new Date(`${expense.nextPaymentDate}T00:00:00`).toLocaleDateString()
                  : "—"}
              </Td>

              <Td>
                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${
                  expense.isEssential 
                    ? 'bg-red-500/20 text-red-300' 
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {expense.isEssential ? '🔴 Essential' : '🔵 Optional'}
                </span>
              </Td>

              <Td className="whitespace-nowrap">
                <div className="flex gap-2">
                  {onEdit && (
                    <button
                      className="rounded-lg border border-white/10 px-2 py-1 text-white/80 hover:bg-white/10"
                      onClick={() => onEdit(expense)}
                      title="Edit expense"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    className="rounded-lg border border-red-500/30 px-2 py-1 text-red-300 hover:bg-red-500/10"
                    onClick={() => onDelete(expense.id)}
                    title="Delete expense"
                  >
                    🗑️ Delete
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
  return (
    <th className="px-4 py-3 text-left font-medium">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-white ${className}`}>
      {children}
    </td>
  );
}