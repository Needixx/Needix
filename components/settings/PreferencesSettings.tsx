import type { ChangeEvent } from "react";
import { AppSettings } from "@/components/settings/types";
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

  const onCheckbox =
    (key: keyof AppSettings) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      updateAppSettings({ [key]: e.target.checked } as Partial<AppSettings>);

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">⚙️ App Preferences</h2>
        <p className="text-white/60">Customize your Needix experience</p>
      </div>

      {/* Appearance */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎨 Appearance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Theme</label>
            <select
              value={appSettings.theme}
              onChange={onSelect("theme")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="dark">🌙 Dark</option>
              <option value="light">☀️ Light</option>
              <option value="system">🖥️ System</option>
            </select>
            <p className="text-xs text-white/50 mt-1">Choose your preferred color scheme</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Default View</label>
            <select
              value={appSettings.defaultView}
              onChange={onSelect("defaultView")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="grid">🔲 Grid View</option>
              <option value="list">📋 List View</option>
            </select>
            <p className="text-xs text-white/50 mt-1">How subscriptions are displayed by default</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Default Tab</label>
            <select
              value={appSettings.defaultTab}
              onChange={onSelect("defaultTab")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="subscriptions">📱 Subscriptions</option>
              <option value="expenses">💰 Expenses</option>
              <option value="orders">📦 Orders</option>
            </select>
            <p className="text-xs text-white/50 mt-1">Which tab to show when opening the app</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white/80">Compact Mode</div>
                <p className="text-xs text-white/50 mt-1">Show more items in less space</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appSettings.compactMode}
                  onChange={onCheckbox("compactMode")}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple peer-checked:to-cyan"></div>
              </label>
            </div>
          </div>
        </div>
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

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Week Start</label>
            <select
              value={appSettings.weekStart}
              onChange={onSelect("weekStart")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
            </select>
            <p className="text-xs text-white/50 mt-1">First day of the week in calendars</p>
          </div>

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
        </div>
      </div>

      {/* Data & Display */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📊 Data & Display</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <label className="block text-sm font-medium text-white/80 mb-2">Number Format</label>
            <select
              value={appSettings.numberFormat}
              onChange={onSelect("numberFormat")}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="US">1,234.56 (US)</option>
              <option value="EU">1.234,56 (EU)</option>
            </select>
            <p className="text-xs text-white/50 mt-1">How numbers and prices are formatted</p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-sm font-medium text-white/80 mb-2">Quick Actions</div>
            <div className="space-y-2">
              <button
                onClick={() =>
                  updateAppSettings({
                    theme: "dark",
                    currency: "USD",
                    defaultView: "grid",
                    compactMode: false,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors"
              >
                🔄 Reset to Defaults
              </button>
            </div>
            <p className="text-xs text-white/50 mt-1">Quickly reset all preferences</p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-r from-purple/20 to-cyan/20 border border-purple/40 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">👀 Preview</h3>
        <div className="bg-white/10 rounded-lg p-4 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple to-cyan rounded-lg flex items-center justify-center text-white font-bold text-sm">
              N
            </div>
            <div>
              <div className="font-medium text-white">Netflix</div>
              <div className="text-sm text-white/60">
                {appSettings.currency === "USD" && "$"}
                {appSettings.currency === "EUR" && "€"}
                {appSettings.currency === "GBP" && "£"}
                {appSettings.numberFormat === "US" ? "15.99" : "15,99"} / month
              </div>
            </div>
          </div>
          <div className="text-xs text-white/50">
            Next renewal: {appSettings.dateFormat === "MM/DD/YYYY" ? "12/15/2024" : "15/12/2024"}
          </div>
        </div>
        <p className="text-xs text-white/50 mt-2">
          This is how your subscriptions will look with current settings
        </p>
      </div>
    </div>
  );
}
