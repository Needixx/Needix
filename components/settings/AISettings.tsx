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
    (e: ChangeEvent<HTMLInputElement>) =>
      updateAISettings({ [key]: e.target.checked } as Partial<SettingsAISettings>);

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🤖 AI & Privacy</h2>
        <p className="text-white/60">Control how AI features use your data</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🧠 AI Features</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-white">Allow Data Access</div>
              <div className="text-sm text-white/60">Let AI analyze your subscriptions to provide insights</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiSettings.allowDataAccess} onChange={onCheckbox("allowDataAccess")} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-white">Retain Interaction History</div>
              <div className="text-sm text-white/60">Keep chat history to improve AI responses over time</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiSettings.retainHistory} onChange={onCheckbox("retainHistory")} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-white">Auto-Fill Forms</div>
              <div className="text-sm text-white/60">Automatically suggest subscription details based on service names</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={aiSettings.autoFillForms} onChange={onCheckbox("autoFillForms")} className="sr-only peer" />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
