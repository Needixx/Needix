// components/settings/DataSettings.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type ToastFn = (message: string, variant?: "success" | "error" | "info") => void;

type SubscriptionExport = {
  name?: string;
  price?: number | string;
  currency?: string;
  billingCycle?: string;
  nextPayment?: string;
  category?: string;
  status?: string;
};

type OrderExport = {
  id?: string;
  [k: string]: unknown;
};

interface DataSettingsProps {
  subscriptions: SubscriptionExport[];
  orders: OrderExport[];
}

export default function DataSettings({ subscriptions, orders }: DataSettingsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const toast: ToastFn = useToast();

  const exportData = (format: "json" | "csv") => {
    setIsExporting(true);

    try {
      const payload = {
        subscriptions,
        orders,
        exportDate: new Date().toISOString(),
        totalSubscriptions: subscriptions.length,
        totalOrders: orders.length,
      };

      if (format === "json") {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `needix-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const csvHeaders = ["Name", "Price", "Currency", "Billing Cycle", "Next Payment", "Category", "Status"];
        const csvRows: string[][] = subscriptions.map((sub) => [
          String(sub.name ?? ""),
          String(sub.price ?? ""),
          String(sub.currency ?? ""),
          String(sub.billingCycle ?? ""),
          String(sub.nextPayment ?? ""),
          String(sub.category ?? ""),
          String(sub.status ?? "active"),
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map((row) => row.map((cell) => `"${cell.replaceAll(`"`, `""`)}"`).join(","))
          .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `needix-subscriptions-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast("Data exported successfully!", "success");
    } catch (error) {
      console.error("Export failed:", error);
      toast("Failed to export data", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const clearAllData = () => {
    const keysToRemove = [
      "needix_subscriptions",
      "needix_orders",
      "needix_expenses",
      "needix_notifications",
      "needix_app_settings",
      "needix_security",
      "needix_ai",
      "needix_integrations",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    setShowClearModal(false);
    toast("All data cleared successfully", "success");

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const totalDataSize = JSON.stringify({ subscriptions, orders }).length;
  const formattedSize = totalDataSize > 1024 ? `${(totalDataSize / 1024).toFixed(1)} KB` : `${totalDataSize} bytes`;

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">📊 Data Management</h2>
        <p className="text-white/60">Export your data or clear all stored information</p>
      </div>

      {/* Data Overview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Data Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">{subscriptions.length}</div>
            <div className="text-sm text-white/60">Subscriptions</div>
          </div>
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">{orders.length}</div>
            <div className="text-sm text-white/60">Orders</div>
          </div>
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">{formattedSize}</div>
            <div className="text-sm text-white/60">Storage Used</div>
          </div>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">📤 Export Data</h3>
            <p className="text-sm text-white/60 mt-1">Download your data in different formats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📄</span>
              <div>
                <div className="font-medium text-white">JSON Export</div>
                <div className="text-sm text-white/60">Complete data with all fields</div>
              </div>
            </div>
            <Button
              onClick={() => exportData("json")}
              disabled={isExporting}
              variant="secondary"
              className="w-full"
            >
              {isExporting ? "Exporting..." : "Export JSON"}
            </Button>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="font-medium text-white">CSV Export</div>
                <div className="text-sm text-white/60">Spreadsheet-friendly format</div>
              </div>
            </div>
            <Button
              onClick={() => exportData("csv")}
              disabled={isExporting}
              variant="secondary"
              className="w-full"
            >
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400">ℹ️</span>
            <span className="font-medium text-blue-400">Export Information</span>
          </div>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• JSON exports include all data and metadata</li>
            <li>• CSV exports are optimized for spreadsheet applications</li>
            <li>• All exports include timestamps for reference</li>
            <li>• No personal authentication data is included</li>
          </ul>
        </div>
      </div>

      {/* Clear Data */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">🗑️ Clear Data</h3>
            <p className="text-sm text-white/60 mt-1">Permanently remove all stored data</p>
          </div>
          <Button
            onClick={() => setShowClearModal(true)}
            variant="secondary"
            className="text-red-400 border-red-400/40 hover:bg-red-500/20"
          >
            Clear All Data
          </Button>
        </div>

        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-400">⚠️</span>
            <span className="font-medium text-red-400">Warning</span>
          </div>
          <p className="text-sm text-red-300">
            Clearing data will permanently delete all your subscriptions, orders, expenses, 
            and settings. This action cannot be undone. Make sure to export your data first if you want to keep it.
          </p>
        </div>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark border border-white/20 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
              <h3 className="text-xl font-bold text-white">Clear All Data</h3>
            </div>
            
            <p className="text-white/80 mb-6">
              Are you absolutely sure you want to delete all your data? 
              This will remove:
            </p>
            
            <ul className="text-sm text-white/60 space-y-1 mb-6">
              <li>• All {subscriptions.length} subscriptions</li>
              <li>• All {orders.length} orders</li>
              <li>• All expenses and transaction history</li>
              <li>• App settings and preferences</li>
              <li>• Notification settings</li>
              <li>• Integration configurations</li>
            </ul>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowClearModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={clearAllData}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                Delete Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
