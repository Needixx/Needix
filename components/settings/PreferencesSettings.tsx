// components/settings/PreferencesSettings.tsx
import type { ChangeEvent } from "react";
import { AppSettings, DEFAULT_APP_SETTINGS } from "@/components/settings/types";
import { useToast } from "@/components/ui/Toast";

interface PreferencesSettingsProps {
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

type ToastVariant = "success" | "error" | "info";
type ToastFn = (msg: string, variant?: ToastVariant) => void;

export default function PreferencesSettings({ appSettings, setAppSettings }: PreferencesSettingsProps) {
  const rawToast = useToast();
  const toast: ToastFn = (m, v) => rawToast(m, v);

  const updateAppSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...appSettings, ...updates };
    setAppSettings(newSettings);
    localStorage.setItem("needix_app_settings", JSON.stringify(newSettings));
    toast("App settings updated", "success");
  };

  const onSelect =
    <K extends keyof AppSettings>(key: K) =>
    (e: ChangeEvent<HTMLSelectElement>) =>
      updateAppSettings({ [key]: e.target.value } as Partial<AppSettings>);

  const resetToDefaults = () => {
    setAppSettings(DEFAULT_APP_SETTINGS);
    localStorage.setItem("needix_app_settings", JSON.stringify(DEFAULT_APP_SETTINGS));
    toast("Settings reset to defaults", "success");
  };

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">⚙️ App Preferences</h2>
        <p className="text-white/60">Customize your Needix experience</p>
      </div>

      {/* Regional Settings */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🌍 Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Currency</label>
            <select
              value={appSettings.currency}
              onChange={onSelect("currency")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="USD">🇺🇸 USD ($)</option>
              <option value="EUR">🇪🇺 EUR (€)</option>
              <option value="GBP">🇬🇧 GBP (£)</option>
            </select>
            <p className="text-xs text-white/50 mt-1">Default currency for new subscriptions</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Timezone</label>
            <select
              value={appSettings.timezone}
              onChange={(e) => updateAppSettings({ timezone: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="America/New_York">🇺🇸 Eastern Time</option>
              <option value="America/Chicago">🇺🇸 Central Time</option>
              <option value="America/Denver">🇺🇸 Mountain Time</option>
              <option value="America/Los_Angeles">🇺🇸 Pacific Time</option>
              <option value="Europe/London">🇬🇧 London (GMT)</option>
              <option value="Europe/Paris">🇫🇷 Paris (CET)</option>
              <option value="Europe/Berlin">🇩🇪 Berlin (CET)</option>
              <option value="Asia/Tokyo">🇯🇵 Tokyo (JST)</option>
              <option value="Asia/Shanghai">🇨🇳 Shanghai (CST)</option>
              <option value="Australia/Sydney">🇦🇺 Sydney (AEDT)</option>
            </select>
            <p className="text-xs text-white/50 mt-1">Used for renewal dates and notifications</p>
          </div>
        </div>
      </div>

      {/* Data & Display */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Data & Display</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Date Format</label>
            <select
              value={appSettings.dateFormat}
              onChange={onSelect("dateFormat")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
            </select>
            <p className="text-xs text-white/50 mt-1">How dates are displayed throughout the app</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex flex-col h-full justify-center">
              <button
                onClick={resetToDefaults}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple/20 to-cyan/20 border border-purple/30 rounded-lg text-white hover:from-purple/30 hover:to-cyan/30 transition-all duration-200 font-medium"
              >
                🔄 Reset to Defaults
              </button>
              <p className="text-xs text-white/50 mt-2 text-center">Restore all settings to their default values</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}