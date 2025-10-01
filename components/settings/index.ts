// components/settings/index.ts
export { default as SettingsLayout } from "@/components/settings/SettingsLayout";
export { default as SettingsSidebar } from "@/components/settings/SettingsSidebar";
export { default as NotificationsSettings } from "@/components/settings/NotificationsSettings";
export { default as PreferencesSettings } from "@/components/settings/PreferencesSettings";
export { default as BillingSettings } from "@/components/settings/BillingSettings";
export { default as DataSettings } from "@/components/settings/DataSettings";
export { default as SecuritySettings } from "@/components/settings/SecuritySettings";
export { default as AISettings } from "@/components/settings/AISettings";
export { default as IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
export { default as AccountSettings } from "@/components/settings/AccountSettings";

export type {
  NotificationSettings,
  AppSettings,
  BillingInfo,
  SettingsSecuritySettings,
  SettingsAISettings,
  IntegrationSettings,
} from "@/components/settings/types";