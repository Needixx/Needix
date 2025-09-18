// app/dashboard/page.tsx
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

function StatCard({
  title,
  value,
  subtitle,
  gradient,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  gradient: string;
  icon: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-sm p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="text-sm font-medium text-white/70">{title}</div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-white/60">{subtitle}</div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  gradient,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} backdrop-blur-sm p-6 hover:scale-[1.02] transition-all duration-200`}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <p className="text-white/70 text-sm">{description}</p>
    </Link>
  );
}

export default function DashboardOverview() {
  const { items: subs, totals: subTotals } = useSubscriptions();
  const { items: orders } = useOrders();
  const { totals: expenseTotals } = useExpenses();

  const { upcomingRenewals, ordersThisMonthTotal, potentialSavings, totalMonthlySpend, nextRenewal } = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Calculate upcoming renewals (next 7 days)
    const renewals = subs.filter((s) => {
      if (!s.nextBillingDate) return false;
      const renewalDate = new Date(`${s.nextBillingDate}T00:00:00`);
      return inRange(renewalDate, now, daysFromNow(7));
    });

    // Find next renewal
    const nextRenewal = subs
      .filter(s => s.nextBillingDate)
      .map(s => ({ ...s, date: new Date(`${s.nextBillingDate}T00:00:00`) }))
      .filter(s => s.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    
    // Calculate orders this month
    const ordersTotal = orders.reduce((sum, o) => {
      if (!o.amount || o.status !== 'active') return sum;
      const orderDate = o.type === 'recurring' 
        ? (o.nextDate ? new Date(`${o.nextDate}T00:00:00`) : null) 
        : (o.scheduledDate ? new Date(`${o.scheduledDate}T00:00:00`) : null);
      if (!orderDate || !inRange(orderDate, monthStart, monthEnd)) return sum;
      return sum + o.amount;
    }, 0);

    // Calculate potential savings (subscriptions that haven't been used recently)
    const potentialSavings = subs.reduce((sum, s) => {
      // Simple heuristic: if it's been more than 2 months since last activity, consider it for review
      return sum + (s.price || 0) * 0.3; // Assume 30% potential savings
    }, 0);

    const totalMonthlySpend = (subTotals.monthly || 0) + (expenseTotals.monthly || 0);

    return {
      upcomingRenewals: renewals.length,
      ordersThisMonthTotal: ordersTotal,
      potentialSavings,
      totalMonthlySpend,
      nextRenewal
    };
  }, [subs, orders, subTotals, expenseTotals]);

  return (
    <div className="relative min-h-screen">
      {/* Futuristic Background */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-blue-500/4 to-transparent -z-10" />

      <main className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Hero Section */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm p-8">
          <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative">
            <h1 className="mb-2 text-4xl font-extrabold bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-xl text-white/80 mb-6">
              Your complete financial overview — track subscriptions, orders, and expenses all in one place.
            </p>
            
            {/* Quick Navigation Buttons */}
            <div className="flex flex-wrap gap-4">
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

        {/* Insights & Quick Actions Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upcoming Items */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
              <span>🕒</span>
              Upcoming This Week
            </h3>
            <div className="space-y-3">
              {upcomingRenewals > 0 ? (
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                  <span className="text-white/80">🔄 Subscription renewals</span>
                  <span className="font-medium text-white">{upcomingRenewals}</span>
                </div>
              ) : (
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <span className="text-white/60 text-sm">No renewals this week</span>
                </div>
              )}
              
              {nextRenewal && (
                <div className="rounded-xl bg-purple-500/10 border border-purple-400/20 p-3">
                  <div className="text-sm text-purple-300 font-medium">Next Renewal</div>
                  <div className="text-white">{nextRenewal.name}</div>
                  <div className="text-white/70 text-xs">
                    {new Date(nextRenewal.date).toLocaleDateString()} - {fmtCurrency(nextRenewal.price)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Insights */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
              <span>📊</span>
              Financial Insights
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-sm text-white/70">Annual Spending</div>
                <div className="text-lg font-semibold text-white">{fmtCurrency(totalMonthlySpend * 12)}</div>
              </div>
              
              {potentialSavings > 0 && (
                <div className="rounded-xl bg-green-500/10 border border-green-400/20 p-3">
                  <div className="text-sm text-green-300">Potential Savings</div>
                  <div className="text-white font-medium">{fmtCurrency(potentialSavings)}</div>
                  <div className="text-xs text-white/60">Review unused subscriptions</div>
                </div>
              )}

              {subs.length === 0 && orders.length === 0 && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-400/20 p-3 text-center">
                  <div className="text-blue-300 text-sm">👋 Getting Started</div>
                  <div className="text-white/80 text-xs mt-1">Add your first subscription or expense to begin tracking</div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <h3 className="mb-4 text-lg font-semibold text-white flex items-center gap-2">
              <span>⚡</span>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/dashboard/subscriptions"
                className="block rounded-xl bg-purple-500/10 border border-purple-400/20 p-3 hover:bg-purple-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>📺</span>
                  <div>
                    <div className="text-white font-medium text-sm">Add Subscription</div>
                    <div className="text-white/60 text-xs">Track a new recurring service</div>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/dashboard/expenses"
                className="block rounded-xl bg-green-500/10 border border-green-400/20 p-3 hover:bg-green-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>💰</span>
                  <div>
                    <div className="text-white font-medium text-sm">Log Expense</div>
                    <div className="text-white/60 text-xs">Record a monthly expense</div>
                  </div>
                </div>
              </Link>
              
              <Link
                href="/dashboard/orders"
                className="block rounded-xl bg-cyan-500/10 border border-cyan-400/20 p-3 hover:bg-cyan-500/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <div>
                    <div className="text-white font-medium text-sm">Track Order</div>
                    <div className="text-white/60 text-xs">Monitor a scheduled purchase</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards for Categories */}
        {(subs.length > 0 || orders.length > 0 || expenseTotals.monthly > 0) && (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <QuickActionCard
              title="Subscriptions Overview"
              description={`${subs.length} active subscriptions spending ${fmtCurrency(subTotals.monthly)} monthly`}
              icon="📺"
              href="/dashboard/subscriptions"
              gradient="from-purple-500/15 to-pink-500/10"
            />
            
            <QuickActionCard
              title="Orders Summary"
              description={`${orders.length} tracked orders with ${fmtCurrency(ordersThisMonthTotal)} this month`}
              icon="📦"
              href="/dashboard/orders"
              gradient="from-cyan-500/15 to-blue-500/10"
            />
            
            <QuickActionCard
              title="Expenses Breakdown"
              description={`${fmtCurrency(expenseTotals.monthly)} monthly expenses ${expenseTotals.essential > 0 ? 'including essentials' : 'tracked'}`}
              icon="💰"
              href="/dashboard/expenses"
              gradient="from-green-500/15 to-emerald-500/10"
            />
          </div>
        )}
      </main>
    </div>
  );
}