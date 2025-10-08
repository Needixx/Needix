// app/dashboard/transactions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { RefreshCw, Plus, ChevronDown, Receipt, ShoppingCart, DollarSign, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  name: string;
  merchantName: string | null;
  amount: number;
  category: string[];
  subcategory: string | null;
  accountName: string;
  isSubscription: boolean;
}

type TransactionType = "subscription" | "order" | "expense";
type CategoryType = "subscription" | "expense" | "order" | "other";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [importedTransactions, setImportedTransactions] = useState<Set<string>>(new Set());
  const [detectedSubs, setDetectedSubs] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<CategoryType | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const toast = useToast();
  const isPro = true; // You can replace this with actual subscription check

  useEffect(() => {
    loadTransactions();
    detectSubscriptions();
  }, []);

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
      const response = await fetch(`/api/transactions/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction,
          importType: type
        })
      });

      if (response.ok) {
        toast(`Added as ${type}`, "success");
        setImportedTransactions(prev => new Set(prev).add(transaction.id));
        setSelectedTransaction(null);
      } else {
        const errorData = await response.json();
        toast(errorData.error || "Failed to import transaction", "error");
      }
    } catch (error) {
      console.error("Error importing:", error);
      toast("Failed to import transaction", "error");
    } finally {
      setImporting(null);
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction? This cannot be undone.")) {
      return;
    }

    setDeleting(transactionId);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast("Transaction deleted", "success");
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        setImportedTransactions(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      } else {
        const errorData = await response.json();
        toast(errorData.error || "Failed to delete transaction", "error");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast("Failed to delete transaction", "error");
    } finally {
      setDeleting(null);
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
              <div className="inline-block p-4 rounded-full bg-purple-500/20 mb-4">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
              <p className="text-white/60 mb-6">
                Bank transaction tracking is a Pro feature
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-white/80">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Automatic transaction syncing
              </div>
              <div className="flex items-center text-white/80">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Smart subscription detection
              </div>
              <div className="flex items-center text-white/80">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Expense categorization
              </div>
            </div>

            <Button
              onClick={() => window.location.href = '/pricing'}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      if (filterCategory === "all") return true;
      return categorizeTransaction(t) === filterCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
            💳 Bank Transactions
          </h1>
          <p className="text-white/60 text-lg">
            View and manage your synced bank transactions
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === "all"
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterCategory("subscription")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === "subscription"
                  ? "bg-purple-500/30 text-purple-300"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Subscriptions
            </button>
            <button
              onClick={() => setFilterCategory("expense")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === "expense"
                  ? "bg-orange-500/30 text-orange-300"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setFilterCategory("order")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterCategory === "order"
                  ? "bg-blue-500/30 text-blue-300"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Orders
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative sort-dropdown">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="bg-white/5"
              >
                Sort: {sortBy === "date" ? "Date" : "Amount"}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>

              {sortDropdownOpen && (
                <div className="absolute top-full right-0 mt-1 bg-slate-800 border border-white/20 rounded-lg shadow-xl p-1 min-w-[160px] z-50">
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
                    const isDeleting = deleting === t.id;
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
                                  disabled={isImporting || isDeleting}
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

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTransaction(t.id)}
                              disabled={isImporting || isDeleting}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              aria-label="Delete transaction"
                            >
                              {isDeleting ? "..." : <Trash2 className="w-3 h-3" />}
                            </Button>
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