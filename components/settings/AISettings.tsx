// components/settings/AISettings.tsx
"use client";

import type { ChangeEvent } from "react";
import type { SettingsAISettings } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";
import React from "react";

interface AISettingsProps {
  aiSettings: SettingsAISettings;
  setAISettings: React.Dispatch<React.SetStateAction<SettingsAISettings>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function AISettings({ aiSettings, setAISettings }: AISettingsProps) {
  const toast: ToastFn = useToast();

  const updateAISettings = (updates: Partial<SettingsAISettings>) => {
    const newSettings = { ...aiSettings, ...updates };
    setAISettings(newSettings);
    localStorage.setItem("needix_ai", JSON.stringify(newSettings));
  };

  const onCheckbox =
    (key: keyof SettingsAISettings) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const isEnabled = e.target.checked;
      updateAISettings({ [key]: isEnabled });

      switch (key) {
        case "allowDataAccess":
          toast(
            isEnabled
              ? "AI can analyze your subscriptions and surface insights."
              : "AI analysis disabled for subscription data.",
            "info"
          );
          break;
        case "autoFillForms":
          toast(isEnabled ? "AI will help auto-fill subscription forms." : "Auto-fill assistance disabled.", "info");
          break;
        case "retainHistory":
          toast(
            isEnabled ? "Chat history will be retained to improve responses." : "Chat history will not be retained.",
            "info"
          );
          break;
      }
    };

  const Toggle = ({
    checked,
    onChange,
    ariaLabel,
  }: {
    checked: boolean;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    ariaLabel: string;
  }) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer ml-4 select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
          aria-label={ariaLabel}
        />
        <div
          className={[
            "relative w-12 h-6 rounded-full overflow-hidden transition-all duration-300",
            checked ? "ui-toggle-on" : "ui-toggle-off", // <-- force the fill via !important
            checked
              ? "border border-white/20 shadow-[0_0_10px_2px_rgba(147,51,234,0.4),0_0_16px_3px_rgba(34,211,238,0.35)]"
              : "border border-white/25 shadow-none",
            "focus-within:ring-2 focus-within:ring-purple/50",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white transition-transform duration-300 z-10",
              checked ? "translate-x-6" : "translate-x-0",
              "shadow-[0_1px_2px_rgba(0,0,0,0.35)]",
            ].join(" ")}
          />
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🤖 AI & Privacy</h2>
        <p className="text-white/60">Control how AI features use your data and enhance your experience</p>
      </div>

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
                Allow AI to analyze your subscriptions and provide personalized insights, spending recommendations, and
                detect potential savings opportunities
              </div>
              {aiSettings.allowDataAccess && (
                <div className="mt-2 text-xs text-green-400">✓ AI insights enabled — analyzing subscription patterns</div>
              )}
            </div>
            <Toggle
              checked={aiSettings.allowDataAccess}
              onChange={onCheckbox("allowDataAccess")}
              ariaLabel="Toggle subscription analysis"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Auto-Fill Assistance</div>
              <div className="text-sm text-white/60">
                Enable AI to help automatically fill subscription forms and details based on your history
              </div>
              {aiSettings.autoFillForms && (
                <div className="mt-2 text-xs text-blue-400">✓ Auto-fill enabled — forms will be pre-populated when possible</div>
              )}
            </div>
            <Toggle
              checked={aiSettings.autoFillForms}
              onChange={onCheckbox("autoFillForms")}
              ariaLabel="Toggle auto-fill assistance"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
            <div className="flex-1">
              <div className="font-medium text-white mb-1">Conversation History</div>
              <div className="text-sm text-white/60">
                Retain your AI chat history to provide more personalized and contextual responses over time
              </div>
              {aiSettings.retainHistory ? (
                <div className="mt-2 text-xs text-blue-400">✓ History retained — AI will learn from your interactions</div>
              ) : (
                <div className="mt-2 text-xs text-orange-400">⚠ History not retained — AI responses may be less personalized</div>
              )}
            </div>
            <Toggle
              checked={aiSettings.retainHistory}
              onChange={onCheckbox("retainHistory")}
              ariaLabel="Toggle conversation history"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple/10 to-cyan/10 border border-purple/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <h4 className="font-medium text-white mb-1">Data Security Commitment</h4>
            <p className="text-sm text-white/70">
              All AI processing happens securely. Your subscription data is encrypted and never shared with third parties. You
              can disable any feature at any time, and we respect your privacy choices.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            updateAISettings({ allowDataAccess: true, autoFillForms: true, retainHistory: true });
            toast("All AI features enabled.", "info");
          }}
          className="px-4 py-2 bg-gradient-to-r from-purple to-cyan text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
        >
          Enable All AI Features
        </button>
        <button
          onClick={() => {
            updateAISettings({ allowDataAccess: false, autoFillForms: false, retainHistory: false });
            toast("All AI features disabled.", "info");
          }}
          className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-all duration-200"
        >
          Disable All AI Features
        </button>
      </div>
    </div>
  );
}
