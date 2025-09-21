// app/api/billing/checkout/route.ts
// Full replacement
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const PRICE_LOOKUP_KEY = process.env.PRICE_LOOKUP_KEY; // recommended
const FALLBACK_PRICE_ID = process.env.STRIPE_PRICE_ID; // optional fallback

function appUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

type CheckoutResponse = { url: string } | { error: string };

export async function POST(): Promise<NextResponse<CheckoutResponse>> {
  try {
    if (!PRICE_LOOKUP_KEY && !FALLBACK_PRICE_ID) {
      return NextResponse.json(
        { error: "PRICE_LOOKUP_KEY or STRIPE_PRICE_ID must be set" },
        { status: 500 }
      );
    }

    // Resolve price ID safely
    let priceId: string | null = null;

    if (PRICE_LOOKUP_KEY) {
      const prices = await stripe.prices.list({
        lookup_keys: [PRICE_LOOKUP_KEY],
        active: true,
        limit: 1,
      });

      const price = prices.data[0];
      if (!price) {
        return NextResponse.json(
          { error: `No active price found for lookup key "${PRICE_LOOKUP_KEY}"` },
          { status: 500 }
        );
      }
      priceId = price.id;
    } else {
      priceId = FALLBACK_PRICE_ID!;
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl()}/billing?status=success`,
      cancel_url: `${appUrl()}/billing?status=cancelled`,
      // (Optional) If you wire NextAuth later, add customer_email here
      subscription_data: {
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
    });

    // Guard: Stripe types allow null here; only return when it's a string
    if (!checkout.url) {
      return NextResponse.json({ error: "Checkout session has no URL" }, { status: 500 });
    }

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[billing/checkout] error:", err);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
