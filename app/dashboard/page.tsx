// app/dashboard/page.tsx
"use client";

import { useMemo, useEffect, useState, type ReactNode } from "react";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useExpenses } from "@/lib/useExpenses";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { fmtCurrency } from "@/lib/format";
import AIAssist from "@/components/AIAssist";
import Link from "next/link";
import AuroraBackground from "@/components/AuroraBackground";
import { useToast } from "@/components/ui/Toast";
import GmailScannerDialog from "@/components/settings/GmailScannerDialog";

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
  const { isPro } = useSubscriptionLimit();
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
  const [isLoading, setIsLoading] = useState(false);
  const [integrations, setIntegrations] = useState({ googleConnected: false, plaidConnected: false });
  const [loadingIntegration, setLoadingIntegration] = useState<string | null>(null);
  const [showGmailScanner, setShowGmailScanner] = useState(false);
  const toast = useToast();

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

  useEffect(() => {
    if (isPro) {
      checkIntegrations();
    }
  }, [isPro]);

  const checkIntegrations = async () => {
    try {
      const googleResponse = await fetch("/api/integrations/google/status");
      if (googleResponse.ok) {
        const { connected } = await googleResponse.json();
        setIntegrations(prev => ({ ...prev, googleConnected: connected }));
      }

      const plaidResponse = await fetch("/api/integrations/plaid/status");
      if (plaidResponse.ok) {
        const { connected } = await plaidResponse.json();
        setIntegrations(prev => ({ ...prev, plaidConnected: connected }));
      }
    } catch (error) {
      console.error("Error checking integrations:", error);
    }
  };

  const handleConnectGoogle = async () => {
    setLoadingIntegration("google");
    try {
      const popup = window.open(
        "/api/integrations/google/link",
        "google-oauth",
        "width=500,height=600,scrollbars=yes,resizable=yes"
      );
      if (popup) {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setLoadingIntegration(null);
            checkIntegrations();
          }
        }, 1000);
      } else {
        window.location.href = "/api/integrations/google/link";
      }
    } catch (error) {
      console.error("Error connecting Google:", error);
      toast("Failed to connect Google account", "error");
      setLoadingIntegration(null);
    }
  };

  const handleScanGmail = () => {
    console.log("=== SCAN GMAIL CLICKED ===");
    console.log("Current showGmailScanner state:", showGmailScanner);
    console.log("Setting showGmailScanner to true");
    setShowGmailScanner(true);
    console.log("After setState, showGmailScanner:", showGmailScanner);
  };

  const handleGmailScanComplete = (importedCount: number) => {
    console.log("Gmail scan complete, imported:", importedCount);
    toast(`Successfully imported ${importedCount} items from Gmail!`, "success");
    setShowGmailScanner(false);
  };

  const handleConnectPlaid = async () => {
    setLoadingIntegration("plaid");
    try {
      const response = await fetch("/api/integrations/plaid/create-link-token", {
        method: "POST",
      });

      if (response.ok) {
        const { link_token } = await response.json();
        
        const script = document.createElement('script');
        script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
        script.onload = () => {
          const handler = (window as any).Plaid.create({
            token: link_token,
            onSuccess: async (public_token: string, metadata: any) => {
              try {
                const exchangeResponse = await fetch("/api/integrations/plaid/exchange-token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    public_token,
                    institution: metadata.institution,
                    accounts: metadata.accounts 
                  }),
                });

                if (exchangeResponse.ok) {
                  toast("Bank account connected successfully!", "success");
                  checkIntegrations();
                } else {
                  throw new Error("Failed to connect bank account");
                }
              } catch (error) {
                console.error("Error exchanging token:", error);
                toast("Failed to complete bank connection", "error");
              }
              setLoadingIntegration(null);
            },
            onExit: (err: any, metadata: any) => {
              if (err != null) {
                console.error("Plaid Link error:", err);
                toast("Bank connection cancelled or failed", "error");
              }
              setLoadingIntegration(null);
            },
          });
          
          handler.open();
        };
        document.head.appendChild(script);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to initialize bank connection");
      }
    } catch (error) {
      console.error("Error connecting bank:", error);
      toast("Failed to connect bank account", "error");
      setLoadingIntegration(null);
    }
  };

  const handleAISuccess = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

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

    return {
      ordersThisMonthTotal: ordersTotal,
      totalMonthlySpend: (subTotals?.monthly ?? 0) + (expenseTotals?.monthly ?? 0),
    };
  }, [orders, subTotals, expenseTotals]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
              <p className="mt-2 text-base text-white/60">
                Welcome back! Here's your financial overview.
              </p>
            </div>
          </div>

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
                buttonLabel="Add with AI"
                className="w-full h-full flex items-center justify-center gap-2 border-0 bg-transparent hover:bg-white/[0.05] text-white rounded-xl py-3"
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
            gradient="from-emerald-700/15 to-emerald-900/10"
            icon="💸"
          />
          <StatCard
            title="Upcoming Orders"
            value={fmtCurrency(ordersThisMonthTotal)}
            subtitle="This month"
            gradient="from-sky-700/15 to-sky-900/10"
            icon="📦"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Overview">
            <div className="space-y-3">
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

        {/* Integration Connections - Pro Only */}
        {isPro && (
          <Panel title="🔗 Integrations">
            <div className="space-y-4">
              {/* Google/Gmail Connection */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📧</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Google Workspace</h4>
                    <p className="text-xs text-white/60">
                      {integrations.googleConnected 
                        ? "Connected - Scan Gmail for subscriptions" 
                        : "Connect to scan your Gmail"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {integrations.googleConnected ? (
                    <button
                      onClick={handleScanGmail}
                      disabled={loadingIntegration === "google"}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {loadingIntegration === "google" ? "Processing..." : "Scan Gmail"}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      disabled={loadingIntegration === "google"}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {loadingIntegration === "google" ? "Connecting..." : "Connect Google"}
                    </button>
                  )}
                </div>
              </div>

              {/* Plaid Bank Connection */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.04] border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🏦</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Bank Account</h4>
                    <p className="text-xs text-white/60">
                      {integrations.plaidConnected 
                        ? "Connected - Auto-detect transactions" 
                        : "Connect your bank via Plaid"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {integrations.plaidConnected ? (
                    <span className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium border border-green-500/30">
                      ✓ Connected
                    </span>
                  ) : (
                    <button
                      onClick={handleConnectPlaid}
                      disabled={loadingIntegration === "plaid"}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-medium transition-all disabled:opacity-50"
                    >
                      {loadingIntegration === "plaid" ? "Connecting..." : "Connect Bank"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        )}
      </div>

      {/* >>> Added dialog mount <<< */}
      <GmailScannerDialog
        isOpen={showGmailScanner}
        onClose={() => setShowGmailScanner(false)}
        onComplete={handleGmailScanComplete}
      />

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
