// app/dashboard/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ArrowUpDown, RefreshCw, Receipt, ShoppingCart, DollarSign, FolderOpen, Plus } from "lucide-react";

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [detectedSubs, setDetectedSubs] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "subscriptions">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
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
    if (!type || importing) return;

    setImporting(transaction.id);
    setSelectedTransaction(null);
    
    try {
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction,
          importType: type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast(`✓ Created ${type}: ${transaction.merchantName || transaction.name}`, "success");
        await loadTransactions();
      } else {
        const error = await response.json();
        toast(error.error || `Failed to import as ${type}`, "error");
      }
    } catch (error) {
      console.error("Error importing transaction:", error);
      toast("Failed to import transaction", "error");
    } finally {
      setImporting(null);
    }
  };

  // Helper function to get display category with smart categorization
  const getDisplayCategory = (transaction: Transaction): string => {
    const merchantName = (transaction.merchantName || transaction.name).toLowerCase();
    const categories = transaction.category.map(c => c.toLowerCase());
    
    // Food & Dining
    if (merchantName.includes('mcdonald') || merchantName.includes('kfc') || 
        merchantName.includes('burger') || merchantName.includes('taco bell') ||
        merchantName.includes('wendys') || merchantName.includes('chick-fil-a') ||
        merchantName.includes('subway') || merchantName.includes('pizza') ||
        merchantName.includes('domino') || merchantName.includes('restaurant') ||
        merchantName.includes('cafe') || merchantName.includes('coffee') ||
        merchantName.includes('starbucks') || merchantName.includes('dunkin')) {
      return 'Food & Dining';
    }
    
    // Transportation
    if (merchantName.includes('uber') || merchantName.includes('lyft') ||
        merchantName.includes('taxi') || merchantName.includes('gas') ||
        merchantName.includes('shell') || merchantName.includes('chevron') ||
        merchantName.includes('exxon') || merchantName.includes('bp ') ||
        merchantName.includes('parking') || merchantName.includes('transit')) {
      return 'Transportation';
    }
    
    // Streaming & Entertainment
    if (merchantName.includes('netflix') || merchantName.includes('spotify') || 
        merchantName.includes('hulu') || merchantName.includes('disney') ||
        merchantName.includes('hbo') || merchantName.includes('prime video') ||
        merchantName.includes('apple music') || merchantName.includes('youtube premium')) {
      return 'Streaming Services';
    }
    
    // Shopping
    if (merchantName.includes('amazon') || merchantName.includes('target') || 
        merchantName.includes('walmart') || merchantName.includes('best buy') ||
        merchantName.includes('costco') || merchantName.includes('ebay')) {
      return 'Shopping';
    }
    
    // Airlines & Travel
    if (merchantName.includes('airline') || merchantName.includes('airways') ||
        merchantName.includes('delta') || merchantName.includes('united') ||
        merchantName.includes('american airlines') || merchantName.includes('southwest') ||
        merchantName.includes('hotel') || merchantName.includes('airbnb')) {
      return 'Travel';
    }
    
    // Use Plaid's subcategory if available
    if (transaction.subcategory) {
      return transaction.subcategory;
    }
    
    // Use Plaid's first category
    if (transaction.category && transaction.category.length > 0) {
      return transaction.category[0];
    }
    
    return 'Uncategorized';
  };

  const filteredTransactions = transactions
    .filter((t) => {
      if (filter === "subscriptions") return t.isSubscription;
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

  // Smart categorization for spending summary
  const categorizeTransaction = (t: Transaction): CategoryType => {
    const merchantName = (t.merchantName || t.name).toLowerCase();
    const categories = t.category.map(c => c.toLowerCase());
    
    // Subscriptions - recurring services
    if (t.isSubscription || 
        categories.some(c => c.includes('subscription') || c.includes('recurring')) ||
        merchantName.includes('netflix') || merchantName.includes('spotify') || 
        merchantName.includes('hulu') || merchantName.includes('disney') ||
        merchantName.includes('hbo') || merchantName.includes('apple music') ||
        merchantName.includes('youtube premium') || merchantName.includes('adobe') ||
        merchantName.includes('microsoft 365') || merchantName.includes('dropbox')) {
      return 'subscription';
    }
    
    // Expenses - utilities, transportation, gas, bills
    if (merchantName.includes('uber') || merchantName.includes('lyft') ||
        merchantName.includes('gas') || merchantName.includes('shell') ||
        merchantName.includes('chevron') || merchantName.includes('exxon') ||
        merchantName.includes('electric') || merchantName.includes('water') ||
        merchantName.includes('internet') || merchantName.includes('phone') ||
        merchantName.includes('insurance') || merchantName.includes('rent') ||
        merchantName.includes('utility') || merchantName.includes('bill') ||
        categories.some(c => 
          c.includes('gas') || c.includes('utilities') || c.includes('insurance') ||
          c.includes('rent') || c.includes('transportation') || c.includes('taxi'))) {
      return 'expense';
    }
    
    // Orders - food, shopping, retail
    if (merchantName.includes('mcdonald') || merchantName.includes('kfc') ||
        merchantName.includes('starbucks') || merchantName.includes('restaurant') ||
        merchantName.includes('amazon') || merchantName.includes('target') ||
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

  const categoryTotals = transactions.reduce((acc, t) => {
    const category = categorizeTransaction(t);
    acc[category] = (acc[category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const subscriptionTotal = categoryTotals.subscription || 0;
  const orderTotal = categoryTotals.order || 0;
  const expenseTotal = categoryTotals.expense || 0;
  const otherTotal = categoryTotals.other || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Bank Transactions</h1>
          <p className="text-white/60">
            View and manage transactions from your connected bank accounts
          </p>
        </div>

        {/* Category Spending Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  filteredTransactions.map((t) => {
                    const suggestedType = categorizeTransaction(t);
                    const isImporting = importing === t.id;
                    // Convert "other" to "expense" for import
                    const importType: TransactionType = suggestedType === "other" ? "expense" : suggestedType;
                    
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
                          <div className="flex items-center justify-center gap-2">
                            {/* Quick Import Buttons */}
                            <button
                              onClick={() => importTransaction(t, importType)}
                              disabled={isImporting}
                              className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                ${isImporting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                                ${suggestedType === 'subscription' ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : ''}
                                ${suggestedType === 'order' ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' : ''}
                                ${suggestedType === 'expense' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : ''}
                                ${suggestedType === 'other' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' : ''}
                              `}
                              title={`Import as ${suggestedType}`}
                            >
                              {isImporting ? (
                                <span className="flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Importing...
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Plus className="w-3 h-3" />
                                  {suggestedType === 'subscription' ? '📺' : 
                                   suggestedType === 'order' ? '📦' : 
                                   suggestedType === 'expense' ? '💰' : '📁'} {suggestedType}
                                </span>
                              )}
                            </button>
                            
                            {/* More Options Button */}
                            <button
                              onClick={() => setSelectedTransaction(t)}
                              disabled={isImporting}
                              className="px-2 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="More options"
                            >
                              •••
                            </button>
                          </div>
                          
                          {/* Dropdown for alternative options */}
                          {selectedTransaction?.id === t.id && !isImporting && (
                            <div 
                              className="absolute mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl p-2 min-w-[150px] right-4"
                              style={{ zIndex: 50 }}
                            >
                              <div className="text-xs text-white/40 px-3 py-1 mb-1">Import as:</div>
                              {suggestedType !== 'subscription' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    importTransaction(t, "subscription");
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-purple-500/20 rounded"
                                >
                                  📺 Subscription
                                </button>
                              )}
                              {suggestedType !== 'order' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    importTransaction(t, "order");
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-blue-500/20 rounded"
                                >
                                  📦 Order
                                </button>
                              )}
                              {suggestedType !== 'expense' && suggestedType !== 'other' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    importTransaction(t, "expense");
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-green-500/20 rounded"
                                >
                                  💰 Expense
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTransaction(null);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-white/60 hover:bg-white/10 rounded mt-1 border-t border-white/10"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
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

      {/* Click outside to close dropdown */}
      {selectedTransaction && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 40 }}
          onClick={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}