// components/DashboardOverview.tsx
"use client";

import { useMemo } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useExpenses } from "@/lib/useExpenses";
import { fmtCurrency } from "@/lib/format";
import Link from "next/link";

function startOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function daysFromNow(days: number) { return new Date(Date.now() + days * 24 * 60 * 60 * 1000); }
function inRange(date: Date, start: Date, end: Date) { return date >= start && date <= end; }

export default function DashboardOverview() {
  const { items: subs, totals: subTotals } = useSubscriptions();
  const { items: orders } = useOrders();
  const { totals: expenseTotals } = useExpenses();

  const { upcomingRenewals, ordersThisMonthTotal, potentialSavings, totalMonthlySpend } = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const renewals = subs.filter((s) => s.nextBillingDate && inRange(new Date(`${s.nextBillingDate}T00:00:00`), now, daysFromNow(30))).length;
    const ordersTotal = orders.reduce((sum, o) => {
      if (!o.amount || o.status !== 'active') return sum;
      const d = o.type === 'subscription' ? (o.nextDate ? new Date(`${o.nextDate}T00:00:00`) : null) : (o.scheduledDate ? new Date(`${o.scheduledDate}T00:00:00`) : null);
      if (d && d >= monthStart && d <= monthEnd) return sum + o.amount;
      return sum;
    }, 0);
    const savings = orders.reduce((acc, o) => {
      if (o.priceCeiling != null && o.currentPrice != null && o.currentPrice <= o.priceCeiling) {
        const s = o.priceCeiling - o.currentPrice;
        if (s > 0) return acc + s;
      }
      return acc;
    }, 0);
    
    // Calculate total monthly spend across all categories
    const totalMonthly = subTotals.monthly + ordersTotal + expenseTotals.monthly;
    
    return { 
      upcomingRenewals: renewals, 
      ordersThisMonthTotal: ordersTotal, 
      potentialSavings: savings,
      totalMonthlySpend: totalMonthly
    };
  }, [subs, orders, subTotals, expenseTotals]);

  return (
    <div className="relative min-h-screen">
      {/* Futuristic Multi-Color Background */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      {/* Multiple radial gradients for a futuristic look */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-green-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-blue-500/4 to-transparent -z-10" />

      <main className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Gradient hero */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm p-6">
          <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <h1 className="mb-1 text-3xl font-extrabold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-white/80">Your complete financial overview — subscriptions, orders, and expenses all in one place.</p>

          {/* Primary split buttons */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <Link
              href="/dashboard/subscriptions"
              className="rounded-2xl px-6 py-3 font-semibold text-sm text-white shadow-lg border border-purple-400/30 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 transform hover:scale-[1.02] transition-all duration-200"
            >
              📺 Subscriptions
            </Link>
            <Link
              href="/dashboard/orders"
              className="rounded-2xl px-6 py-3 font-semibold text-sm text-white shadow-lg border border-cyan-400/30 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 transform hover:scale-[1.02] transition-all duration-200"
            >
              📦 Orders
            </Link>
            <Link
              href="/dashboard/expenses"
              className="rounded-2xl px-6 py-3 font-semibold text-sm text-white shadow-lg border border-green-400/30 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 transform hover:scale-[1.02] transition-all duration-200"
            >
              💰 Expenses
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Monthly Spend"
            value={fmtCurrency(totalMonthlySpend)}
            subtitle="All recurring costs"
            gradient="from-purple-400/15 to-pink-400/10"
            icon="💸"
          />
          <StatCard
            title="Subscriptions"
            value={fmtCurrency(subTotals.monthly)}
            subtitle={`${subs.length} active`}
            gradient="from-purple-400/15 to-indigo-400/10"
            icon="📺"
          />
          <StatCard
            title="Monthly Expenses"
            value={fmtCurrency(expenseTotals.monthly)}
            subtitle={`${expenseTotals.essential > 0 ? fmtCurrency(expenseTotals.essential) + ' essential' : 'Track expenses'}`}
            gradient="from-green-400/15 to-emerald-400/10"
            icon="🏠"
          />
          <StatCard
            title="Orders This Month"
            value={fmtCurrency(ordersThisMonthTotal)}
            subtitle={`${orders.length} tracked`}
            gradient="from-cyan-400/15 to-blue-400/10"
            icon="📦"
          />
        </div>

        {/* Quick Actions & Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Items */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Upcoming This Month</h3>
            <div className="space-y-3">
              {upcomingRenewals > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <span className="text-white/80">🔄 Subscription renewals</span>
                  <span className="font-medium text-white">{upcomingRenewals}</span>
                </div>
              )}
              
              {expenseTotals.essential > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <span className="text-white/80">🔴 Essential expenses</span>
                  <span className="font-medium text-white">{fmtCurrency(expenseTotals.essential)}</span>
                </div>
              )}
              
              {potentialSavings > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-green-400/10 p-3">
                  <span className="text-green-300">💰 Potential savings</span>
                  <span className="font-medium text-green-300">{fmtCurrency(potentialSavings)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Budget Breakdown */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Monthly Breakdown</h3>
            <div className="space-y-3">
              <BudgetItem
                label="Subscriptions"
                amount={subTotals.monthly}
                color="purple"
              />
              <BudgetItem
                label="Essential Expenses"
                amount={expenseTotals.essential}
                color="red"
              />
              <BudgetItem
                label="Optional Expenses"
                amount={expenseTotals.nonEssential}
                color="blue"
              />
              <BudgetItem
                label="Planned Orders"
                amount={ordersThisMonthTotal}
                color="cyan"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  gradient, 
  icon 
}: { 
  title: string; 
  value: string; 
  subtitle: string; 
  gradient: string; 
  icon: string; 
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-sm p-4`}>
      <div className="flex items-center gap-2 text-sm text-white/70">
        <span>{icon}</span>
        <span>{title}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{subtitle}</div>
    </div>
  );
}

function BudgetItem({ 
  label, 
  amount, 
  color 
}: { 
  label: string; 
  amount: number; 
  color: string; 
}) {
  const colorClasses = {
    purple: 'bg-purple-400/20 text-purple-300',
    red: 'bg-red-400/20 text-red-300',
    blue: 'bg-blue-400/20 text-blue-300',
    cyan: 'bg-cyan-400/20 text-cyan-300',
  }[color] || 'bg-white/20 text-white';

  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
      <span className="text-white/80">{label}</span>
      <span className={`rounded-lg px-2 py-1 text-sm font-medium ${colorClasses}`}>
        {fmtCurrency(amount)}
      </span>
    </div>
  );
}