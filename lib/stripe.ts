// lib/stripe.ts
// Full replacement
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Do NOT pin apiVersion – it causes literal type mismatches across versions.
// Let Stripe use the account default.
export const stripe = new Stripe(key, { typescript: true });
