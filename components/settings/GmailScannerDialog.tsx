// components/settings/GmailScannerDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface DetectedItem {
  id: string;
  type: "subscription" | "order" | "expense";
  name: string;
  amount: number | null;
  currency: string;
  category: string;
  interval?: string;
  date?: string;
  vendor?: string;
  merchant?: string;
  confidence: number;
  emailSubject: string;
  selected: boolean;
  description?: string;
}

interface GmailScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (importedCount: number) => void;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function GmailScannerDialog({ 
  isOpen, 
  onClose, 
  onComplete 
}: GmailScannerDialogProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);
  const [mounted, setMounted] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const response = await fetch("/api/integrations/google/scan-gmail", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
          setDetectedItems(data.items);
          setScanComplete(true);
          toast(`Found ${data.items.length} items in your Gmail!`, "success");
        } else {
          throw new Error("No items found in response");
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to scan Gmail");
      }
    } catch (error) {
      console.error("Error scanning Gmail:", error);
      toast("Failed to scan Gmail", "error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    setDetectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleToggleAll = () => {
    const allSelected = detectedItems.every(item => item.selected);
    setDetectedItems(prev => 
      prev.map(item => ({ ...item, selected: !allSelected }))
    );
  };

  const handleImport = async () => {
    const selectedItems = detectedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast("Please select at least one item to import", "error");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/integrations/google/import-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      });

      if (response.ok) {
        const result = await response.json();
        toast(`Successfully imported ${result.imported} items!`, "success");
        onComplete(result.imported);
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to import items");
      }
    } catch (error) {
      console.error("Error importing items:", error);
      toast("Failed to import selected items", "error");
    } finally {
      setIsImporting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "subscription": return "🔄";
      case "order": return "📦";
      case "expense": return "💳";
      default: return "📄";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "subscription": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "order": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "expense": return "bg-green-500/20 text-green-300 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-400";
    if (confidence >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const selectedCount = detectedItems.filter(item => item.selected).length;
  const totalByType = detectedItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dialogContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/20 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">🔍 Gmail Financial Scanner</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-white/60">
            Scan your Gmail for subscriptions, orders, and expenses - then choose what to import
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!scanComplete ? (
            <div className="text-center py-16">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">📧</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Ready to Scan Gmail</h3>
                <p className="text-white/60 mb-8 max-w-md mx-auto">
                  We&apos;ll scan your Gmail for subscription receipts, order confirmations, and expense records.
                  You&apos;ll be able to review and select which items to import.
                </p>
              </div>

              <Button
                onClick={handleScan}
                disabled={isScanning}
                variant="primary"
              >
                {isScanning ? (
                  <>
                    <span className="animate-spin mr-3">⏳</span>
                    Scanning Gmail...
                  </>
                ) : (
                  "Start Gmail Scan"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 Scan Results</h3>
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">
                      {totalByType.subscription || 0}
                    </div>
                    <div className="text-sm text-white/60">Subscriptions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">
                      {totalByType.order || 0}
                    </div>
                    <div className="text-sm text-white/60">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">
                      {totalByType.expense || 0}
                    </div>
                    <div className="text-sm text-white/60">Expenses</div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                  <label className="flex items-center gap-3 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={detectedItems.length > 0 && detectedItems.every(item => item.selected)}
                      onChange={handleToggleAll}
                      className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                    />
                    <span className="font-medium">Select All Items</span>
                  </label>
                  <div className="text-white/70">
                    {selectedCount} of {detectedItems.length} selected
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {detectedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      item.selected
                        ? "bg-purple-500/20 border-purple-500/40 ring-2 ring-purple-500/20"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                    onClick={() => handleToggleItem(item.id)}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{getTypeIcon(item.type)}</span>
                          <h4 className="font-semibold text-white">{item.name}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(item.type)}`}>
                            {item.type}
                          </span>
                          <span className={`text-sm font-medium ${getConfidenceColor(item.confidence)}`}>
                            {item.confidence}% confidence
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-white/70 mb-2">
                          <span className="font-semibold text-white">
                            {item.amount !== null ? (
                              `${item.currency} ${item.amount.toFixed(2)}`
                            ) : (
                              <span className="text-yellow-400">Price TBD</span>
                            )}
                          </span>
                          <span className="bg-white/10 px-2 py-1 rounded">
                            {item.category}
                          </span>
                          {item.interval && (
                            <span className="text-purple-300">
                              Every {item.interval}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-white/50 truncate">
                          📧 {item.emailSubject}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {detectedItems.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🤷‍♂️</div>
                  <h3 className="text-xl font-semibold text-white mb-3">No Items Found</h3>
                  <p className="text-white/60 max-w-md mx-auto">
                    We didn&apos;t find any subscription receipts, orders, or expenses in your recent Gmail.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {scanComplete && detectedItems.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-white/5">
            <div className="flex gap-4">
              <Button onClick={onClose} variant="secondary" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || selectedCount === 0}
                variant="primary"
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Importing {selectedCount} items...
                  </>
                ) : (
                  `Import ${selectedCount} Selected Items`
                )}
              </Button>
            </div>
            
            {selectedCount === 0 && (
              <p className="text-center text-white/60 text-sm mt-2">
                Select at least one item to import
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}