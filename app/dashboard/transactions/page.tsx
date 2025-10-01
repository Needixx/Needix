// app/dashboard/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import Link from "next/link";
import { ArrowUpDown, RefreshCw, Receipt, ShoppingCart, DollarSign, FolderOpen, Plus, ChevronDown } from "lucide-react";

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
type CategoryType = "subscription" | "order" | "expense" | "other";

export default function TransactionsPage() {
  const { isPro } = useSubscriptionLimit();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [detectedSubs, setDetectedSubs] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "subscriptions" | "orders" | "expenses" | "other">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [importedTransactions, setImportedTransactions] = useState<Set<string>>(new Set());
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isPro) {
      loadTransactions();
      detectSubscriptions();
    } else {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (selectedTransaction && !target.closest('.import-dropdown')) {
        setSelectedTransaction(null);
      }
      if (sortDropdownOpen && !target.closest('.sort-dropdown')) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedTransaction, sortDropdownOpen]);

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
        if (data.transactionsAdded > 0) {
          toast(`Synced ${data.transactionsAdded} new transactions!`, "success");
        } else {
          toast("Already up to date - no new transactions", "success");
        }
        await loadTransactions();
        await detectSubscriptions();
      } else {
        const errorData = await response.json();
        if (errorData.error === "No bank accounts connected") {
          toast("Please connect a bank account first", "error");
        } else {
          toast("Failed to sync transactions", "error");
        }
      }
    } catch (error) {
      console.error("Error syncing:", error);
      toast("Failed to sync transactions", "error");
    } finally {
      setSyncing(false);
    }
  };

  const importTransaction = async (transaction: Transaction, type: TransactionType) => {
    if (!type) return;
    
    setImporting(transaction.id);
    try {
      const response = await fetch(`/api/import-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction,
          type
        })
      });

      if (response.ok) {
        toast(`Added as ${type}`, "success");
        setImportedTransactions(prev => new Set(prev).add(transaction.id));
        setSelectedTransaction(null);
      } else {
        toast("Failed to import transaction", "error");
      }
    } catch (error) {
      console.error("Error importing:", error);
      toast("Failed to import transaction", "error");
    } finally {
      setImporting(null);
    }
  };

  const getDisplayCategory = (t: Transaction) => {
    if (t.subcategory) return t.subcategory;
    if (t.category && t.category.length > 0) return t.category[0];
    return "Uncategorized";
  };

  const categorizeTransaction = (t: Transaction): CategoryType => {
    if (t.isSubscription) return 'subscription';
    
    const merchantName = (t.merchantName || t.name).toLowerCase();
    const categories = t.category.map(c => c.toLowerCase());
    
    if (merchantName.includes('netflix') || merchantName.includes('spotify') ||
        merchantName.includes('hulu') || merchantName.includes('disney') ||
        merchantName.includes('apple') || merchantName.includes('youtube') ||
        merchantName.includes('subscription') || merchantName.includes('membership') ||
        categories.some(c => c.includes('subscription'))) {
      return 'subscription';
    }
    
    if (merchantName.includes('electric') || merchantName.includes('water') ||
        merchantName.includes('gas') || merchantName.includes('internet') ||
        merchantName.includes('phone') || merchantName.includes('insurance') ||
        merchantName.includes('rent') || merchantName.includes('mortgage') ||
        categories.some(c => 
          c.includes('utilities') || c.includes('insurance') || 
          c.includes('phone') || c.includes('internet'))) {
      return 'expense';
    }
    
    if (merchantName.includes('amazon') || merchantName.includes('target') ||
        merchantName.includes('walmart') || merchantName.includes('shop') ||
        merchantName.includes('store') || merchantName.includes('market') ||
        merchantName.includes('pizza') || merchantName.includes('burger') ||
        merchantName.includes('cafe') || merchantName.includes('food') ||
        categories.some(c => 
          c.includes('food') || c.includes('dining') || c.includes('restaurant') ||
          c.includes('shop') || c.includes('retail') || c.includes('grocery'))) {
      return 'order';
    }
    
    return 'other';
  };

  // PRO RESTRICTION CHECK - Show upgrade page for free users
  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
              💳 Bank Transactions
            </h1>
            <p className="text-white/60 text-lg mb-8">
              View and analyze your bank transactions
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-8 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="inline-block p-4 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 mb-4">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Pro Feature</h2>
              <p className="text-white/70">
                Bank transaction monitoring is available exclusively for Pro users
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">With Pro, you get:</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Connect your bank account securely via Plaid</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Automatic transaction syncing and categorization</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>AI-powered subscription detection from transactions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Real-time spending insights and analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Unlimited subscriptions, orders, and expenses tracking</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">$5</span>
                <span className="text-white/60 text-lg">/month</span>
              </div>
              <Link href="/#pricing">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold px-8"
                >
                  ⭐ Upgrade to Pro
                </Button>
              </Link>
              <p className="text-white/50 text-sm mt-3">30-day money-back guarantee</p>
            </div>
          </div>

          <div className="mt-8 text-center p-6 rounded-xl bg-white/5 border border-white/10">
            <p className="text-white/70 mb-3">
              <strong className="text-white">Free users:</strong> Use our Gmail Scanner to detect subscriptions from your email inbox
            </p>
            <Link href="/settings?tab=integrations">
              <Button variant="secondary">
                📧 Go to Gmail Scanner
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CONTINUE WITH FULL PRO USER EXPERIENCE
  const categoryTotals = transactions.reduce((acc, t) => {
    const category = categorizeTransaction(t);
    acc[category] = (acc[category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const subscriptionTotal = categoryTotals.subscription || 0;
  const orderTotal = categoryTotals.order || 0;
  const expenseTotal = categoryTotals.expense || 0;
  const otherTotal = categoryTotals.other || 0;

  const filteredTransactions = transactions
    .filter(t => {
      if (filter === "all") return true;
      if (filter === "subscriptions") return t.isSubscription;
      
      const category = categorizeTransaction(t);
      if (filter === "orders") return category === "order";
      if (filter === "expenses") return category === "expense";
      if (filter === "other") return category === "other";
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 p-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="text-white/60 mt-4">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💳</span>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Bank Transactions
            </h1>
          </div>
          <p className="text-white/60 text-lg">
            Monitor your bank transactions and detect recurring subscriptions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Receipt className="w-5 h-5 text-purple-400" />
              <span className="text-white/60 text-sm">Subscriptions</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${subscriptionTotal.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
              <span className="text-white/60 text-sm">Orders</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${orderTotal.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-white/60 text-sm">Expenses</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${expenseTotal.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 backdrop-blur-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-5 h-5 text-orange-400" />
              <span className="text-white/60 text-sm">Other</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${otherTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
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
              Subscriptions
            </Button>
            <Button
              onClick={() => setFilter("orders")}
              variant={filter === "orders" ? "primary" : "outline"}
            >
              Orders
            </Button>
            <Button
              onClick={() => setFilter("expenses")}
              variant={filter === "expenses" ? "primary" : "outline"}
            >
              Expenses
            </Button>
            <Button
              onClick={() => setFilter("other")}
              variant={filter === "other" ? "primary" : "outline"}
            >
              Other
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative sort-dropdown">
              <Button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                variant="outline"
              >
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort
              </Button>

              {sortDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl p-2 min-w-[160px] z-50">
                  <div className="text-xs text-white/40 px-3 py-1 mb-1">Sort by:</div>
                  
                  <button
                    onClick={() => {
                      setSortBy("date");
                      setSortOrder(sortBy === "date" && sortOrder === "desc" ? "asc" : "desc");
                      setSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <span>Date</span>
                    {sortBy === "date" && (
                      <span className="text-xs text-white/60">
                        {sortOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setSortBy("amount");
                      setSortOrder(sortBy === "amount" && sortOrder === "desc" ? "asc" : "desc");
                      setSortDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                  >
                    <span>Amount</span>
                    {sortBy === "amount" && (
                      <span className="text-xs text-white/60">
                        {sortOrder === "desc" ? "↓ High" : "↑ Low"}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

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
                  filteredTransactions.map((t) => {
                    const suggestedType = categorizeTransaction(t);
                    const isImporting = importing === t.id;
                    const isDropdownOpen = selectedTransaction?.id === t.id;
                    
                    return (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 text-white">
                          {new Date(t.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-white font-medium">
                          {t.merchantName || t.name}
                        </td>
                        <td className="p-4 text-white/60 text-sm">
                          {getDisplayCategory(t)}
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
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2 relative import-dropdown">
                            {importedTransactions.has(t.id) ? (
                              <span className="text-green-400 text-xs">✓ Added</span>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedTransaction(isDropdownOpen ? null : t)}
                                  disabled={isImporting}
                                >
                                  {isImporting ? "..." : (
                                    <>
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add
                                      <ChevronDown className="w-3 h-3 ml-1" />
                                    </>
                                  )}
                                </Button>

                                {isDropdownOpen && (
                                  <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-xl p-1 min-w-[140px] z-50">
                                    <button
                                      onClick={() => importTransaction(t, "subscription")}
                                      className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                    >
                                      <Receipt className="w-3 h-3" />
                                      Subscription
                                    </button>
                                    <button
                                      onClick={() => importTransaction(t, "order")}
                                      className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                      Order
                                    </button>
                                    <button
                                      onClick={() => importTransaction(t, "expense")}
                                      className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-white/10 flex items-center gap-2"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      Expense
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}