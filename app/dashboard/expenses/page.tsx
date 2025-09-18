// app/dashboard/expenses/page.tsx
"use client";

import { useState } from 'react';
import { useExpenses } from '@/lib/useExpenses';
import { useSubscriptionLimit } from '@/lib/useSubscriptionLimit';
import ExpenseTable from '@/components/ExpenseTable';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import UpgradeButton from '@/components/UpgradeButton';
import { Button } from '@/components/ui/Button';
import { fmtCurrency } from '@/lib/format';
import type { Expense } from '@/lib/types/expenses';

function StatCard({
  title,
  value,
  subtitle,
  gradient,
}: {
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-sm p-6`}>
      <div className="text-sm font-medium text-white/70">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{subtitle}</div>
    </div>
  );
}

export default function ExpensesPage() {
  const { items, totals, addExpense, updateExpense, deleteExpense } = useExpenses();
  const limitData = useSubscriptionLimit();
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Extract values for easier use
  const isPro = limitData.isPro;
  
  // Check if user can add more expenses
  const canAddExpense = isPro || items.length < 2;
  const expenseLimit = isPro ? Infinity : 2;

  const handleAddExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    addExpense(expense);
    setIsAddingExpense(false);
  };

  const handleUpdateExpense = (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, expense);
      setEditingExpense(null);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Futuristic Green/Emerald Background - Toned Down */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-green-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-teal-500/4 to-transparent -z-10" />
      
      <main className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">Your Expenses</h1>
          <p className="text-white/70">
            Track your monthly expenses and manage your budget
          </p>
          {!isPro && (
            <p className="text-green-300 text-sm mt-1">
              Using {items.length} of {expenseLimit} free expenses
            </p>
          )}
        </div>

        {/* Upgrade Banner for Free Users */}
        {!isPro && (
          <div className="mb-6 rounded-2xl border border-green-400/20 bg-gradient-to-r from-green-400/8 to-emerald-400/8 backdrop-blur-sm p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent mb-2">
                  💰 Free Plan - Expense Tracking
                </h3>
                <p className="text-white/80 mb-2">
                  Track up to 2 expenses with basic features.
                </p>
                <div className="text-sm text-white/60 mb-3">
                  Currently using <span className="font-semibold text-green-300">{items.length} of {expenseLimit}</span> free expense slots
                </div>
                <div className="text-sm text-green-300">
                  ⭐ Upgrade for unlimited expenses, advanced analytics & more!
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <UpgradeButton 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 font-semibold transform hover:scale-105 transition-all"
                />
                <div className="text-xs text-center text-white/50">30-day money back guarantee</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Monthly Total"
            value={fmtCurrency(totals.monthly)}
            subtitle="Recurring expenses"
            gradient="from-green-400/15 to-emerald-400/10"
          />
          <StatCard
            title="Essential"
            value={fmtCurrency(totals.essential)}
            subtitle="Must-pay expenses"
            gradient="from-red-400/15 to-rose-400/10"
          />
          <StatCard
            title="Discretionary"
            value={fmtCurrency(totals.nonEssential)}
            subtitle="Optional expenses"
            gradient="from-blue-400/15 to-cyan-400/10"
          />
          <StatCard
            title="This Month"
            value={fmtCurrency(totals.totalThisMonth)}
            subtitle="Including one-time"
            gradient="from-purple-400/15 to-pink-400/10"
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          {canAddExpense ? (
            <button
              onClick={() => setIsAddingExpense(true)}
              className="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 font-semibold text-white shadow-lg hover:from-green-400 hover:to-emerald-400 transition-all transform hover:scale-105"
            >
              + Add Expense
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                disabled 
                className="opacity-50 cursor-not-allowed bg-gray-600"
                title="Free plan limit reached - upgrade to Pro for unlimited expenses"
              >
                Add Expense (Limit Reached)
              </Button>
              <UpgradeButton variant="secondary">
                Upgrade to Pro
              </UpgradeButton>
            </div>
          )}
        </div>

        {/* Expense Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
          <ExpenseTable 
            items={items} 
            onDelete={deleteExpense}
            onEdit={setEditingExpense}
          />
        </div>

        {/* Add/Edit Expense Dialog */}
        {(isAddingExpense || editingExpense) && (
          <AddExpenseDialog
            expense={editingExpense}
            onSave={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={() => {
              setIsAddingExpense(false);
              setEditingExpense(null);
            }}
          />
        )}
      </main>
    </div>
  );
}