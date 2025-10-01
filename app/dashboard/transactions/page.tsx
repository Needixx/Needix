// app/dashboard/transactions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
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
    loadTransactions();
    detectSubscriptions();
  }, []);

  // Close dropdown when clicking outside
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
        
        // Mark this transaction as imported
        setImportedTransactions(prev => new Set(prev).add(transaction.id));
        
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
    
    // Entertainment
    if (merchantName.includes('climbing') || merchantName.includes('trampoline') ||
        merchantName.includes('cinema') || merchantName.includes('movie') ||
        merchantName.includes('theater') || merchantName.includes('theatre') ||
        merchantName.includes('amusement') || merchantName.includes('arcade') ||
        merchantName.includes('bowling') || merchantName.includes('golf') ||
        merchantName.includes('museum') || merchantName.includes('zoo') ||
        merchantName.includes('aquarium') || merchantName.includes('park') ||
        merchantName.includes('fun') || merchantName.includes('entertainment') ||
        categories.some(c => c.includes('entertainment') || c.includes('recreation'))) {
      return 'Entertainment';
    }
    
    // Transportation & Travel
    if (merchantName.includes('airline') || merchantName.includes('airways') ||
        merchantName.includes('flight') || merchantName.includes('airport') ||
        merchantName.includes('rental car') || merchantName.includes('car rental') ||
        merchantName.includes('hertz') || merchantName.includes('enterprise') ||
        merchantName.includes('budget') || merchantName.includes('avis') ||
        merchantName.includes('uber') || merchantName.includes('lyft') ||
        merchantName.includes('taxi') || merchantName.includes('gas') ||
        merchantName.includes('shell') || merchantName.includes('chevron') ||
        merchantName.includes('exxon') || merchantName.includes('bp') ||
        categories.some(c => c.includes('transportation') || c.includes('travel') || c.includes('airlines'))) {
      return 'Transportation';
    }
    
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
    
    // Shopping
    if (merchantName.includes('amazon') || merchantName.includes('target') ||
        merchantName.includes('walmart') || merchantName.includes('costco') ||
        merchantName.includes('ebay') || merchantName.includes('etsy') ||
        categories.some(c => c.includes('shop') || c.includes('retail'))) {
      return 'Shopping';
    }
    
    // Streaming & Subscriptions
    if (merchantName.includes('netflix') || merchantName.includes('spotify') ||
        merchantName.includes('hulu') || merchantName.includes('disney') ||
        merchantName.includes('apple') || merchantName.includes('youtube') ||
        merchantName.includes('prime video') || merchantName.includes('hbo')) {
      return 'Streaming';
    }
    
    if (transaction.subcategory) {
      return transaction.subcategory;
    }
    
    if (categories.length > 0) {
      return categories[0];
    }
    
    return 'Other';
  };

  // Smart categorization for import
  const categorizeTransaction = (transaction: Transaction): CategoryType => {
    const merchantName = (transaction.merchantName || transaction.name).toLowerCase();
    const categories = transaction.category.map(c => c.toLowerCase());
    
    // Check if it's marked as subscription by Plaid
    if (transaction.isSubscription) {
      return 'subscription';
    }
    
    // Check for common subscription services
    if (merchantName.includes('netflix') || merchantName.includes('spotify') ||
        merchantName.includes('hulu') || merchantName.includes('disney') ||
        merchantName.includes('apple') || merchantName.includes('youtube') ||
        merchantName.includes('prime') || merchantName.includes('subscription') ||
        categories.some(c => c.includes('subscription') || c.includes('membership'))) {
      return 'subscription';
    }
    
    // Check for credit card payments and bill payments (expenses)
    if (merchantName.includes('payment') || merchantName.includes('credit card') ||
        merchantName.includes('autopay') || merchantName.includes('bill pay') ||
        merchantName.includes('online payment') || merchantName.includes('pymt') ||
        categories.some(c => c.includes('payment') || c.includes('credit card') || c.includes('bill'))) {
      return 'expense';
    }
    
    // Check for utilities and services (likely expenses)
    if (merchantName.includes('electric') || merchantName.includes('gas') ||
        merchantName.includes('water') || merchantName.includes('internet') ||
        merchantName.includes('phone') || merchantName.includes('insurance') ||
        merchantName.includes('rent') || merchantName.includes('mortgage') ||
        categories.some(c => 
          c.includes('utilities') || c.includes('insurance') || 
          c.includes('phone') || c.includes('internet'))) {
      return 'expense';
    }
    
    // Check for shopping/orders
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

  const categoryTotals = transactions.reduce((acc, t) => {
    const category = categorizeTransaction(t);
    acc[category] = (acc[category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const subscriptionTotal = categoryTotals.subscription || 0;
  const orderTotal = categoryTotals.order || 0;
  const expenseTotal = categoryTotals.expense || 0;
  const otherTotal = categoryTotals.other || 0;

  // Filter and sort transactions
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
      <div className="relative min-h-screen">
        {/* Background - same as other dashboard pages */}
        <div className="fixed inset-0 bg-black -z-10" />
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
        
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background - same as other dashboard pages */}
      <div className="fixed inset-0 bg-black -z-10" />
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900 -z-10" />
      
      <div className="relative z-10 p-6">
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
              {/* Sort Dropdown */}
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
                              {/* Show "Added" indicator if already imported */}
                              {importedTransactions.has(t.id) ? (
                                <div className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 bg-green-500/20 text-green-300 border border-green-500/30">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  Added
                                </div>
                              ) : (
                                <>
                                  {/* Import Button with Dropdown */}
                                  <button
                                    onClick={() => {
                                      if (isImporting) return;
                                      setSelectedTransaction(isDropdownOpen ? null : t);
                                    }}
                                    disabled={isImporting}
                                    className={`
                                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1
                                      ${isImporting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                                      ${isDropdownOpen ? 'bg-white/20' : 'bg-white/10'}
                                      text-white border border-white/20
                                    `}
                                  >
                                    {isImporting ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        Importing...
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        Import
                                        <ChevronDown className="w-3 h-3" />
                                      </>
                                    )}
                                  </button>

                                  {/* Dropdown Menu */}
                                  {isDropdownOpen && !isImporting && (
                                    <div 
                                      className="absolute right-0 top-full mt-2 bg-slate-800 border border-white/20 rounded-lg shadow-xl p-2 min-w-[180px] z-50"
                                    >
                                      <div className="text-xs text-white/40 px-3 py-1 mb-1">Import as:</div>
                                      
                                      <button
                                        onClick={() => importTransaction(t, 'subscription')}
                                        className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-purple-500/20 transition-colors flex items-center gap-2"
                                      >
                                        <Receipt className="w-4 h-4 text-purple-400" />
                                        <span>Subscription</span>
                                        {suggestedType === 'subscription' && (
                                          <span className="ml-auto text-xs text-purple-400">✓ Suggested</span>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => importTransaction(t, 'order')}
                                        className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-blue-500/20 transition-colors flex items-center gap-2"
                                      >
                                        <ShoppingCart className="w-4 h-4 text-blue-400" />
                                        <span>Order</span>
                                        {suggestedType === 'order' && (
                                          <span className="ml-auto text-xs text-blue-400">✓ Suggested</span>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => importTransaction(t, 'expense')}
                                        className="w-full text-left px-3 py-2 rounded-md text-sm text-white hover:bg-green-500/20 transition-colors flex items-center gap-2"
                                      >
                                        <DollarSign className="w-4 h-4 text-green-400" />
                                        <span>Expense</span>
                                        {(suggestedType === 'expense' || suggestedType === 'other') && (
                                          <span className="ml-auto text-xs text-green-400">✓ Suggested</span>
                                        )}
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
    </div>
  );
}