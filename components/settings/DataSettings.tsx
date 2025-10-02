// components/settings/DataSettings.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useExpenses } from "@/lib/useExpenses";
import type { ExpenseCategory, ExpenseFrequency } from "@/lib/types/expenses";

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
  name?: string;
  amount?: number;
  scheduledDate?: string;
  vendor?: string;
  [k: string]: unknown;
};

type ExpenseExport = {
  id?: string;
  name?: string;
  amount?: number;
  currency?: string;
  category?: string;
  frequency?: string;
  dueDate?: string;
  isRecurring?: boolean;
  isEssential?: boolean;
  [k: string]: unknown;
};

interface DataSettingsProps {
  subscriptions: SubscriptionExport[];
  orders: OrderExport[];
}

export default function DataSettings({ subscriptions, orders }: DataSettingsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const toast: ToastFn = useToast();

  // Get hooks for importing
  const { add: addSubscription } = useSubscriptions();
  const { add: addOrder } = useOrders();
  const { addExpense, items: expenseItems } = useExpenses();

  // Get expenses from the hook instead of localStorage
  const expenses: ExpenseExport[] = expenseItems.map(exp => ({
    id: exp.id,
    name: exp.name,
    amount: exp.amount,
    currency: exp.currency,
    category: exp.category,
    frequency: exp.frequency,
    dueDate: exp.dueDate,
    isRecurring: exp.isRecurring,
    isEssential: exp.isEssential,
  }));

  // Helper to validate expense category
  const validateExpenseCategory = (cat: unknown): ExpenseCategory => {
    const validCategories: ExpenseCategory[] = [
      'Housing', 'Transportation', 'Utilities', 'Insurance', 
      'Food & Groceries', 'Healthcare', 'Debt Payments', 'Childcare',
      'Education', 'Personal Care', 'Entertainment', 'Savings & Investments', 'Other'
    ];
    
    if (typeof cat === 'string' && validCategories.includes(cat as ExpenseCategory)) {
      return cat as ExpenseCategory;
    }
    return 'Other';
  };

  // Helper to validate expense frequency
  const validateExpenseFrequency = (freq: unknown): ExpenseFrequency => {
    const validFrequencies: ExpenseFrequency[] = [
      'monthly', 'weekly', 'yearly', 'quarterly', 'bi-weekly', 'one-time'
    ];
    
    if (typeof freq === 'string' && validFrequencies.includes(freq as ExpenseFrequency)) {
      return freq as ExpenseFrequency;
    }
    return 'one-time';
  };

  const handleJsonImportClick = () => {
    if (jsonInputRef.current) {
      jsonInputRef.current.click();
    }
  };

  const handleCsvImportClick = () => {
    if (csvInputRef.current) {
      csvInputRef.current.click();
    }
  };

  const handleJsonFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let importedCount = 0;
      const errors: string[] = [];

      // Import subscriptions
      if (data.subscriptions && Array.isArray(data.subscriptions)) {
        for (const sub of data.subscriptions) {
          try {
            await addSubscription({
              name: sub.name || "Unnamed",
              price: Number(sub.price) || 0,
              currency: sub.currency || "USD",
              period: sub.period || sub.billingCycle || "monthly",
              nextBillingDate: sub.nextBillingDate || sub.nextPayment,
              category: sub.category,
              notes: sub.notes,
              link: sub.link,
              isEssential: sub.isEssential || false,
            });
            importedCount++;
          } catch (error) {
            console.error("Failed to import subscription:", sub.name, error);
            errors.push(`Subscription: ${sub.name}`);
          }
        }
      }

      // Import orders
      if (data.orders && Array.isArray(data.orders)) {
        for (const order of data.orders) {
          try {
            await addOrder({
              name: order.name || order.merchant || "Unnamed Order",
              vendor: order.vendor || order.merchant,
              type: "one-time",
              amount: Number(order.amount) || Number(order.total) || 0,
              currency: order.currency || "USD",
              category: order.category,
              scheduledDate: order.scheduledDate || order.orderDate,
              notes: order.notes,
              isEssential: order.isEssential || false,
            });
            importedCount++;
          } catch (error) {
            console.error("Failed to import order:", order.name, error);
            errors.push(`Order: ${order.name}`);
          }
        }
      }

      // Import expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const expense of data.expenses) {
          try {
            await addExpense({
              name: expense.name || expense.description || "Unnamed Expense",
              amount: Number(expense.amount) || 0,
              currency: expense.currency || "USD",
              category: validateExpenseCategory(expense.category),
              frequency: validateExpenseFrequency(expense.frequency),
              dueDate: expense.dueDate || expense.date,
              isRecurring: expense.isRecurring || false,
              isEssential: expense.isEssential || false,
              notes: expense.notes,
            });
            importedCount++;
          } catch (error) {
            console.error("Failed to import expense:", expense.name, error);
            errors.push(`Expense: ${expense.name}`);
          }
        }
      }

      if (errors.length > 0) {
        toast(`Imported ${importedCount} items with ${errors.length} errors`, "info");
      } else {
        toast(`Successfully imported ${importedCount} items!`, "success");
      }
      
      // Trigger data refresh
      window.dispatchEvent(new Event("needix-data-refresh"));
      
      // Reload page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("Import failed:", error);
      toast("Failed to import data. Please make sure you're using a valid Needix JSON file.", "error");
    } finally {
      setIsImporting(false);
      if (jsonInputRef.current) {
        jsonInputRef.current.value = "";
      }
    }
  };

  const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === '\n' && !inQuotes) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char !== '\r') {
        currentField += char;
      }
    }

    if (currentField || currentRow.length > 0) {
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  const handleCsvFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      let importedCount = 0;
      let currentSection: "subscriptions" | "orders" | "expenses" | null = null;
      let headers: string[] = [];

      for (const row of rows) {
        const firstCell = row[0]?.toLowerCase() || "";

        // Detect sections
        if (firstCell.includes("subscription")) {
          currentSection = "subscriptions";
          continue;
        } else if (firstCell.includes("order")) {
          currentSection = "orders";
          continue;
        } else if (firstCell.includes("expense")) {
          currentSection = "expenses";
          continue;
        }

        // Check if this is a header row
        if (firstCell === "name" || firstCell === "id" || firstCell === "description") {
          headers = row.map(h => h.toLowerCase());
          continue;
        }

        // Skip empty rows
        if (row.every(cell => !cell)) continue;

        // Import based on current section
        try {
          if (currentSection === "subscriptions" && headers.length > 0) {
            const getField = (name: string) => {
              const idx = headers.indexOf(name);
              return idx >= 0 ? row[idx] : "";
            };

            await addSubscription({
              name: getField("name") || "Unnamed",
              price: Number(getField("price")) || 0,
              currency: getField("currency") || "USD",
              period: (getField("billing cycle") || getField("period") || "monthly") as any,
              nextBillingDate: getField("next payment") || getField("next billing date"),
              category: getField("category"),
              notes: getField("notes"),
              isEssential: false,
            });
            importedCount++;
          } else if (currentSection === "orders" && headers.length > 0) {
            const getField = (name: string) => {
              const idx = headers.indexOf(name);
              return idx >= 0 ? row[idx] : "";
            };

            await addOrder({
              name: getField("name") || "Unnamed Order",
              vendor: getField("vendor"),
              type: "one-time",
              amount: Number(getField("amount")) || 0,
              currency: getField("currency") || "USD",
              scheduledDate: getField("scheduled date"),
              notes: getField("notes"),
              isEssential: false,
            });
            importedCount++;
          } else if (currentSection === "expenses" && headers.length > 0) {
            const getField = (name: string) => {
              const idx = headers.indexOf(name);
              return idx >= 0 ? row[idx] : "";
            };

            await addExpense({
              name: getField("name") || "Unnamed Expense",
              amount: Number(getField("amount")) || 0,
              currency: getField("currency") || "USD",
              category: validateExpenseCategory(getField("category")),
              frequency: validateExpenseFrequency(getField("frequency")),
              dueDate: getField("due date"),
              isRecurring: getField("recurring") === "true",
              isEssential: getField("essential") === "true",
            });
            importedCount++;
          }
        } catch (error) {
          console.error("Failed to import row:", row, error);
        }
      }

      toast(`Successfully imported ${importedCount} items from CSV!`, "success");
      
      // Trigger data refresh
      window.dispatchEvent(new Event("needix-data-refresh"));
      
      // Reload page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("CSV import failed:", error);
      toast("Failed to import CSV. Please check the file format.", "error");
    } finally {
      setIsImporting(false);
      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }
    }
  };

  const exportData = (format: "json" | "csv") => {
    setIsExporting(true);

    try {
      const payload = {
        subscriptions,
        orders,
        expenses,
        exportDate: new Date().toISOString(),
        totalSubscriptions: subscriptions.length,
        totalOrders: orders.length,
        totalExpenses: expenses.length,
      };

      if (format === "json") {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `needix-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        let csvContent = "";

        if (subscriptions.length > 0) {
          csvContent += "=== SUBSCRIPTIONS ===\n";
          const subHeaders = ["Name", "Price", "Currency", "Billing Cycle", "Next Payment", "Category", "Status"];
          const subRows: string[][] = subscriptions.map((sub) => [
            String(sub.name ?? ""),
            String(sub.price ?? ""),
            String(sub.currency ?? ""),
            String(sub.billingCycle ?? ""),
            String(sub.nextPayment ?? ""),
            String(sub.category ?? ""),
            String(sub.status ?? "active"),
          ]);
          csvContent += [subHeaders, ...subRows]
            .map((row) => row.map((cell) => `"${cell.replaceAll(`"`, `""`)}"`).join(","))
            .join("\n");
          csvContent += "\n\n";
        }

        if (orders.length > 0) {
          csvContent += "=== ORDERS ===\n";
          const orderHeaders = ["ID", "Name", "Amount", "Scheduled Date", "Vendor"];
          const orderRows: string[][] = orders.map((order) => [
            String(order.id ?? ""),
            String(order.name ?? ""),
            String(order.amount ?? ""),
            String(order.scheduledDate ?? ""),
            String(order.vendor ?? ""),
          ]);
          csvContent += [orderHeaders, ...orderRows]
            .map((row) => row.map((cell) => `"${cell.replaceAll(`"`, `""`)}"`).join(","))
            .join("\n");
          csvContent += "\n\n";
        }

        if (expenses.length > 0) {
          csvContent += "=== EXPENSES ===\n";
          const expenseHeaders = ["ID", "Name", "Amount", "Currency", "Category", "Frequency", "Due Date", "Recurring", "Essential"];
          const expenseRows: string[][] = expenses.map((expense) => [
            String(expense.id ?? ""),
            String(expense.name ?? ""),
            String(expense.amount ?? ""),
            String(expense.currency ?? ""),
            String(expense.category ?? ""),
            String(expense.frequency ?? ""),
            String(expense.dueDate ?? ""),
            String(expense.isRecurring ?? false),
            String(expense.isEssential ?? false),
          ]);
          csvContent += [expenseHeaders, ...expenseRows]
            .map((row) => row.map((cell) => `"${cell.replaceAll(`"`, `""`)}"`).join(","))
            .join("\n");
        }

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `needix-backup-${new Date().toISOString().split("T")[0]}.csv`;
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

  const clearAllData = async () => {
    setIsClearing(true);
    
    try {
      const response = await fetch('/api/user/clear-data', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear data from database');
      }

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
    } catch (error) {
      console.error("Failed to clear data:", error);
      toast("Failed to clear data. Please try again.", "error");
      setIsClearing(false);
    }
  };

  const totalDataSize = JSON.stringify({ subscriptions, orders, expenses }).length;
  const formattedSize = totalDataSize > 1024 
    ? `${(totalDataSize / 1024).toFixed(1)} KB` 
    : `${totalDataSize} bytes`;

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">📊 Data Management</h2>
        <p className="text-white/60">Backup and restore all your data with one click</p>
      </div>

      {/* Data Overview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Data Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">{subscriptions.length}</div>
            <div className="text-sm text-white/60">Subscriptions</div>
          </div>
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">{orders.length}</div>
            <div className="text-sm text-white/60">Orders</div>
          </div>
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">{expenses.length}</div>
            <div className="text-sm text-white/60">Expenses</div>
          </div>
          <div className="text-center p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-2xl font-bold text-white">{formattedSize}</div>
            <div className="text-sm text-white/60">Storage Used</div>
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">💾 Backup & Restore</h3>
          <p className="text-sm text-white/60 mt-1">Export all your data or restore from a backup</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Export/Backup */}
          <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📤</span>
              <div className="flex-1">
                <div className="font-semibold text-white">Export Backup</div>
                <div className="text-sm text-white/60">Save all your data</div>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                onClick={() => exportData("json")}
                disabled={isExporting}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-white"
              >
                {isExporting ? "Exporting..." : "📄 Export JSON"}
              </Button>
              <Button
                onClick={() => exportData("csv")}
                disabled={isExporting}
                variant="secondary"
                className="w-full"
              >
                {isExporting ? "Exporting..." : "📊 Export CSV"}
              </Button>
            </div>
          </div>

          {/* Import/Restore */}
          <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">📥</span>
              <div className="flex-1">
                <div className="font-semibold text-white">Import Backup</div>
                <div className="text-sm text-white/60">Restore from file</div>
              </div>
            </div>
            {/* Hidden file inputs */}
            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonFileSelect}
              style={{ display: 'none' }}
            />
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvFileSelect}
              style={{ display: 'none' }}
            />
            <div className="space-y-2">
              <Button
                onClick={handleJsonImportClick}
                disabled={isImporting}
                className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-white"
              >
                {isImporting ? "Importing..." : "📥 Import JSON"}
              </Button>
              <Button
                onClick={handleCsvImportClick}
                disabled={isImporting}
                variant="secondary"
                className="w-full"
              >
                {isImporting ? "Importing..." : "📊 Import CSV"}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400">ℹ️</span>
            <span className="font-medium text-blue-400">How Backup Works</span>
          </div>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• <strong>Export:</strong> Downloads ALL subscriptions, orders, and expenses in one file</li>
            <li>• <strong>Import JSON:</strong> Restores everything from a Needix backup file (recommended)</li>
            <li>• <strong>Import CSV:</strong> Import from spreadsheets - must have section headers</li>
            <li>• <strong>CSV format:</strong> Use === SUBSCRIPTIONS ===, === ORDERS ===, === EXPENSES === headers</li>
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
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Clear All Data"}
          </Button>
        </div>

        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-400">⚠️</span>
            <span className="font-medium text-red-400">Warning</span>
          </div>
          <p className="text-sm text-red-300">
            Clearing data will permanently delete all your subscriptions, orders, expenses, 
            and settings. This action cannot be undone. Export your data first!
          </p>
        </div>
      </div>

      {/* Clear Data Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-red-400 text-3xl">⚠️</span>
              <h3 className="text-xl font-bold text-white">Clear All Data</h3>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-white/90 font-semibold mb-3">
                ⚠️ This action is PERMANENT and CANNOT be undone!
              </p>
              <p className="text-white/80 mb-4">You are about to delete:</p>
              
              <ul className="text-sm text-white/70 space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong className="text-white">{subscriptions.length}</strong> subscriptions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong className="text-white">{orders.length}</strong> orders</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  <span><strong className="text-white">{expenses.length}</strong> expenses</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  <span>All app settings</span>
                </li>
              </ul>

              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded p-3">
                <p className="text-yellow-300 text-sm font-medium">
                  💡 Tip: Export your data first!
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setShowClearModal(false)}
                variant="secondary"
                className="flex-1"
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                onClick={clearAllData}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold"
                disabled={isClearing}
              >
                {isClearing ? "Deleting..." : "Yes, Delete Everything"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}