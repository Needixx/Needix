// components/SyncTransactionsButton.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { RefreshCw } from "lucide-react";

interface SyncTransactionsButtonProps {
  onSuccess?: () => void;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export default function SyncTransactionsButton({
  onSuccess,
  className,
  variant = "primary",
  size = "md",
}: SyncTransactionsButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  const syncTransactions = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/integrations/plaid/sync-transactions", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transactionsAdded > 0) {
          toast(`Synced ${data.transactionsAdded} new transaction${data.transactionsAdded !== 1 ? 's' : ''}`, "success");
        } else {
          toast("Already up to date - no new transactions", "success");
        }
        onSuccess?.();
      } else {
        const error = await response.json();
        if (error.error === "No bank accounts connected") {
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

  return (
    <Button
      onClick={syncTransactions}
      disabled={syncing}
      variant={variant}
      size={size}
      className={className}
    >
      <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync Transactions"}
    </Button>
  );
}