// components/subscriptions/RecurringTransactions.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";

interface RecurringTransaction {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  lastDate: Date;
  frequency: number; // How many times detected
}

export function RecurringTransactions() {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurringTransactions();
  }, []);

  const fetchRecurringTransactions = async () => {
    try {
      const response = await fetch("/api/transactions/recurring");
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsSubscription = async (transaction: RecurringTransaction) => {
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: transaction.merchantName,
          amount: transaction.amount,
          currency: transaction.currency,
          interval: "monthly", // Default to monthly, user can edit later
          status: "active",
        }),
      });

      if (response.ok) {
        toast(`Added ${transaction.merchantName} as a subscription`, "success");
        // Remove from recurring transactions list
        setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      } else {
        toast("Failed to add subscription", "error");
      }
    } catch (error) {
      console.error("Error adding subscription:", error);
      toast("Failed to add subscription", "error");
    }
  };

  const handleDismiss = async (transactionId: string) => {
    // TODO: Add API endpoint to mark transaction as "not a subscription"
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    toast("Transaction dismissed", "info");
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/20 rounded w-3/4"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-white/30 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔍</span>
        <div>
          <h3 className="text-lg font-semibold text-white">
            Detected Recurring Charges
          </h3>
          <p className="text-sm text-white/60">
            We found {transactions.length} potential subscription{transactions.length !== 1 ? 's' : ''} from your bank transactions
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <h4 className="font-medium text-white">{transaction.merchantName}</h4>
              <p className="text-sm text-white/60">
                ${transaction.amount.toFixed(2)} {transaction.currency} • Detected {transaction.frequency}x
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleDismiss(transaction.id)}
                variant="secondary"
                size="sm"
              >
                Dismiss
              </Button>
              <Button
                onClick={() => handleAddAsSubscription(transaction)}
                size="sm"
              >
                Add to Subscriptions
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}