// lib/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments, Products } from 'plaid';
import type { CountryCode } from 'plaid';

// Read env vars directly to avoid circular dependency issues
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV;
const PLAID_WEBHOOK_URL = process.env.PLAID_WEBHOOK_URL;

// Check if Plaid is configured
export const isPlaidConfigured = (): boolean => {
  return !!(PLAID_CLIENT_ID && PLAID_SECRET && PLAID_ENV);
};

// Helper to get environment
const getPlaidEnvironment = () => {
  if (!PLAID_ENV) return PlaidEnvironments.sandbox;
  
  switch (PLAID_ENV) {
    case 'production':
      return PlaidEnvironments.production;
    case 'development':
      return PlaidEnvironments.development;
    case 'sandbox':
    default:
      return PlaidEnvironments.sandbox;
  }
};

// Initialize Plaid client
let plaidClientInstance: PlaidApi | null = null;

if (isPlaidConfigured()) {
  const configuration = new Configuration({
    basePath: getPlaidEnvironment(),
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': PLAID_CLIENT_ID!,
        'PLAID-SECRET': PLAID_SECRET!,
      },
    },
  });

  plaidClientInstance = new PlaidApi(configuration);
}

// Export plaidClient with proper typing
export const plaidClient = plaidClientInstance as PlaidApi;

// Default products to request from Plaid
export const PLAID_PRODUCTS: Products[] = [Products.Transactions];

// Default country codes - use type assertion to satisfy TypeScript
export const PLAID_COUNTRY_CODES = ['US'] as CountryCode[];

// Webhook verification
export const verifyPlaidWebhook = (webhookUrl: string, _webhookCode: string): boolean => {
  if (!PLAID_WEBHOOK_URL) return false;
  return webhookUrl === PLAID_WEBHOOK_URL;
};

// Helper to detect if a transaction is recurring
export const detectRecurringTransaction = (
  merchantName: string,
  amount: number,
  transactions: Array<{ merchantName: string; amount: number; date: Date }>
): boolean => {
  const recentTransactions = transactions.filter(
    (t) =>
      t.merchantName.toLowerCase() === merchantName.toLowerCase() &&
      Math.abs(t.amount - amount) < 1.0 &&
      t.date > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  );

  return recentTransactions.length >= 2;
};

// Helper to normalize merchant names
export const normalizeMerchantName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
};

// Common subscription merchant patterns
export const SUBSCRIPTION_PATTERNS = [
  /netflix/i,
  /spotify/i,
  /apple.*music/i,
  /amazon.*prime/i,
  /disney.*plus/i,
  /hbo.*max/i,
  /hulu/i,
  /youtube.*premium/i,
  /adobe/i,
  /microsoft.*365/i,
  /google.*one/i,
  /dropbox/i,
  /github/i,
  /linkedin.*premium/i,
  /audible/i,
  /patreon/i,
];