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

// Helper function to parse date strings as local dates (avoiding timezone shifts)
function parseLocalDate(dateString: string): Date {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1; // Month is 0-indexed
  const day = parseInt(parts[2]!, 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  return new Date(year, month, day);
}

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

function ActionButton({
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
      className={`block rounded-2xl border border-white/10 bg-gradient-to-r ${gradient} backdrop-blur-sm p-4 hover:scale-[1.02] transition-all duration-200`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-white/70 text-sm">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}

function SectionCard({
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

  const { upcomingRenewals, ordersThisMonthTotal, potentialSavings, totalMonthlySpend, nextRenewal, annualSpending } = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    // Calculate upcoming renewals (next 7 days) - using parseLocalDate
    const renewals = subs.filter((s) => {
      if (!s.nextBillingDate) return false;
      const renewalDate = parseLocalDate(s.nextBillingDate);
      return inRange(renewalDate, now, daysFromNow(7));
    });

    // Find next renewal - using parseLocalDate
    const nextRenewal = subs
      .filter(s => s.nextBillingDate)
      .map(s => ({ ...s, date: parseLocalDate(s.nextBillingDate!) }))
      .filter(s => s.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    
    // Calculate orders this month - using parseLocalDate
    const ordersTotal = orders.reduce((sum, o) => {
      if (!o.amount || o.status !== 'active') return sum;
      const orderDate = o.type === 'recurring' 
        ? (o.nextDate ? parseLocalDate(o.nextDate) : null) 
        : (o.scheduledDate ? parseLocalDate(o.scheduledDate) : null);
      
      if (orderDate && inRange(orderDate, monthStart, monthEnd)) {
        return sum + o.amount;
      }
      return sum;
    }, 0);

    // Calculate potential savings (subscriptions under $5)
    const savings = subs.filter(s => s.price <= 5).length;
    
    // Calculate total monthly spend
    const total = (subTotals?.monthly || 0) + (expenseTotals?.monthly || 0) + ordersTotal;
    
    // Calculate annual spending
    const annual = total * 12;

    return {
      upcomingRenewals: renewals.length,
      ordersThisMonthTotal: ordersTotal,
      potentialSavings: savings,
      totalMonthlySpend: total,
      nextRenewal: nextRenewal || null,
      annualSpending: annual
    };
  }, [subs, orders, subTotals?.monthly, expenseTotals?.monthly]);

  return (
    <div className="relative min-h-screen">
      {/* Secure Dark Background with Subtle Accents */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-neutral-900 to-slate-900 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/6 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/6 via-transparent to-transparent -z-10" />
      
      <main className="relative mx-auto max-w-7xl px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 backdrop-blur-sm p-8">
            <h1 className="mb-3 text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Financial Dashboard
            </h1>
            <p className="text-gray-400 text-lg mb-6">
              Your complete financial overview — track subscriptions, orders, and expenses all in one place.
            </p>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <ActionButton
                title="Subscriptions"
                subtitle="Track a new recurring service"
                icon="📺"
                href="/dashboard/subscriptions"
                gradient="from-purple-500/20 to-pink-500/20"
              />
              <ActionButton
                title="Orders"
                subtitle="Monitor a scheduled purchase"
                icon="📦"
                href="/dashboard/orders"
                gradient="from-cyan-500/20 to-blue-500/20"
              />
              <ActionButton
                title="Expenses"
                subtitle="Record a monthly expense"
                icon="💰"
                href="/dashboard/expenses"
                gradient="from-green-500/20 to-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Monthly Spend"
            value={fmtCurrency(totalMonthlySpend)}
            subtitle="All recurring costs"
            gradient="from-purple-600/20 to-purple-800/20"
            icon="💸"
          />
          <StatCard
            title="Subscriptions"
            value={fmtCurrency(subTotals?.monthly || 0)}
            subtitle={`${subs.length} active`}
            gradient="from-blue-600/20 to-blue-800/20"
            icon="💳"
          />
          <StatCard
            title="Monthly Expenses"
            value={fmtCurrency(expenseTotals?.monthly || 0)}
            subtitle={`${expenseTotals?.essential ? fmtCurrency(expenseTotals.essential) + ' essential' : 'Tracked recurring expenses'}`}
            gradient="from-emerald-600/20 to-emerald-800/20"
            icon="🏠"
          />
          <StatCard
            title="Orders This Month"
            value={fmtCurrency(ordersThisMonthTotal)}
            subtitle={`${orders.length} tracked`}
            gradient="from-cyan-600/20 to-cyan-800/20"
            icon="📦"
          />
        </div>

        {/* Three Column Layout */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Upcoming This Week */}
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
                    {nextRenewal.date.toLocaleDateString()} - {fmtCurrency(nextRenewal.price)}
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
                <div className="text-lg font-semibold text-white">{fmtCurrency(annualSpending)}</div>
              </div>
              
              {potentialSavings > 0 && (
                <div className="rounded-xl bg-green-500/10 border border-green-400/20 p-3">
                  <div className="text-sm text-green-300">Potential Savings</div>
                  <div className="text-white">{fmtCurrency(potentialSavings * 3)}</div>
                  <div className="text-green-200 text-xs">Review unused subscriptions</div>
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
            <div className="space-y-2">
              <Link
                href="/dashboard/subscriptions"
                className="block rounded-xl bg-purple-500/10 border border-purple-400/20 p-3 hover:bg-purple-500/20 transition-colors"
              >
                <div className="text-sm text-purple-300">Add Subscription</div>
                <div className="text-white text-xs">Track a new recurring service</div>
              </Link>
              <Link
                href="/dashboard/expenses"
                className="block rounded-xl bg-green-500/10 border border-green-400/20 p-3 hover:bg-green-500/20 transition-colors"
              >
                <div className="text-sm text-green-300">Log Expense</div>
                <div className="text-white text-xs">Record a monthly expense</div>
              </Link>
              <Link
                href="/dashboard/orders"
                className="block rounded-xl bg-cyan-500/10 border border-cyan-400/20 p-3 hover:bg-cyan-500/20 transition-colors"
              >
                <div className="text-sm text-cyan-300">Track Order</div>
                <div className="text-white text-xs">Monitor a scheduled purchase</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SectionCard
            title="Subscriptions Overview"
            description={`${subs.length} active subscriptions spending ${fmtCurrency(subTotals?.monthly || 0)} monthly`}
            icon="📺"
            href="/dashboard/subscriptions"
            gradient="from-purple-600/15 to-indigo-600/15"
          />
          <SectionCard
            title="Orders Summary"
            description={`${orders.length} tracked orders with ${fmtCurrency(ordersThisMonthTotal)} this month`}
            icon="📦"
            href="/dashboard/orders"
            gradient="from-cyan-600/15 to-blue-600/15"
          />
          <SectionCard
            title="Expenses Breakdown"
            description={`${fmtCurrency(expenseTotals?.monthly || 0)} monthly expenses including essentials`}
            icon="💰"
            href="/dashboard/expenses"
            gradient="from-green-600/15 to-emerald-600/15"
          />
        </div>
      </main>
    </div>
  );
}