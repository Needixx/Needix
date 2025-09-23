// components/ImportCsvDialog.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type ImportType = "subscriptions" | "expenses" | "orders";

interface ImportCsvDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, string | number>[], type: ImportType) => void;
}

interface CsvRow {
  [key: string]: string;
}

export default function ImportCsvDialog({ isOpen, onClose, onImport }: ImportCsvDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<ImportType>("subscriptions");
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Field mappings for different import types
  const fieldMappings: Record<ImportType, Record<string, string[]>> = {
    subscriptions: {
      name: ["name", "service", "subscription", "title"],
      price: ["price", "amount", "cost", "monthly_cost"],
      period: ["period", "billing_cycle", "frequency"],
      nextBillingDate: ["next_billing", "renewal_date", "next_payment"],
      category: ["category", "type"],
      notes: ["notes", "description"],
      link: ["url", "link", "website"],
    },
    expenses: {
      description: ["description", "name", "item"],
      amount: ["amount", "price", "cost"],
      date: ["date", "transaction_date"],
      category: ["category", "type"],
      notes: ["notes", "memo"],
    },
    orders: {
      title: ["title", "name", "product"],
      amount: ["amount", "price", "total"],
      orderDate: ["order_date", "date", "purchase_date"],
      status: ["status", "state"],
      trackingNumber: ["tracking", "tracking_number"],
      notes: ["notes", "description"],
    },
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Use currentTarget (safely typed) and narrow before using
    const list = event.currentTarget.files;
    if (!list || list.length === 0) {
      toast("Please select a valid CSV file", "error");
      return;
    }

    // .item() returns File | null (not undefined), easier to narrow
    const selectedFile = list.item(0);
    if (!selectedFile) {
      toast("Please select a valid CSV file", "error");
      return;
    }

    // Some browsers upload CSV as text/plain, so accept by extension too
    const looksLikeCsv =
      selectedFile.type === "text/csv" || selectedFile.name.toLowerCase().endsWith(".csv");

    if (!looksLikeCsv) {
      toast("Please select a .csv file", "error");
      return;
    }

    setFile(selectedFile);
    // Avoid no-floating-promises
    void parseCSV(selectedFile).catch(() => {
      toast("Failed to parse CSV file", "error");
    });
  };

  const parseCSV = async (file: File): Promise<void> => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast("CSV file must have at least a header row and one data row", "error");
        return;
      }

      const headers = lines[0]!.split(",").map((h) => h.trim().replace(/"/g, ""));
      const data = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
        const row: CsvRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        return row;
      });

      setHeaders(headers);
      setCsvData(data);

      // Auto-map fields
      const autoMapping = autoMapFields(headers, importType);
      setMapping(autoMapping);

      setStep("mapping");
    } catch {
      toast("Failed to parse CSV file", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const autoMapFields = (csvHeaders: string[], type: ImportType): Record<string, string> => {
    const mapping: Record<string, string> = {};
    const fields = fieldMappings[type];

    Object.entries(fields).forEach(([field, possibleHeaders]) => {
      for (const possibleHeader of possibleHeaders) {
        const matchingHeader = csvHeaders.find(
          (h) =>
            h.toLowerCase().includes(possibleHeader.toLowerCase()) ||
            possibleHeader.toLowerCase().includes(h.toLowerCase()),
        );
        if (matchingHeader) {
          mapping[field] = matchingHeader;
          break;
        }
      }
    });

    return mapping;
  };

  const handleImport = () => {
    try {
      const mappedData = csvData.map((row) => {
        const mappedRow: Record<string, string | number> = {};

        Object.entries(mapping).forEach(([field, csvColumn]) => {
          if (csvColumn && Object.prototype.hasOwnProperty.call(row, csvColumn)) {
            const rawValue = row[csvColumn] || "";

            // Convert specific fields
            if (field.includes("price") || field.includes("amount") || field.includes("cost")) {
              const numValue = parseFloat(rawValue.replace(/[^0-9.-]/g, ""));
              mappedRow[field] = isNaN(numValue) ? 0 : numValue;
            } else if (field.includes("date") || field.includes("Date")) {
              mappedRow[field] = new Date(rawValue).toISOString();
            } else {
              mappedRow[field] = rawValue;
            }
          }
        });

        return mappedRow;
      });

      onImport(mappedData, importType);
      toast(`Imported ${mappedData.length} ${importType}`, "success");
      handleClose();
    } catch {
      toast("Failed to import data", "error");
    }
  };

  const handleClose = () => {
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setStep("upload");
    onClose();
  };

  const handleFileInputClick = () => {
    const input = fileInputRef.current;
    if (input) {
      input.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📥</span>
              <h2 className="text-lg font-medium">Import CSV Data</h2>
            </div>
            <button onClick={handleClose} className="text-white/60 hover:text-white text-xl">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Import Type</label>
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as ImportType)}
                >
                  <option value="subscriptions">Subscriptions</option>
                  <option value="expenses">Expenses</option>
                  <option value="orders">Orders</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CSV File</label>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
                <div
                  onClick={handleFileInputClick}
                  className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-white/30 transition-colors"
                >
                  <div className="text-4xl mb-2">📄</div>
                  <div className="font-medium mb-1">{file ? file.name : "Click to select CSV file"}</div>
                  <div className="text-sm text-white/60">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : "Or drag and drop here"}
                  </div>
                </div>
              </div>

              {isLoading && (
                <div className="text-center">
                  <div className="inline-block w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <div className="mt-2 text-sm text-white/60">Parsing CSV...</div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === "mapping" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Map CSV Columns to Fields</h3>
                <p className="text-sm text-white/60 mb-4">
                  Match your CSV columns to the appropriate fields. Auto-detected mappings are pre-selected.
                </p>
              </div>

              <div className="grid gap-4">
                {Object.keys(fieldMappings[importType]).map((field) => (
                  <div key={field} className="grid grid-cols-2 gap-4 items-center">
                    <div className="font-medium capitalize">{field.replace(/([A-Z])/g, " $1").trim()}</div>
                    <select
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                      value={mapping[field] || ""}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}
                    >
                      <option value="">-- Select Column --</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep("upload")} variant="secondary" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep("preview")}
                  variant="primary"
                  className="flex-1"
                  disabled={Object.keys(mapping).length === 0}
                >
                  Preview Import
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Preview Import Data</h3>
                <p className="text-sm text-white/60 mb-4">Review the first few rows to ensure the mapping is correct.</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10">
                      <tr>
                        {Object.keys(mapping).map((field) => (
                          <th key={field} className="text-left p-3 font-medium">
                            {field.replace(/([A-Z])/g, " $1").trim()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="border-b border-white/5">
                          {Object.entries(mapping).map(([field, csvColumn]) => (
                            <td key={field} className="p-3 text-white/80">
                              {csvColumn && Object.prototype.hasOwnProperty.call(row, csvColumn)
                                ? row[csvColumn] || "—"
                                : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-sm text-white/60">Showing first 5 rows of {csvData.length} total rows</div>

              <div className="flex gap-3">
                <Button onClick={() => setStep("mapping")} variant="secondary" className="flex-1">
                  Back to Mapping
                </Button>
                <Button onClick={handleImport} variant="primary" className="flex-1">
                  Import {csvData.length} Items
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
