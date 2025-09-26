// /lib/env.ts
import { z } from "zod";

const EnvSchema = z.object({
  AUTH_SECRET: z.string().min(1, "Missing AUTH_SECRET"),
  DATABASE_URL: z.string().url("Invalid DATABASE_URL"),
  RESEND_API_KEY: z.string().min(1, "Missing RESEND_API_KEY"),
  RESEND_FROM: z.string().email("RESEND_FROM must be an email"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "Invalid STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "Missing STRIPE_WEBHOOK_SECRET"),
  NEXTAUTH_URL: z.string().url("Invalid NEXTAUTH_URL"),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
});

export const env = EnvSchema.parse({
  AUTH_SECRET: process.env.AUTH_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
});

/**
 * Mask a value for safe logging (shows first/last 4 chars only).
 */
export const mask = (value?: string): string =>
  value ? value.slice(0, 4) + "…" + value.slice(-4) : "(unset)";

/**
 * Diagnostic helper to check env setup without leaking secrets.
 * Example: debug.log(envReport())
 */
export const envReport = () => ({
  AUTH_SECRET: !!process.env.AUTH_SECRET,
  DATABASE_URL: !!process.env.DATABASE_URL,
  RESEND_API_KEY: mask(process.env.RESEND_API_KEY),
  RESEND_FROM: process.env.RESEND_FROM,
  STRIPE_SECRET_KEY: mask(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  VAPID_PUBLIC_KEY: mask(process.env.VAPID_PUBLIC_KEY),
  VAPID_PRIVATE_KEY: mask(process.env.VAPID_PRIVATE_KEY),
  VAPID_SUBJECT: process.env.VAPID_SUBJECT,
});
