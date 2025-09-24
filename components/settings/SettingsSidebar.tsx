// components/settings/SettingsSidebar.tsx

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { key: "notifications", label: "🔔 Notifications", description: "Alerts & reminders" },
  { key: "preferences", label: "⚙️ Preferences", description: "App customization" },
  { key: "billing", label: "💳 Billing", description: "Plan & usage" },
  { key: "security", label: "🔒 Security", description: "Account protection" },
  { key: "ai", label: "🤖 AI & Privacy", description: "Data handling" },
  { key: "integrations", label: "🔗 Integrations", description: "Connected services" },
  { key: "data", label: "📊 Data", description: "Export & clear" },
  { key: "account", label: "👤 Account", description: "Profile & danger zone" },
];

export default function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <div className="w-72 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
      <nav className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => onSectionChange(section.key)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 border ${
              activeSection === section.key
                ? "bg-gradient-to-r from-purple/20 to-cyan/20 border-purple/40 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            <div className="font-medium text-sm">{section.label}</div>
            <div className="text-xs opacity-70 mt-1">{section.description}</div>
          </button>
        ))}
      </nav>
    </div>
  );
}
