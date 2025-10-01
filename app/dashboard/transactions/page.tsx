// app/dashboard/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ArrowUpDown, RefreshCw, TrendingDown, TrendingUp, DollarSign, Plus } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  name: string;
  merchantName: string | null;
  amount: number;
  category: string[];
  subcategory: string | null;
  isSubscription: boolean;
  accountName: string;
}

interface DetectedSubscription {
  merchantName: string;
  amount: number;
  frequency: string;
  lastCharge: string;
  occurrences: number;
  transactions: Transaction[];
}

type TransactionType = "subscription" | "order" | "expense" | null;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [detectedSubs, setDetectedSubs] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "subscriptions">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [importType, setImportType] = useState<TransactionType>(null);
  const toast = useToast();

  useEffect(() => {
    loadTransactions();
    detectSubscriptions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await fetch("/api/integrations/plaid/transactions");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        toast("Failed to load transactions", "error");
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast("Failed to load transactions", "error");
    } finally {
      setLoading(false);
    }
  };

  const detectSubscriptions = async () => {
    try {
      const response = await fetch("/api/integrations/plaid/detect-subscriptions");
      if (response.ok) {
        const data = await response.json();
        setDetectedSubs(data.subscriptions || []);
      }
    } catch (error) {
      console.error("Error detecting subscriptions:", error);
    }
  };

  const syncTransactions = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/integrations/plaid/sync-transactions", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        toast(`Synced ${data.transactionsAdded} new transactions`, "success");
        await loadTransactions();
        await detectSubscriptions();
      } else {
        toast("Failed to sync transactions", "error");
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast("Failed to sync transactions", "error");
    } finally {
      setSyncing(false);
    }
  };

  const addSubscription = async (detected: DetectedSubscription) => {
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: detected.merchantName,
          price: detected.amount,
          period: detected.frequency === "monthly" ? "month" : "year",
          nextBillingDate: detected.lastCharge,
          category: "Banking Import",
        }),
      });

      if (response.ok) {
        toast(`Added ${detected.merchantName} to subscriptions`, "success");
      } else {
        toast("Failed to add subscription", "error");
      }
    } catch (error) {
      console.error("Error adding subscription:", error);
      toast("Failed to add subscription", "error");
    }
  };

  const importTransaction = async (transaction: Transaction, type: TransactionType) => {
    if (!type) return;

    try {
      let response;
      
      if (type === "subscription") {
        response = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: transaction.merchantName || transaction.name,
            price: transaction.amount,
            period: "month",
            nextBillingDate: transaction.date,
            category: transaction.subcategory || transaction.category[0] || "Imported",
          }),
        });
      } else if (type === "order") {
        response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: transaction.merchantName || transaction.name,
            vendor: transaction.merchantName || transaction.name,
            type: "one-time",
            amount: transaction.amount,
            currency: "USD",
            scheduledDate: transaction.date,
            category: transaction.subcategory || transaction.category[0] || "Imported",
          }),
        });
      } else if (type === "expense") {
        response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: transaction.merchantName || transaction.name,
            amount: transaction.amount,
            currency: "USD",
            date: transaction.date,
            category: transaction.subcategory || transaction.category[0] || "Other",
            recurrence: "none",
          }),
        });
      }

      if (response && response.ok) {
        toast(`Added to ${type}s successfully`, "success");
        setSelectedTransaction(null);
        setImportType(null);
      } else {
        toast(`Failed to add ${type}`, "error");
      }
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      toast(`Failed to add ${type}`, "error");
    }
  };

  const filteredTransactions = transactions
    .filter((t) => filter === "all" || t.isSubscription)
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
    });

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const subscriptionSpent = transactions
    .filter((t) => t.isSubscription)
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-white text-center">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-500/8 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-500/8 via-transparent to-transparent -z-10" />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Bank Transactions</h1>
          <p className="text-white/70">View and manage transactions from your connected bank accounts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <span className="text-white/60 text-sm">Total Spent</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${totalSpent.toFixed(2)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-5 h-5 text-pink-400" />
              <span className="text-white/60 text-sm">Subscription Charges</span>
            </div>
            <div className="text-2xl font-bold text-white">
              ${subscriptionSpent.toFixed(2)}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-white/60 text-sm">Detected Subscriptions</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {detectedSubs.length}
            </div>
          </div>
        </div>

        {/* Detected Subscriptions */}
        {detectedSubs.length > 0 && (
          <div className="mb-8 rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-400/8 to-pink-400/8 backdrop-blur-sm p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              🔍 Detected Recurring Charges
            </h2>
            <p className="text-white/70 mb-4 text-sm">
              We found {detectedSubs.length} potential subscription{detectedSubs.length !== 1 ? "s" : ""} in your transactions
            </p>
            <div className="space-y-3">
              {detectedSubs.map((sub, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div>
                    <div className="font-semibold text-white">{sub.merchantName}</div>
                    <div className="text-sm text-white/60">
                      ${sub.amount.toFixed(2)} • {sub.frequency} • {sub.occurrences} charges
                    </div>
                  </div>
                  <Button
                    onClick={() => addSubscription(sub)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Track This
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setFilter("all")}
              variant={filter === "all" ? "primary" : "outline"}
            >
              All Transactions
            </Button>
            <Button
              onClick={() => setFilter("subscriptions")}
              variant={filter === "subscriptions" ? "primary" : "outline"}
            >
              Subscriptions Only
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (sortBy === "date") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("date");
                  setSortOrder("desc");
                }
              }}
              variant="outline"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortBy === "date" ? "Date" : "Amount"}
            </Button>

            <Button
              onClick={syncTransactions}
              disabled={syncing}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60 font-medium">Date</th>
                  <th className="text-left p-4 text-white/60 font-medium">Merchant</th>
                  <th className="text-left p-4 text-white/60 font-medium">Category</th>
                  <th className="text-left p-4 text-white/60 font-medium">Account</th>
                  <th className="text-right p-4 text-white/60 font-medium">Amount</th>
                  <th className="text-center p-4 text-white/60 font-medium">Type</th>
                  <th className="text-center p-4 text-white/60 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-white/60">
                      No transactions found. Click "Sync" to fetch your latest transactions.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-white">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-white font-medium">
                        {t.merchantName || t.name}
                      </td>
                      <td className="p-4 text-white/60 text-sm">
                        {t.subcategory || t.category[0] || "Uncategorized"}
                      </td>
                      <td className="p-4 text-white/60 text-sm">{t.accountName}</td>
                      <td className="p-4 text-right text-white font-semibold">
                        ${t.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {t.isSubscription && (
                          <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                            Recurring
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="relative inline-block">
                          <Button
                            onClick={() => setSelectedTransaction(t)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Import
                          </Button>
                          
                          {selectedTransaction?.id === t.id && (
                            <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl p-2 z-10 min-w-[150px]">
                              <button
                                onClick={() => {
                                  importTransaction(t, "subscription");
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-purple-500/20 rounded"
                              >
                                📺 Subscription
                              </button>
                              <button
                                onClick={() => {
                                  importTransaction(t, "order");
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-500/20 rounded"
                              >
                                📦 Order
                              </button>
                              <button
                                onClick={() => {
                                  importTransaction(t, "expense");
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-white hover:bg-green-500/20 rounded"
                              >
                                💰 Expense
                              </button>
                              <button
                                onClick={() => setSelectedTransaction(null)}
                                className="w-full text-left px-3 py-2 text-sm text-white/60 hover:bg-white/10 rounded mt-1 border-t border-white/10"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {selectedTransaction && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}