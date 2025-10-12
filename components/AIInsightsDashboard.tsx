// components/AIInsightsDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/components/ui/Toast";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

/** Update this if your settings path is different */
const AI_PRIVACY_SETTINGS_PATH = "/settings?tab=ai&section=ai-privacy#ai-privacy";

/**
 * Server-provided insight types (unchanged)
 */
interface Insight {
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  potentialSavings: number;
  category: string;
}

interface InsightsSummary {
  totalMonthly: number;
  totalAnnual: number;
  subscriptionCount: number;
  orderCount: number;
  expenseCount: number;
  totalItemCount: number;
  totalOrderValue?: number;
  monthlySubscriptionTotal?: number;
  monthlyExpenseTotal?: number;
  topCategories?: Array<{
    name: string;
    count: number;
    total: number;
    types?: string[];
  }>;
  message: string;
}

/**
 * OPTIONAL raw data (only used by the Deep Scan if your API returns it).
 * This is defensive: if the API doesn’t send raw, we simply skip the scan.
 */
interface RawSubscription {
  id: string;
  name: string;
  amount: number;
  interval?: "month" | "year" | "week" | "day";
  nextPaymentDate?: string | null;
  lastPaymentDate?: string | null;
  status?: "active" | "paused" | "canceled";
  tags?: string[];
}

interface RawOrder {
  id: string;
  merchant?: string;
  title?: string;
  amount: number;
  date: string; // ISO
  itemsCount?: number;
}

interface RawExpense {
  id: string;
  merchant?: string;
  title?: string;
  amount: number;
  date: string; // ISO
  recurring?: boolean;
}

interface AIInsightsData {
  insights: Insight[];
  summary: InsightsSummary;
  lastAnalyzed: string;

  // OPTIONAL raw blocks, only used if present
  rawSubscriptions?: RawSubscription[];
  rawOrders?: RawOrder[];
  rawExpenses?: RawExpense[];
}

/** Settings pulled from localStorage (unchanged) */
const getAISettings = () => {
  try {
    const stored = localStorage.getItem("needix_ai");
    return stored ? (JSON.parse(stored) as { allowDataAccess?: boolean }) : { allowDataAccess: false };
  } catch {
    return { allowDataAccess: false };
  }
};

/* -------------------------- Deep Scan helpers -------------------------- */

const normalizeName = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\.(com|net|org|io)$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|inc|llc|ltd|co|company|services|service|app|subscription|subs)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function sum(numbers: number[]): number {
  let out = 0;
  for (const n of numbers) out += n;
  return out;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function priorityForSavings(s: number): "high" | "medium" | "low" {
  if (s >= 20) return "high";
  if (s >= 8) return "medium";
  return "low";
}

/**
 * Create “duplicate subs” insights
 */
function findDuplicateSubscriptions(subs: RawSubscription[]): Insight[] {
  const active = subs.filter((s) => (s.status ?? "active") === "active");
  const byName = new Map<string, RawSubscription[]>();
  for (const s of active) {
    const key = normalizeName(s.name);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key)!.push(s);
  }

  const results: Insight[] = [];
  for (const [key, group] of byName.entries()) {
    if (group.length < 2) continue;

    const toMonthly = (amount: number, interval?: RawSubscription["interval"]) => {
      switch (interval) {
        case "year":
          return amount / 12;
        case "week":
          return (amount * 52) / 12;
        case "day":
          return (amount * 365) / 12;
        default:
          return amount; // month or undefined
      }
    };

    const monthlyCosts = group.map((g) => ({
      id: g.id,
      name: g.name,
      rawAmount: g.amount,
      monthly: toMonthly(g.amount, g.interval),
    }));

    monthlyCosts.sort((a, b) => a.monthly - b.monthly);
    const keep = monthlyCosts[0];
    const cancel = monthlyCosts.slice(1);
    const savings = sum(cancel.map((c) => c.monthly));

    if (savings > 0.01) {
      const title = `Possible duplicate subscriptions: “${group[0].name}”`;
      const description =
        `We found ${group.length} active subscriptions that appear to be the same service (${key}). ` +
        `Keeping the cheapest (${keep.name} at ~$${keep.monthly.toFixed(2)}/mo) and cancelling the rest could reduce spend.`;
      const action = `Review ${group.length} similar subs and cancel ${cancel.length} higher-priced duplicates.`;
      results.push({
        type: "duplicates:subscriptions",
        priority: priorityForSavings(savings),
        title,
        description,
        action,
        potentialSavings: Math.round(savings),
        category: "subscriptions",
      });
    }
  }
  return results;
}

/**
 * Multiple similar charges in the same month (orders + expenses)
 */
function findMonthlyDuplicateCharges(orders: RawOrder[], expenses: RawExpense[]): Insight[] {
  const byMonthName = new Map<string, number[]>();

  const push = (iso: string, label: string, amount: number) => {
    const k = `${monthKey(iso)}::${normalizeName(label)}`;
    if (!byMonthName.has(k)) byMonthName.set(k, []);
    byMonthName.get(k)!.push(amount);
  };

  for (const o of orders) {
    const label = o.merchant || o.title || "order";
    push(o.date, label, o.amount);
  }
  for (const e of expenses) {
    const label = e.merchant || e.title || "expense";
    push(e.date, label, e.amount);
  }

  const results: Insight[] = [];
  for (const [k, amounts] of byMonthName.entries()) {
    if (amounts.length < 2) continue;
    const sorted = [...amounts].sort((a, b) => a - b);
    const avoidable = sum(sorted.slice(0, Math.max(1, Math.floor(sorted.length / 2))));
    if (avoidable < 5) continue;

    const [month, norm] = k.split("::");
    results.push({
      type: "duplicates:charges",
      priority: priorityForSavings(avoidable),
      title: `Multiple charges in ${month} from "${norm}"`,
      description:
        `We detected ${amounts.length} separate charges from the same merchant/title in ${month}. ` +
        `Consider consolidating or cancelling extras.`,
      action: "Open recent Orders and Expenses, filter by amount < $3, and cancel/disable add-ons.",
      potentialSavings: Math.round(avoidable),
      category: "expenses",
    });
  }
  return results;
}

/**
 * Price hike detector for subscriptions (placeholder)
 */
function findSubscriptionPriceHikes(_subs: RawSubscription[]): Insight[] {
  return [];
}

/**
 * Nuisance micro-charges
 */
function findMicroCharges(orders: RawOrder[], expenses: RawExpense[], threshold = 3): Insight[] {
  const amounts: number[] = [];
  let count = 0;
  for (const o of orders) {
    if (o.amount > 0 && o.amount < threshold) {
      amounts.push(o.amount);
      count++;
    }
  }
  for (const e of expenses) {
    if (e.amount > 0 && e.amount < threshold) {
      amounts.push(e.amount);
      count++;
    }
  }
  const savings = Math.round(sum(amounts));
  if (count === 0 || savings < 2) return [];

  return [
    {
      type: "nuisance:micro",
      priority: priorityForSavings(savings),
      title: `Small “nuisance” charges detected (${count})`,
      description:
        `We found ${count} charges under $${threshold}. These often come from trials, add-ons, ` +
        `or per-use fees. Cancelling or adjusting them may trim waste.`,
      action: "Open recent Orders and Expenses, filter by amount < $3, and cancel/disable add-ons.",
      potentialSavings: savings,
      category: "expenses",
    },
  ];
}

/**
 * Merge & dedupe insights
 */
function mergeInsights(server: Insight[], local: Insight[]): Insight[] {
  const key = (i: Insight) => `${i.type}::${normalizeName(i.title)}`;
  const map = new Map<string, Insight>();
  for (const s of server) map.set(key(s), s);
  for (const l of local) {
    const k = key(l);
    if (!map.has(k)) map.set(k, l);
    else {
      const existing = map.get(k)!;
      existing.potentialSavings = Math.max(existing.potentialSavings, l.potentialSavings);
      const order: Record<Insight["priority"], number> = { high: 3, medium: 2, low: 1 };
      if (order[l.priority] > order[existing.priority]) existing.priority = l.priority;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.potentialSavings - a.potentialSavings);
}

/* --------------------------------------------------------------------- */

export default function AIInsightsDashboard() {
  const { isPro, isLoading: proCheckLoading } = useSubscriptionLimit();
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deepScanCount, setDeepScanCount] = useState(0);
  const toast = useToast();

  const fetchInsights = async () => {
    if (proCheckLoading) return;

    if (!isPro) {
      setError("AI Insights is a Pro feature. Upgrade to access!");
      setLoading(false);
      return;
    }

    const aiSettings = getAISettings();
    if (!aiSettings.allowDataAccess) {
      setError("AI analysis is disabled. Enable it in Settings > AI & Privacy to see insights.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/ai/insights?includeRaw=1");
      const data: AIInsightsData = await response.json();
      if (!response.ok) {
        throw new Error((data as unknown as { error?: string })?.error || "Failed to fetch insights");
      }
      setInsights(data);
    } catch (err) {
      console.error("[AI Insights] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load insights");
      toast("Failed to load AI insights", "error");
    } finally {
      setLoading(false);
    }
  };

  /** Run client-side Deep Scan (idempotent per current insights snapshot) */
  const runDeepScan = () => {
    if (!insights) return;
    const subs = insights.rawSubscriptions ?? [];
    const orders = insights.rawOrders ?? [];
    const expenses = insights.rawExpenses ?? [];

    if (subs.length === 0 && orders.length === 0 && expenses.length === 0) {
      setDeepScanCount(0);
      return;
    }

    const localFindings: Insight[] = [
      ...findDuplicateSubscriptions(subs),
      ...findMonthlyDuplicateCharges(orders, expenses),
      ...findSubscriptionPriceHikes(subs),
      ...findMicroCharges(orders, expenses),
    ];

    const merged = mergeInsights(insights.insights, localFindings);
    const added = merged.length - insights.insights.length;

    setInsights({ ...insights, insights: merged });
    setDeepScanCount(added > 0 ? added : 0);

    if (added > 0) {
      toast(`Deep Scan found ${added} additional opportunities.`, "info");
    }
  };

  // Fetch once the Pro check is done
  useEffect(() => {
    if (!proCheckLoading) {
      fetchInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, proCheckLoading]);

  // Auto-run Deep Scan after initial fetch (only once per load)
  useEffect(() => {
    if (!insights) return;
    runDeepScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insights?.lastAnalyzed]);

  // Derived: total savings
  const totalPotentialSavings = useMemo(
    () => (insights ? insights.insights.reduce((sum, i) => sum + i.potentialSavings, 0) : 0),
    [insights]
  );

  /* ----------------------------- UI ----------------------------- */

  if (proCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⚙️</div>
          <p className="text-white/60">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🤖</div>
          <p className="text-white/60">Analyzing your financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 backdrop-blur-sm p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Insights</h3>
          <p className="text-white/70 mb-6">{error}</p>
          {error.includes("Pro feature") ? (
            <Link href="/pricing">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Upgrade to Pro</Button>
            </Link>
          ) : error.includes("disabled") ? (
            <Link href={AI_PRIVACY_SETTINGS_PATH}>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Enable AI Analysis</Button>
            </Link>
          ) : (
            <Button onClick={fetchInsights} className="bg-gradient-to-r from-purple-500 to-pink-500">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <p className="text-white/60">No insights data available</p>
          <Button onClick={fetchInsights} className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500">
            Load Insights
          </Button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-400/30 bg-red-500/10";
      case "medium":
        return "border-orange-400/30 bg-orange-500/10";
      case "low":
        return "border-yellow-400/30 bg-yellow-500/10";
      default:
        return "border-white/10 bg-white/5";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">🔴 High Priority</span>;
      case "medium":
        return (
          <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded-full">🟡 Medium Priority</span>
        );
      case "low":
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">🟢 Low Priority</span>;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "subscriptions":
        return "📺";
      case "orders":
        return "📦";
      case "expenses":
        return "💰";
      case "budget":
        return "📊";
      default:
        return "💡";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "subscriptions":
        return "bg-purple-500/20 text-purple-300";
      case "orders":
        return "bg-cyan-500/20 text-cyan-300";
      case "expenses":
        return "bg-green-500/20 text-green-300";
      case "budget":
        return "bg-orange-500/20 text-orange-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-cyan-500/15 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">🤖 AI Financial Analysis</h2>
            <p className="text-sm text-white/60">Last analyzed: {new Date(insights.lastAnalyzed).toLocaleString()}</p>
            {deepScanCount > 0 && (
              <p className="text-xs text-green-300 mt-1">Deep Scan added {deepScanCount} extra findings.</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchInsights}
              className="px-3 py-1 bg-white/10 border border-white/20 text-white text-sm rounded-lg hover:bg-white/20 transition-all"
              title="Refresh"
            >
              🔄 Refresh
            </button>
            <button
              onClick={runDeepScan}
              className="px-3 py-1 bg-gradient-to-r from-purple to-cyan text-white text-sm rounded-lg hover:shadow-lg transition-all"
              title="Run Deep Scan"
            >
              🧠 Deep Scan
            </button>
          </div>
        </div>

        {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{insights.summary.totalItemCount || 0}</div>
            <div className="text-xs text-white/60">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-300">{insights.summary.subscriptionCount || 0}</div>
            <div className="text-xs text-white/60">Subscriptions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cyan-300">{insights.summary.orderCount || 0}</div>
            <div className="text-xs text-white/60">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-300">{insights.summary.expenseCount || 0}</div>
            <div className="text-xs text-white/60">Expenses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">${(insights.summary.totalMonthly || 0).toFixed(0)}</div>
            <div className="text-xs text-white/60">Monthly Recurring</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">${totalPotentialSavings.toFixed(0)}</div>
            <div className="text-xs text-white/60">Potential Savings</div>
          </div>
        </div>

        <p className="text-white/70 text-sm">{insights.summary.message || "AI analysis complete"}</p>
      </div>

      {/* Breakdown by Type */}
      {(insights.summary.monthlySubscriptionTotal ||
        insights.summary.monthlyExpenseTotal ||
        insights.summary.totalOrderValue) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.summary.monthlySubscriptionTotal !== undefined &&
            insights.summary.monthlySubscriptionTotal > 0 && (
              <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-300">Monthly Subscriptions</p>
                    <p className="text-2xl font-bold text-white">
                      ${insights.summary.monthlySubscriptionTotal.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-2xl">📺</div>
                </div>
              </div>
            )}

          {insights.summary.monthlyExpenseTotal !== undefined &&
            insights.summary.monthlyExpenseTotal > 0 && (
              <div className="rounded-xl border border-green-400/20 bg-green-500/10 backdrop-blur-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-300">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-white">
                      ${insights.summary.monthlyExpenseTotal.toFixed(0)}
                    </p>
                  </div>
                  <div className="text-2xl">💰</div>
                </div>
              </div>
            )}

          {insights.summary.totalOrderValue !== undefined && insights.summary.totalOrderValue > 0 && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 backdrop-blur-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-300">Total Order Value</p>
                  <p className="text-2xl font-bold text-white">${insights.summary.totalOrderValue.toFixed(0)}</p>
                </div>
                <div className="text-2xl">📦</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Categories */}
      {insights.summary.topCategories && insights.summary.topCategories.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Top Spending Categories</h3>
          <div className="space-y-3">
            {insights.summary.topCategories.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📍"}
                  </span>
                  <div>
                    <span className="text-white font-medium">{category.name}</span>
                    {category.types && category.types.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {category.types.map((type) => (
                          <span key={type} className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(type)}`}>
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">${category.total.toFixed(0)}</div>
                  <div className="text-xs text-white/60">{category.count} items</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights List */}
      {insights.insights.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">💡 Personalized Recommendations</h3>

          {insights.insights.map((insight, index) => (
            <div key={index} className={`rounded-2xl border backdrop-blur-sm p-6 ${getPriorityColor(insight.priority)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{getCategoryIcon(insight.category)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">{insight.title}</h4>
                      {getPriorityBadge(insight.priority)}
                    </div>
                    <p className="text-white/70 text-sm mb-3">{insight.description}</p>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-sm text-white/80">
                        <span className="font-medium">💡 Action:</span> {insight.action}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-green-400">${insight.potentialSavings.toFixed(0)}</div>
                  <div className="text-xs text-white/60">potential savings</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-white mb-2">You're Doing Great!</h3>
          <p className="text-white/60">
            No optimization opportunities found at the moment. Your finances are looking good!
          </p>
        </div>
      )}
    </div>
  );
}
