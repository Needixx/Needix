// components/settings/EnhancedAISettings.tsx
import type { ChangeEvent } from "react";
import type { SettingsAISettings } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";

interface EnhancedAISettingsProps {
  aiSettings: SettingsAISettings & {
    // Extended AI settings
    enableBundleAnalysis?: boolean;
    enableNegotiationAssist?: boolean;
    enableRotationPlanning?: boolean;
    enablePaymentOptimization?: boolean;
    enableCostPerUseTracking?: boolean;
    enableGoalBasedPlanning?: boolean;
    enableMarketComparison?: boolean;
    enableAutomatedActions?: boolean;
    enableSpendingAlerts?: boolean;
    confidenceThreshold?: number;
    savingsGoalAmount?: number;
    analysisFrequency?: 'daily' | 'weekly' | 'monthly';
  };
  setAISettings: React.Dispatch<React.SetStateAction<any>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function EnhancedAISettings({ aiSettings, setAISettings }: EnhancedAISettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);

  const updateAISettings = (updates: Partial<typeof aiSettings>) => {
    const newSettings = { ...aiSettings, ...updates };
    setAISettings(newSettings);
    localStorage.setItem("needix_ai_enhanced", JSON.stringify(newSettings));
    toast("AI settings updated successfully", "success");
  };

  const onCheckbox = (key: keyof typeof aiSettings) => (e: ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    updateAISettings({ [key]: isEnabled });
    
    // Show specific notifications for different features
    const featureMessages: Record<string, string> = {
      allowDataAccess: isEnabled ? "AI can now analyze your financial data" : "AI data analysis disabled",
      enableBundleAnalysis: isEnabled ? "Bundle opportunity analysis enabled" : "Bundle analysis disabled",
      enableNegotiationAssist: isEnabled ? "Price negotiation assistance enabled" : "Negotiation assistance disabled",
      enableRotationPlanning: isEnabled ? "Smart rotation planning enabled" : "Rotation planning disabled",
      enablePaymentOptimization: isEnabled ? "Payment method optimization enabled" : "Payment optimization disabled",
      enableAutomatedActions: isEnabled ? "Automated recommendations enabled" : "Automated actions disabled",
      enableSpendingAlerts: isEnabled ? "Smart spending alerts enabled" : "Spending alerts disabled"
    };

    if (featureMessages[key]) {
      toast(featureMessages[key], "info");
    }
  };

  const onSelectChange = (key: keyof typeof aiSettings) => (e: ChangeEvent<HTMLSelectElement>) => {
    updateAISettings({ [key]: e.target.value });
  };

  const onNumberChange = (key: keyof typeof aiSettings) => (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateAISettings({ [key]: value });
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🤖 Enhanced AI & Privacy</h2>
        <p className="text-white/60">Advanced AI features for intelligent subscription and financial optimization</p>
      </div>

      {/* Core AI Features */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple/20 to-cyan/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🧠</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Core AI Analysis</h3>
            <p className="text-sm text-white/60">Fundamental AI capabilities and data access</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Financial Data Analysis</div>
              <div className="text-sm text-white/60">
                Allow AI to analyze your subscriptions, expenses, and orders for personalized insights
              </div>
            </div>
            <input
              type="checkbox"
              checked={aiSettings.allowDataAccess || false}
              onChange={onCheckbox('allowDataAccess')}
              className="w-5 h-5 bg-white/10 border-2 border-white/20 rounded focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Automated Recommendations</div>
              <div className="text-sm text-white/60">
                Enable AI to automatically apply safe optimizations like scheduling reminders and alerts
              </div>
            </div>
            <input
              type="checkbox"
              checked={aiSettings.enableAutomatedActions || false}
              onChange={onCheckbox('enableAutomatedActions')}
              className="w-5 h-5 bg-white/10 border-2 border-white/20 rounded focus:ring-2 focus:ring-purple-500"
              disabled={!aiSettings.allowDataAccess}
            />
          </div>
        </div>
      </div>

      {/* Subscription Intelligence */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue/20 to-purple/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">📱</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Subscription Intelligence</h3>
            <p className="text-sm text-white/60">Advanced subscription optimization features</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Bundle Analysis</span>
              <input
                type="checkbox"
                checked={aiSettings.enableBundleAnalysis || false}
                onChange={onCheckbox('enableBundleAnalysis')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Detect Apple One, Prime, Google One bundle opportunities</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Rotation Planning</span>
              <input
                type="checkbox"
                checked={aiSettings.enableRotationPlanning || false}
                onChange={onCheckbox('enableRotationPlanning')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Smart streaming service rotation based on content calendar</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Cost-Per-Use Tracking</span>
              <input
                type="checkbox"
                checked={aiSettings.enableCostPerUseTracking || false}
                onChange={onCheckbox('enableCostPerUseTracking')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Calculate and monitor cost per use for all services</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Market Comparison</span>
              <input
                type="checkbox"
                checked={aiSettings.enableMarketComparison || false}
                onChange={onCheckbox('enableMarketComparison')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Compare your rates against market averages</p>
          </div>
        </div>
      </div>

      {/* Commerce Optimization */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green/20 to-emerald/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🛒</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Commerce Optimization</h3>
            <p className="text-sm text-white/60">Payment and billing optimization features</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Negotiation Assistance</span>
              <input
                type="checkbox"
                checked={aiSettings.enableNegotiationAssist || false}
                onChange={onCheckbox('enableNegotiationAssist')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Get scripts and timing for ISP, phone, insurance negotiations</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Payment Optimization</span>
              <input
                type="checkbox"
                checked={aiSettings.enablePaymentOptimization || false}
                onChange={onCheckbox('enablePaymentOptimization')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Optimize credit card usage for maximum cashback</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Smart Spending Alerts</span>
              <input
                type="checkbox"
                checked={aiSettings.enableSpendingAlerts || false}
                onChange={onCheckbox('enableSpendingAlerts')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Get alerts for unusual spending patterns and late fee risks</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Goal-Based Planning</span>
              <input
                type="checkbox"
                checked={aiSettings.enableGoalBasedPlanning || false}
                onChange={onCheckbox('enableGoalBasedPlanning')}
                className="w-4 h-4 bg-white/10 border-2 border-white/20 rounded"
                disabled={!aiSettings.allowDataAccess}
              />
            </div>
            <p className="text-xs text-white/60">Create personalized savings plans with monthly milestones</p>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange/20 to-red/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">⚙️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Configuration</h3>
            <p className="text-sm text-white/60">Customize AI behavior and thresholds</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Analysis Frequency
            </label>
            <select
              value={aiSettings.analysisFrequency || 'weekly'}
              onChange={onSelectChange('analysisFrequency')}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={!aiSettings.allowDataAccess}
            >
              <option value="daily">Daily Analysis</option>
              <option value="weekly">Weekly Analysis</option>
              <option value="monthly">Monthly Analysis</option>
            </select>
            <p className="text-xs text-white/50 mt-1">How often AI should analyze your financial data</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Confidence Threshold ({aiSettings.confidenceThreshold || 70}%)
            </label>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={aiSettings.confidenceThreshold || 70}
              onChange={(e) => updateAISettings({ confidenceThreshold: parseInt(e.target.value) })}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              disabled={!aiSettings.allowDataAccess}
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Monthly Savings Goal ($)
            </label>
            <input
              type="number"
              min="0"
              max="1000"
              step="25"
              value={aiSettings.savingsGoalAmount || 100}
              onChange={onNumberChange('savingsGoalAmount')}
              className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="100"
              disabled={!aiSettings.allowDataAccess}
            />
            <p className="text-xs text-white/50 mt-1">Target monthly savings amount for AI planning</p>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-xl border border-amber-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber/20 to-orange/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🔐</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Privacy & Security</h3>
            <p className="text-sm text-white/60">How your data is handled and protected</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-white/80">
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>All AI analysis runs with your explicit consent and can be disabled instantly</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Financial data is encrypted in transit and processed securely</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>No data is shared with third parties or used for advertising</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Analysis results are stored locally when possible</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>You can export or delete all AI analysis data at any time</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
          <p className="text-xs text-white/70">
            <strong>Data Retention:</strong> AI analysis history is kept for 90 days to improve recommendations. 
            You can clear this history in Data Settings. Automated actions create audit logs for transparency.
          </p>
        </div>
      </div>
    </div>
  );
}