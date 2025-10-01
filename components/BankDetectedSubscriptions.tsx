// components/BankDetectedSubscriptions.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { AlertCircle, TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";

interface DetectedSubscription {
  merchantName: string;
  amount: number;
  frequency: string;
  lastCharge: string;
  occurrences: number;
}

export default function BankDetectedSubscriptions() {
  const [detectedSubs, setDetectedSubs] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadDetectedSubscriptions();
  }, []);

  const loadDetectedSubscriptions = async () => {
    try {
      const response = await fetch("/api/integrations/plaid/detect-subscriptions");
      if (response.ok) {
        const data = await response.json();
        setDetectedSubs(data.subscriptions?.slice(0, 5) || []); // Show top 5
      }
    } catch (error) {
      console.error("Error loading detected subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async (detected: DetectedSubscription) => {
    setAdding(detected.merchantName);
    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: detected.merchantName,
          price: detected.amount,
          period: detected.frequency === "monthly" ? "month" : detected.frequency === "yearly" ? "year" : "month",
          nextBillingDate: detected.lastCharge,
          category: "Banking Import",
        }),
      });

      if (response.ok) {
        toast(`Added ${detected.merchantName} to your subscriptions`, "success");
        // Remove from detected list
        setDetectedSubs((prev) => prev.filter((s) => s.merchantName !== detected.merchantName));
      } else {
        toast("Failed to add subscription", "error");
      }
    } catch (error) {
      console.error("Error adding subscription:", error);
      toast("Failed to add subscription", "error");
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-white/60 animate-spin" />
          <span className="ml-2 text-white/60">Scanning transactions...</span>
        </div>
      </div>
    );
  }

  if (detectedSubs.length === 0) {
    return null; // Don't show anything if no subscriptions detected
  }

  return (
    <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-r from-cyan-400/8 to-blue-400/8 backdrop-blur-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">
            Recurring Charges Detected
          </h3>
        </div>
        <Link href="/dashboard/transactions">
          <Button variant="outline" size="sm" className="text-xs">
            View All
          </Button>
        </Link>
      </div>

      <p className="text-white/70 mb-4 text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        We found {detectedSubs.length} potential subscription{detectedSubs.length !== 1 ? "s" : ""} in your bank transactions
      </p>

      <div className="space-y-3">
        {detectedSubs.map((sub) => (
          <div
            key={sub.merchantName}
            className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="flex-1">
              <div className="font-semibold text-white">{sub.merchantName}</div>
              <div className="text-sm text-white/60 mt-1">
                ${sub.amount.toFixed(2)} • {sub.frequency} • {sub.occurrences} charge{sub.occurrences !== 1 ? "s" : ""} detected
              </div>
              <div className="text-xs text-white/50 mt-1">
                Last charged: {new Date(sub.lastCharge).toLocaleDateString()}
              </div>
            </div>
            <Button
              onClick={() => addSubscription(sub)}
              disabled={adding === sub.merchantName}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 ml-4"
            >
              {adding === sub.merchantName ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                "Track This"
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link href="/dashboard/transactions">
          <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300">
            View all transactions →
          </Button>
        </Link>
      </div>
    </div>
  );
}