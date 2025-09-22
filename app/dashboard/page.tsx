"use client";

import { useMemo, useEffect, useState, type ReactNode } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useExpenses } from "@/lib/useExpenses";
import { fmtCurrency } from "@/lib/format";
import AIAssist from "@/components/AIAssist";
import Link from "next/link";
import AuroraBackground from "@/components/AuroraBackground";

// Date helpers
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function inRange(date: Date, start: Date, end: Date) {
  return date >= start && date <= end;
}

// UI bits (unchanged except for types)
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
    <div className={`rounded-2xl border border-white/0 bg-gradient-to-br ${gradient} backdrop-blur-xl bg-white/[0.02] p-6 shadow-md`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          <p className="text-sm font-medium text-white/90">{title}</p>
        </div>
      </div>
      <p className="text-white/60 text-sm">{subtitle}</p>
    </div>
  );
}

function FeatureLink({
  title,
  subtitle,
  icon,
  href,
  gradient,
}: {
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border border-white/0 bg-gradient-to-br ${gradient} backdrop-blur-xl bg-white/[0.02] p-4 shadow transition-colors hover:bg-white/[0.04]`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <h4 className="font-semibold text-white">{title}</h4>
          <p className="text-xs text-white/60">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function Panel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/0 bg-white/[0.03] backdrop-blur-sm p-5 shadow-md">
      <h3 className="font-semibold text-white mb-3">{title}</h3>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const {
    items: subs,
    totals: subTotals,
    loading: subsLoading,
    refresh: refreshSubs,
  } = useSubscriptions();
  const {
    items: orders,
    loading: ordersLoading,
    refresh: refreshOrders,
  } = useOrders();
  const {
    totals: expenseTotals,
    loading: expensesLoading,
    refresh: refreshExpenses,
  } = useExpenses();
  const [_refreshKey, setRefreshKey] = useState(0); // underscore silences lint

  useEffect(() => {
    const handleDataRefresh = () => {
      const tasks: Array<Promise<unknown>> = [];
      if (typeof refreshSubs === "function") tasks.push(refreshSubs());
      if (typeof refreshOrders === "function") tasks.push(refreshOrders());
      if (typeof refreshExpenses === "function") tasks.push(refreshExpenses());
      void Promise.allSettled(tasks);
      setRefreshKey((prev) => prev + 1);
    };
    window.addEventListener("needix-data-refresh", handleDataRefresh);
    return () =>
      window.removeEventListener("needix-data-refresh", handleDataRefresh);
  }, [refreshSubs, refreshOrders, refreshExpenses]);

  const { ordersThisMonthTotal, totalMonthlySpend } = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const ordersTotal = orders.reduce((sum, o) => {
      if (!o.amount || o.status !== "active") return sum;
      const d =
        o.type === "recurring"
          ? o.nextDate
            ? new Date(`${o.nextDate}T00:00:00`)
            : null
          : o.scheduledDate
          ? new Date(`${o.scheduledDate}T00:00:00`)
          : null;
      return d && inRange(d, monthStart, monthEnd) ? sum + o.amount : sum;
    }, 0);

    const totalSpend = (subTotals?.monthly || 0) + (expenseTotals?.monthly || 0);
    return { ordersThisMonthTotal: ordersTotal, totalMonthlySpend: totalSpend };
  }, [orders, subTotals, expenseTotals]); // removed `subs` from deps

  const isLoading = subsLoading || ordersLoading || expensesLoading;

  const handleAISuccess = () => {
    const tasks: Array<Promise<unknown>> = [];
    if (typeof refreshSubs === "function") tasks.push(refreshSubs());
    if (typeof refreshOrders === "function") tasks.push(refreshOrders());
    if (typeof refreshExpenses === "function") tasks.push(refreshExpenses());
    void Promise.allSettled(tasks);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <header className="rounded-3xl border border-white/0 bg-white/[0.03] backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Financial Dashboard</h1>
          <p className="mt-2 text-white/70">
            Your complete financial overview — track subscriptions, orders, and expenses all in one place.
          </p>

          {/* Action cards: Subscriptions, Orders, Expenses, Add with AI (swapped order) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FeatureLink
              title="Subscriptions"
              subtitle="Track a new recurring service"
              icon="🧾"
              href="/dashboard/subscriptions"
              gradient="from-purple-500/15 to-fuchsia-500/10"
            />

            <FeatureLink
              title="Orders"
              subtitle="Monitor a scheduled purchase"
              icon="📦"
              href="/dashboard/orders"
              gradient="from-sky-500/15 to-blue-600/10"
            />

            {/* Expenses moved before Add with AI */}
            <FeatureLink
              title="Expenses"
              subtitle="Record a monthly expense"
              icon="💸"
              href="/dashboard/expenses"
              gradient="from-emerald-500/15 to-green-600/10"
            />

            {/* Add with AI now last, with a single robot emoji */}
            <div className="rounded-xl border border-white/0 bg-gradient-to-br from-cyan-500/12 to-purple-500/10 backdrop-blur-xl p-3 shadow">
              <AIAssist
                buttonLabel=" Add with AI"
                className="w-full justify-center border border-white/0 bg-white/[0.02] hover:bg-white/[0.05]"
                onSuccess={handleAISuccess}
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Monthly Spend"
            value={fmtCurrency(totalMonthlySpend)}
            subtitle="All recurring costs"
            gradient="from-purple-700/15 to-purple-900/10"
            icon="🌸"
          />
          <StatCard
            title="Subscriptions"
            value={fmtCurrency(subTotals?.monthly ?? 0)}
            subtitle={`${subs.length} active`}
            gradient="from-indigo-700/15 to-indigo-900/10"
            icon="🧾"
          />
          <StatCard
            title="Monthly Expenses"
            value={fmtCurrency(expenseTotals?.monthly ?? 0)}
            subtitle={`${expenseTotals?.essential ? Math.round(expenseTotals.essential) : 0}% essential`}
            gradient="from-green-700/15 to-green-900/10"
            icon="📊"
          />
          <StatCard
            title="Orders This Month"
            value={fmtCurrency(ordersThisMonthTotal)}
            subtitle={`${orders.filter((o) => o.status === "active").length} tracked`}
            gradient="from-cyan-700/15 to-cyan-900/10"
            icon="📦"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Upcoming This Week">{/* ... */}</Panel>
          <Panel title="Financial Insights">
            <div className="rounded-lg bg-white/[0.04] border border-white/0 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-white/50">Annual Spending</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {fmtCurrency((totalMonthlySpend || 0) * 12)}
              </p>
            </div>
          </Panel>
          <Panel title="Quick Actions">
            <div className="space-y-3">
              <Link
                href="/dashboard/subscriptions"
                className="block rounded-lg border border-white/0 bg-gradient-to-r from-purple-600/10 to-fuchsia-600/10 px-4 py-3 text-sm text-white hover:bg-white/[0.05]"
              >
                Add Subscription <span className="ml-2 text-white/60">— Track a new recurring service</span>
              </Link>
              <Link
                href="/dashboard/expenses"
                className="block rounded-lg border border-white/0 bg-gradient-to-r from-emerald-600/10 to-green-600/10 px-4 py-3 text-sm text-white hover:bg-white/[0.05]"
              >
                Log Expense <span className="ml-2 text-white/60">— Record a monthly expense</span>
              </Link>
              <Link
                href="/dashboard/orders"
                className="block rounded-lg border border-white/0 bg-gradient-to-r from-sky-600/10 to-blue-600/10 px-4 py-3 text-sm text-white hover:bg-white/[0.05]"
              >
                Track Order <span className="ml-2 text-white/60">— Monitor a scheduled purchase</span>
              </Link>
            </div>
          </Panel>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{/* ... */}</div>
      </div>

      {isLoading && (
        <div className="fixed top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2">
          <div className="flex items-center gap-2 text-white/80">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin"></div>
            <span className="text-sm">Syncing data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
