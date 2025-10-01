// components/settings/types.ts

export type NotificationSettings = {
  renewalReminders: boolean;
  priceAlerts: boolean;
  priceChanges: boolean;
  weeklyDigest: boolean;
  emailNotifications: boolean;
  webPush: boolean;
  renewalLeadDays: number;
  priceChangeThreshold: number;
  digestDay: string;
  digestTime: string;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
};

export type AppSettings = {
  theme: "dark" | "light" | "system";
  currency: "USD" | "EUR" | "GBP";
  timezone: string;
  weekStart: "sunday" | "monday";
  defaultView: "grid" | "list";
  compactMode: boolean;
  defaultTab: "subscriptions" | "expenses" | "orders";
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY";
  numberFormat: "US" | "EU";
};

export type BillingInfo = {
  plan: "free" | "pro";
  status: "active" | "canceled" | "past_due";
  renewalDate?: string;
  usageCount: number;
  usageLimit: number;
};

export type SettingsSecuritySettings = {
  twoFactorEnabled: boolean;
  activeSessions: number;
};

export type SettingsAISettings = {
  allowDataAccess: boolean;
  retainHistory: boolean;
  autoFillForms: boolean;
};

export type IntegrationSettings = {
  googleConnected: boolean;
  plaidConnected: boolean;
  stripeCustomerId?: string;
  webPushSupported: boolean;
};

// Default values
export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  renewalReminders: true,
  priceAlerts: true,
  priceChanges: true,
  weeklyDigest: false,
  emailNotifications: true,
  webPush: false,
  renewalLeadDays: 7,
  priceChangeThreshold: 10,
  digestDay: "monday",
  digestTime: "09:00",
  quietHours: false,
  quietStart: "22:00",
  quietEnd: "08:00",
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "dark",
  currency: "USD",
  timezone: "America/New_York",
  weekStart: "sunday",
  defaultView: "grid",
  compactMode: false,
  defaultTab: "subscriptions",
  dateFormat: "MM/DD/YYYY",
  numberFormat: "US",
};

export const DEFAULT_BILLING: BillingInfo = {
  plan: "free",
  status: "active",
  usageCount: 0,
  usageLimit: 2,
};

export const DEFAULT_SECURITY: SettingsSecuritySettings = {
  twoFactorEnabled: false,
  activeSessions: 1,
};

export const DEFAULT_AI: SettingsAISettings = {
  allowDataAccess: true,
  retainHistory: true,
  autoFillForms: false,
};

export const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  googleConnected: false,
  webPushSupported: false,
  plaidConnected: false,
};

// Type guards
export function isNotificationSettings(v: unknown): v is NotificationSettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.renewalReminders === "boolean" &&
    typeof settings.priceAlerts === "boolean" &&
    typeof settings.priceChanges === "boolean" &&
    typeof settings.weeklyDigest === "boolean" &&
    typeof settings.emailNotifications === "boolean"
  );
}

export function isAppSettings(v: unknown): v is AppSettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    (settings.theme === "dark" || settings.theme === "light" || settings.theme === "system") &&
    (settings.currency === "USD" || settings.currency === "EUR" || settings.currency === "GBP") &&
    (settings.defaultView === "grid" || settings.defaultView === "list") &&
    typeof settings.compactMode === "boolean"
  );
}

export function isSecuritySettings(v: unknown): v is SettingsSecuritySettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.twoFactorEnabled === "boolean" &&
    typeof settings.activeSessions === "number"
  );
}

export function isAISettings(v: unknown): v is SettingsAISettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.allowDataAccess === "boolean" &&
    typeof settings.retainHistory === "boolean" &&
    typeof settings.autoFillForms === "boolean"
  );
}

export function isIntegrationSettings(v: unknown): v is IntegrationSettings {
  if (typeof v !== "object" || v === null) return false;
  const settings = v as Record<string, unknown>;
  return (
    typeof settings.googleConnected === "boolean" &&
    typeof settings.webPushSupported === "boolean"
  );
}

