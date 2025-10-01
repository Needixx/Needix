// app/dashboard/page.tsx
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

// UI bits
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
    items: expenses,
    totals: expenseTotals,
    loading: expensesLoading,
    refresh: refreshExpenses,
  } = useExpenses();
  const [_refreshKey, setRefreshKey] = useState(0);

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
      const orderType = o.type as 'one-time' | 'recurring';
      const d =
        orderType === "recurring"
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
  }, [orders, subTotals, expenseTotals]);

  // Calculate weekly spending
  const weeklySpending = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Weekly subscriptions (use price, not amount)
    const weeklySubTotal = subs.reduce((sum, s) => {
      if (!s.nextBillingDate) return sum;
      const nextBilling = new Date(`${s.nextBillingDate}T00:00:00`);
      if (nextBilling >= startOfWeek && nextBilling <= endOfWeek) {
        return sum + (s.price || 0);
      }
      return sum;
    }, 0);

    // Weekly orders
    const weeklyOrderTotal = orders.reduce((sum, o) => {
      const orderType = o.type as 'one-time' | 'recurring';
      const orderDate = orderType === 'recurring' && o.nextDate
        ? new Date(`${o.nextDate}T00:00:00`)
        : o.scheduledDate
        ? new Date(`${o.scheduledDate}T00:00:00`)
        : null;
      
      if (orderDate && orderDate >= startOfWeek && orderDate <= endOfWeek) {
        return sum + (o.amount || 0);
      }
      return sum;
    }, 0);

    // Weekly expenses (monthly / 4 weeks)
    const weeklyExpenseTotal = (expenseTotals?.monthly || 0) / 4;

    return weeklySubTotal + weeklyOrderTotal + weeklyExpenseTotal;
  }, [subs, orders, expenseTotals]);

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

          {/* Action cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <FeatureLink
              title="Subscriptions"
              subtitle="Track recurring services"
              icon="🧾"
              href="/dashboard/subscriptions"
              gradient="from-purple-500/15 to-fuchsia-500/10"
            />

            <FeatureLink
              title="Orders"
              subtitle="Monitor scheduled purchases"
              icon="📦"
              href="/dashboard/orders"
              gradient="from-sky-500/15 to-indigo-600/10"
            />

            <FeatureLink
              title="Expenses"
              subtitle="Record monthly expenses"
              icon="💸"
              href="/dashboard/expenses"
              gradient="from-emerald-500/15 to-green-600/10"
            />

            <FeatureLink
              title="Transactions"
              subtitle="View bank transactions"
              icon="💳"
              href="/dashboard/transactions"
              gradient="from-cyan-500/15 to-blue-600/10"
            />

            <div className="rounded-xl border border-white/0 bg-gradient-to-br from-orange-500/12 to-amber-500/10 backdrop-blur-xl p-3 shadow">
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
            subtitle="Total Cost"
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
            subtitle={`${expenseTotals?.essential && expenseTotals?.monthly ? Math.round((expenseTotals.essential / expenseTotals.monthly) * 100) : 0}% essential`}
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
          {/* Upcoming This Week */}
          <Panel title="Upcoming This Week">
            {(() => {
              const now = new Date();
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
              startOfWeek.setHours(0, 0, 0, 0);
              
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              endOfWeek.setHours(23, 59, 59, 999);

              // Get subscriptions due this week
              const weeklySubscriptions = subs.filter(s => {
                if (!s.nextBillingDate) return false;
                const nextBilling = new Date(`${s.nextBillingDate}T00:00:00`);
                return nextBilling >= startOfWeek && nextBilling <= endOfWeek;
              });

              // Get orders scheduled this week
              const weeklyOrders = orders.filter(o => {
                const orderType = o.type as 'one-time' | 'recurring';
                const orderDate = orderType === 'recurring' && o.nextDate
                  ? new Date(`${o.nextDate}T00:00:00`)
                  : o.scheduledDate
                  ? new Date(`${o.scheduledDate}T00:00:00`)
                  : null;
                
                return orderDate && orderDate >= startOfWeek && orderDate <= endOfWeek;
              });

              // Get expenses due this week
              const weeklyExpenses = expenses.filter(e => {
                if (!e.isRecurring) return false;
                const expenseDate = e.nextPaymentDate || e.dueDate;
                if (!expenseDate) return false;
                const date = new Date(expenseDate);
                return date >= startOfWeek && date <= endOfWeek;
              });

              const hasItems = weeklySubscriptions.length > 0 || weeklyOrders.length > 0 || weeklyExpenses.length > 0;

              if (!hasItems) {
                return (
                  <div className="text-center py-8 text-white/60">
                    <p className="text-lg">🎉 No items due this week</p>
                    <p className="text-sm mt-2">Enjoy your week!</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {/* Subscriptions */}
                  {weeklySubscriptions.map((sub) => (
                    <div key={`sub-${sub.id}`} className="flex items-center justify-between rounded-xl bg-purple-500/10 border border-purple-500/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                        <div>
                          <p className="text-white/90 font-medium">{sub.name}</p>
                          <p className="text-xs text-white/50">
                            {sub.nextBillingDate ? new Date(`${sub.nextBillingDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-purple-300">{fmtCurrency(sub.price || 0)}</span>
                    </div>
                  ))}

                  {/* Orders */}
                  {weeklyOrders.map((order) => (
                    <div key={`order-${order.id}`} className="flex items-center justify-between rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <div>
                          <p className="text-white/90 font-medium">{order.name}</p>
                          <p className="text-xs text-white/50">
                            {(() => {
                              const orderType = order.type as 'one-time' | 'recurring';
                              const orderDate = orderType === 'recurring' && order.nextDate
                                ? new Date(`${order.nextDate}T00:00:00`)
                                : order.scheduledDate
                                ? new Date(`${order.scheduledDate}T00:00:00`)
                                : null;
                              return orderDate ? orderDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'No date';
                            })()}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-blue-300">{fmtCurrency(order.amount || 0)}</span>
                    </div>
                  ))}

                  {/* Expenses */}
                  {weeklyExpenses.map((expense) => (
                    <div key={`expense-${expense.id}`} className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/20 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <div>
                          <p className="text-white/90 font-medium">{expense.name}</p>
                          <p className="text-xs text-white/50">
                            {new Date(expense.nextPaymentDate || expense.dueDate || '').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-300">{fmtCurrency(expense.amount || 0)}</span>
                    </div>
                  ))}

                  {/* Total */}
                  {hasItems && (
                    <div className="pt-3 mt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-sm">Total This Week</span>
                        <span className="text-white font-bold text-lg">
                          {fmtCurrency(
                            weeklySubscriptions.reduce((sum, s) => sum + (s.price || 0), 0) +
                            weeklyOrders.reduce((sum, o) => sum + (o.amount || 0), 0) +
                            weeklyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </Panel>

          {/* Financial Insights */}
          <Panel title="Financial Insights">
            <div className="space-y-3">
              {/* Weekly Spending */}
              <div className="rounded-lg bg-white/[0.04] border border-white/0 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-white/50">Weekly Spending</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {fmtCurrency(weeklySpending)}
                </p>
                <p className="text-xs text-white/40 mt-1">Expected for this week</p>
              </div>

              {/* Monthly Spending */}
              <div className="rounded-lg bg-white/[0.04] border border-white/0 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-white/50">Monthly Spending</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {fmtCurrency(totalMonthlySpend || 0)}
                </p>
                <p className="text-xs text-white/40 mt-1">All recurring costs</p>
              </div>

              {/* Annual Spending */}
              <div className="rounded-lg bg-white/[0.04] border border-white/0 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-white/50">Annual Spending</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {fmtCurrency((totalMonthlySpend || 0) * 12)}
                </p>
                <p className="text-xs text-white/40 mt-1">Projected yearly total</p>
              </div>
            </div>
          </Panel>

          {/* Quick Actions */}
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
              <Link
                href="/dashboard/transactions"
                className="block rounded-lg border border-white/0 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 px-4 py-3 text-sm text-white hover:bg-white/[0.05]"
              >
                View Transactions <span className="ml-2 text-white/60">— Check your bank activity</span>
              </Link>
            </div>
          </Panel>
        </div>
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