// components/settings/SettingsLayout.tsx
"use client";

import { useState, useEffect } from "react";
import type { User } from "next-auth";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";
import { isMobileApp } from "@/lib/mobile-auth";

import SettingsSidebar from "./SettingsSidebar";
import NotificationsSettings from "./NotificationsSettings";
import PreferencesSettings from "./PreferencesSettings";
import BillingSettings from "./BillingSettings";
import SecuritySettings from "./SecuritySettings";
import AISettings from "./AISettings";
import IntegrationsSettings from "./IntegrationsSettings";
import DataSettings from "./DataSettings";
import AccountSettings from "./AccountSettings";
import {
  type NotificationSettings,
  type AppSettings,
  type BillingInfo,
  type SettingsSecuritySettings,
  type SettingsAISettings,
  type IntegrationSettings,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_APP_SETTINGS,
  DEFAULT_BILLING,
  DEFAULT_SECURITY,
  DEFAULT_AI,
  DEFAULT_INTEGRATIONS,
  isNotificationSettings,
  isAppSettings,
} from "@/components/settings/types";

/** Shapes expected by child views */
interface BillingBasicSubscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  startedAt: string;
}
interface BillingBasicOrder {
  id: string;
  name: string;
  date: string;
  vendor: string;
  total: number;
}
type OrderExport = Record<string, string | number>;

interface SettingsLayoutProps {
  user: User;
}

type SectionKey =
  | "notifications"
  | "preferences"
  | "billing"
  | "security"
  | "ai"
  | "integrations"
  | "data"
  | "account";

const SECTION_KEYS: readonly SectionKey[] = [
  "notifications",
  "preferences",
  "billing",
  "security",
  "ai",
  "integrations",
  "data",
  "account",
] as const;

/** Safely normalize an unknown id to a string */
function normalizeId(idLike: unknown): string {
  if (typeof idLike === "string") return idLike;
  if (typeof idLike === "number" && Number.isFinite(idLike)) return String(idLike);

  if (idLike && typeof idLike === "object") {
    const obj = idLike as { id?: unknown; _id?: unknown; toString?: () => string };
    if (obj.id) return normalizeId(obj.id);
    if (obj._id) return normalizeId(obj._id);
    if (obj.toString && typeof obj.toString === "function") return obj.toString();
  }

  return String(idLike || "");
}

/** Normalize query/hash values into one of our section keys */
function mapQueryToSection(q: string | null | undefined, hash: string | null | undefined): SectionKey | null {
  const val = (q || "").toLowerCase().trim();
  const h = (hash || "").replace(/^#/, "").toLowerCase().trim();

  // Anything "ai", "ai-privacy", "privacy", etc → ai
  const aiAliases = new Set(["ai", "ai-privacy", "privacy", "ai_settings", "ai&privacy", "ai-privacy-section"]);
  if (aiAliases.has(val) || aiAliases.has(h)) return "ai";

  // If val is already a valid section key, use it
  if (SECTION_KEYS.includes(val as SectionKey)) return val as SectionKey;

  // Hash could be a valid key too
  if (SECTION_KEYS.includes(h as SectionKey)) return h as SectionKey;

  return null;
}

export default function SettingsLayout({ user }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("notifications");
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [billing, setBilling] = useState<BillingInfo>(DEFAULT_BILLING);
  const [security, setSecurity] = useState<SettingsSecuritySettings>(DEFAULT_SECURITY);
  const [aiSettings, setAISettings] = useState<SettingsAISettings>(DEFAULT_AI);
  const [integrations, setIntegrations] = useState<IntegrationSettings>(DEFAULT_INTEGRATIONS);

  const { items: subscriptions } = useSubscriptions();
  const { items: orders } = useOrders();
  const { isPro } = useSubscriptionLimit();

  // --- NEW: pick the initial section from query/hash & react to back/forward ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const applyFromUrl = () => {
      const url = new URL(window.location.href);
      const section = mapQueryToSection(
        url.searchParams.get("tab") || url.searchParams.get("section"),
        url.hash
      );
      if (section) setActiveSection(section);
    };

    // initial
    applyFromUrl();

    // respond to history changes
    const onPop = () => applyFromUrl();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // --- NEW: when AI section becomes active, scroll to its anchor if present ---
  useEffect(() => {
    if (activeSection !== "ai") return;
    // Let the AISettings render first
    const t = setTimeout(() => {
      const el = document.getElementById("ai-privacy");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => clearTimeout(t);
  }, [activeSection]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = isMobileApp() || window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(false);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Transform data for child components
  const billingSubscriptions: BillingBasicSubscription[] =
    subscriptions?.map((sub) => ({
      id: normalizeId(sub.id),
      name: sub.name,
      price: typeof sub.price === "number" ? sub.price : 0,
      currency: sub.currency || "USD",
      billingCycle: sub.period as "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
      startedAt: sub.createdAt || new Date().toISOString(),
    })) || [];

  const billingOrders: BillingBasicOrder[] =
    orders?.map((order) => ({
      id: normalizeId(order.id),
      name: order.name,
      date: order.scheduledDate || order.nextDate || order.createdAt,
      vendor: order.vendor || "Unknown",
      total: order.amount || 0,
    })) || [];

  const orderExports: OrderExport[] =
    orders?.map((order) => ({
      id: normalizeId(order.id),
      name: order.name,
      amount: order.amount || 0,
      scheduledDate: order.scheduledDate || order.nextDate || order.createdAt,
      vendor: order.vendor || "Unknown",
    })) || [];

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = {
        notifications: localStorage.getItem("needix_notifications"),
        appSettings: localStorage.getItem("needix_app_settings"),
        billing: localStorage.getItem("needix_billing"),
        security: localStorage.getItem("needix_security"),
        ai: localStorage.getItem("needix_ai"),
        integrations: localStorage.getItem("needix_integrations"),
      };

      if (stored.notifications) {
        const parsed = JSON.parse(stored.notifications);
        if (isNotificationSettings(parsed)) setNotifications(parsed);
      }

      if (stored.appSettings) {
        const parsed = JSON.parse(stored.appSettings);
        if (isAppSettings(parsed)) setAppSettings(parsed);
      }

      if (stored.billing) {
        const parsed = JSON.parse(stored.billing);
        setBilling((prev) => ({ ...prev, ...parsed }));
      }

      if (stored.security) {
        const parsed = JSON.parse(stored.security);
        setSecurity((prev) => ({ ...prev, ...parsed }));
      }

      if (stored.ai) {
        const parsed = JSON.parse(stored.ai);
        setAISettings((prev) => ({ ...prev, ...parsed }));
      }

      if (stored.integrations) {
        const parsed = JSON.parse(stored.integrations);
        setIntegrations((prev) => ({ ...prev, ...parsed }));
      }

      // Update billing info dynamically
      setBilling((prev) => ({
        ...prev,
        plan: isPro ? "pro" : "free",
        status: "active",
        usageCount: subscriptions?.length || 0,
        usageLimit: isPro ? 999 : 2,
      }));

      if ("Notification" in window && "serviceWorker" in navigator) {
        setIntegrations((prev) => ({ ...prev, webPushSupported: true }));
      }
    } catch {
      // fall back to defaults on any parsing error
    }
  }, [isPro, subscriptions?.length]);

  const handleSectionChange = (section: string) => {
    if ((SECTION_KEYS as readonly string[]).includes(section)) {
      setActiveSection(section as SectionKey);

      // Keep URL in sync (nice-to-have)
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", section);
        // keep hash for AI
        if (section === "ai") url.hash = "ai-privacy";
        else url.hash = "";
        window.history.pushState({}, "", url.toString());
      } catch {
        // ignore
      }

      if (isMobile) setShowSidebar(false);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "notifications":
        return <NotificationsSettings notifications={notifications} setNotifications={setNotifications} />;
      case "preferences":
        return <PreferencesSettings appSettings={appSettings} setAppSettings={setAppSettings} />;
      case "billing":
        return (
          <BillingSettings
            billing={billing}
            isPro={isPro}
            subscriptions={billingSubscriptions}
            orders={billingOrders}
          />
        );
      case "security":
        return <SecuritySettings security={security} setSecurity={setSecurity} />;
      case "ai":
        return <AISettings aiSettings={aiSettings} setAISettings={setAISettings} />;
      case "integrations":
        return <IntegrationsSettings integrations={integrations} setIntegrations={setIntegrations} />;
      case "data":
        return <DataSettings subscriptions={billingSubscriptions} orders={orderExports} />;
      case "account":
        return <AccountSettings user={user} />;
      default:
        return <NotificationsSettings notifications={notifications} setNotifications={setNotifications} />;
    }
  };

  const getSectionTitle = () => {
    const section =
      {
        notifications: "🔔 Notifications",
        preferences: "⚙️ Preferences",
        billing: "💳 Billing",
        security: "🔒 Security",
        ai: "🤖 AI & Privacy",
        integrations: "🔗 Integrations",
        data: "📊 Data",
        account: "👤 Account",
      }[activeSection] || "Settings";
    return section;
  };

  if (isMobile) {
    return (
      <div className="relative">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
          <h1 className="text-xl font-bold text-white">{getSectionTitle()}</h1>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors mobile-touch-target"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowSidebar(false)} />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-neutral-900 border-l border-white/10 p-4 overflow-auto pt-safe-top">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Settings Menu</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="rounded px-2 py-1 text-white/80 hover:bg-white/10 mobile-touch-target"
                >
                  ✕
                </button>
              </div>
              <SettingsSidebar
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                isMobile={true}
              />
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="px-4">{renderActiveSection()}</div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex gap-8">
      <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} isMobile={false} />
      <div className="flex-1 max-w-4xl">{renderActiveSection()}</div>
    </div>
  );
}
