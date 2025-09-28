// components/settings/AISettings.tsx
import type { ChangeEvent } from "react";
import type { SettingsAISettings } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";

interface AISettingsProps {
  aiSettings: SettingsAISettings;
  setAISettings: React.Dispatch<React.SetStateAction<SettingsAISettings>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function AISettings({ aiSettings, setAISettings }: AISettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);

  const updateAISettings = (updates: Partial<SettingsAISettings>) => {
    const newSettings = { ...aiSettings, ...updates };
    setAISettings(newSettings);
    localStorage.setItem("needix_ai", JSON.stringify(newSettings));
    toast("AI & Privacy settings updated", "success");
  };

  const onCheckbox =
    (key: keyof SettingsAISettings) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const isEnabled = e.target.checked;
      updateAISettings({ [key]: isEnabled } as Partial<SettingsAISettings>);
      
      // Show specific toast messages for different features
      switch (key) {
        case 'allowDataAccess':
          toast(
            isEnabled 
              ? "AI can now analyze your subscriptions and provide insights" 
              : "AI analysis disabled for subscription data", 
            "info"
          );
          break;
        case 'autoFillForms':
          toast(
            isEnabled 
              ? "AI will now help auto-fill subscription forms" 
              : "Auto-fill assistance disabled", 
            "info"
          );
          break;
        case 'retainHistory':
          toast(
            isEnabled 
              ? "Chat history will be kept to improve AI responses" 
              : "Chat history will not be retained", 
            "info"
          );
          break;
      }
    };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🤖 AI & Privacy</h2>
        <p className="text-white/60">Control how AI features use your data and enhance your experience</p>
      </div>

      {/* AI Features Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple/20 to-cyan/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🧠</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Analysis & Insights</h3>
            <p className="text-sm text-white/60">Let AI help optimize your subscription management</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Subscription Analysis</div>
              <div className="text-sm text-white/60">
                Allow AI to analyze your subscriptions and provide personalized insights, 
                spending recommendations, and detect potential savings opportunities
              </div>
              {aiSettings.allowDataAccess && (
                <div className="mt-2 text-xs text-green-400">
                  ✓ AI insights enabled - analyzing subscription patterns
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input 
                type="checkbox" 
                checked={aiSettings.allowDataAccess} 
                onChange={onCheckbox("allowDataAccess")} 
                className="sr-only peer" 
              />
              <div className="w-12 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple/50 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan shadow-lg"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Smart Auto-Fill</div>
              <div className="text-sm text-white/60">
                Automatically suggest subscription details, pricing, and billing cycles 
                based on service names when adding new subscriptions
              </div>
              {aiSettings.autoFillForms && (
                <div className="mt-2 text-xs text-green-400">
                  ✓ Auto-fill enabled - forms will be populated automatically
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input 
                type="checkbox" 
                checked={aiSettings.autoFillForms} 
                onChange={onCheckbox("autoFillForms")} 
                className="sr-only peer" 
              />
              <div className="w-12 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple/50 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan shadow-lg"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple/20 to-cyan/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🔒</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Privacy & Data Retention</h3>
            <p className="text-sm text-white/60">Control how your interaction data is handled</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Chat History Retention</div>
              <div className="text-sm text-white/60">
                Keep your chat history with Needix AI to improve responses over time and 
                provide more personalized assistance based on your interaction patterns
              </div>
              {aiSettings.retainHistory ? (
                <div className="mt-2 text-xs text-blue-400">
                  ✓ History retained - AI will learn from your interactions
                </div>
              ) : (
                <div className="mt-2 text-xs text-orange-400">
                  ⚠ History not retained - AI responses may be less personalized
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input 
                type="checkbox" 
                checked={aiSettings.retainHistory} 
                onChange={onCheckbox("retainHistory")} 
                className="sr-only peer" 
              />
              <div className="w-12 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple/50 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan shadow-lg"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Security Notice */}
      <div className="bg-gradient-to-r from-purple/10 to-cyan/10 border border-purple/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h4 className="font-medium text-white mb-1">Data Security Commitment</h4>
            <p className="text-sm text-white/70">
              All AI processing happens securely. Your subscription data is encrypted and never shared 
              with third parties. You can disable any feature at any time, and we respect your privacy choices.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => updateAISettings({ allowDataAccess: true, autoFillForms: true, retainHistory: true })}
          className="px-4 py-2 bg-gradient-to-r from-purple to-cyan text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
        >
          Enable All AI Features
        </button>
        <button
          onClick={() => updateAISettings({ allowDataAccess: false, autoFillForms: false, retainHistory: false })}
          className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-all duration-200"
        >
          Disable All AI Features
        </button>
      </div>
    </div>
  );
}