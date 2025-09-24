// components/settings/SettingsLayout.tsx
"use client";

import { useState, useEffect } from "react";
import type { User } from "next-auth";
import { useSubscriptions } from "@/lib/useSubscriptions";
import { useOrders } from "@/lib/useOrders";
import { useSubscriptionLimit } from "@/lib/useSubscriptionLimit";

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

/** Safely normalize an unknown id to a string to satisfy no-base-to-string (no unbound methods) */
function normalizeId(idLike: unknown): string {
  if (typeof idLike === "string") return idLike;
  if (typeof idLike === "number" && Number.isFinite(idLike)) return String(idLike);

  if (idLike && typeof idLike === "object") {
    const obj = idLike as { id?: unknown; _id?: unknown; toString?: () => string };
    if (typeof obj.id === "string" && obj.id) return obj.id;
    if (typeof obj._id === "string" && obj._id) return obj._id;
    if (typeof obj.toString === "function") {
      const s = obj.toString(); // direct call; no unbound method reference
      if (typeof s === "string" && s && s !== "[object Object]") return s;
    }
  }
  return crypto.randomUUID();
}

export default function SettingsLayout({ user }: SettingsLayoutProps) {
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [billing, setBilling] = useState<BillingInfo>(DEFAULT_BILLING);
  const [security, setSecurity] = useState<SettingsSecuritySettings>(DEFAULT_SECURITY);
  const [aiSettings, setAISettings] = useState<SettingsAISettings>(DEFAULT_AI);
  const [integrations, setIntegrations] = useState<IntegrationSettings>(DEFAULT_INTEGRATIONS);
  const [activeSection, setActiveSection] = useState<SectionKey>("notifications");

  // Raw data from hooks
  const { items: subscriptions } = useSubscriptions();
  const { items: orders } = useOrders();
  const { isPro } = useSubscriptionLimit();

  // ---- Adapt raw models to the exact shapes the settings views expect ----
  const billingSubscriptions: BillingBasicSubscription[] = subscriptions.map((s) => {
    const src = s as unknown as Record<string, unknown>;
    const price = Number(src.price ?? src.amount ?? 0);
    const currency = (src.currency as string | undefined) ?? "USD";
    const name =
      (src.name as string | undefined) ??
      (src.merchant as string | undefined) ??
      "Subscription";
    const billingCycle =
      (src.billingCycle as BillingBasicSubscription["billingCycle"] | undefined) ??
      (src.interval as BillingBasicSubscription["billingCycle"] | undefined) ??
      "monthly";
    const startedAt =
      (src.startedAt as string | undefined) ??
      (src.createdAt as string | undefined) ??
      new Date().toISOString();

    return {
      id: normalizeId(src.id),
      name,
      price,
      currency,
      billingCycle,
      startedAt,
    };
  });

  const billingOrders: BillingBasicOrder[] = orders.map((o) => {
    const src = o as unknown as Record<string, unknown>;
    const items = src.items as Array<Record<string, unknown>> | undefined;
    const computedFromItems =
      items?.reduce<number>((sum, it) => {
        const p = Number(it.price ?? 0);
        const q = Number((it.quantity as number | undefined) ?? (it.qty as number | undefined) ?? 1);
        return sum + p * q;
      }, 0) ?? 0;

    const vendor =
      (src.vendor as string | undefined) ??
      (src.merchant as string | undefined) ??
      (src.store as string | undefined) ??
      "Unknown";

    const name =
      (src.name as string | undefined) ??
      (src.title as string | undefined) ??
      vendor;

    const date =
      (src.date as string | undefined) ??
      (src.createdAt as string | undefined) ??
      new Date().toISOString();

    const total = Number(src.total ?? computedFromItems);

    return {
      id: normalizeId(src.id),
      name,
      date,
      vendor,
      total,
    };
  });

  const orderExports: OrderExport[] = billingOrders.map((bo) => ({
    id: bo.id,
    name: bo.name,
    date: bo.date,
    vendor: bo.vendor,
    total: bo.total,
  }));
  // -----------------------------------------------------------------------

  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem("needix_notifications");
      if (savedNotifications) {
        const parsed: unknown = JSON.parse(savedNotifications);
        if (isNotificationSettings(parsed)) setNotifications(parsed);
      }

      const savedAppSettings = localStorage.getItem("needix_app_settings");
      if (savedAppSettings) {
        const parsed: unknown = JSON.parse(savedAppSettings);
        if (isAppSettings(parsed)) setAppSettings(parsed);
      }

      setBilling({
        plan: isPro ? "pro" : "free",
        status: "active",
        usageCount: subscriptions.length,
        usageLimit: isPro ? 999 : 2,
      });

      if ("Notification" in window && "serviceWorker" in navigator) {
        setIntegrations((prev) => ({ ...prev, webPushSupported: true }));
      }
    } catch {
      // fall back to defaults on any parsing error
    }
  }, [isPro, subscriptions.length]);

  const handleSectionChange = (section: string) => {
    if ((SECTION_KEYS as readonly string[]).includes(section)) {
      setActiveSection(section as SectionKey);
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

  return (
    <div className="flex gap-8">
      <SettingsSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <div className="flex-1 max-w-4xl">{renderActiveSection()}</div>
    </div>
  );
}
