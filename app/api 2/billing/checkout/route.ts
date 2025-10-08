// app/api/billing/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

const PRICE_LOOKUP_KEY = process.env.PRICE_LOOKUP_KEY;
const FALLBACK_PRICE_ID = process.env.STRIPE_PRICE_ID;

function appUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

type CheckoutResponse = { url: string } | { error: string };

export async function POST(req: Request): Promise<NextResponse<CheckoutResponse>> {
  try {
    const { email } = (await req.json().catch(() => ({}))) as { email?: unknown };

    if (!PRICE_LOOKUP_KEY && !FALLBACK_PRICE_ID) {
      return NextResponse.json(
        { error: "PRICE_LOOKUP_KEY or STRIPE_PRICE_ID must be set" },
        { status: 500 }
      );
    }

    // Resolve price ID
    let priceId: string;
    if (PRICE_LOOKUP_KEY) {
      const prices = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP_KEY], active: true, limit: 1 });
      const price = prices.data[0];
      if (!price) {
        return NextResponse.json({ error: `No active price for ${PRICE_LOOKUP_KEY}` }, { status: 500 });
      }
      priceId = price.id;
    } else {
      priceId = FALLBACK_PRICE_ID!;
    }

    // Reuse or create a Stripe customer for this email (if provided)
    let customerId: string | undefined = undefined;
    if (typeof email === "string" && email.includes("@")) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data[0]) {
        customerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({ email });
        customerId = created.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      // If we have/reused a customer, pass it; otherwise fall back to just metadata.
      ...(customerId ? { customer: customerId } : {}),
      success_url: `${appUrl()}/billing?status=success`,
      cancel_url: `${appUrl()}/billing?status=cancelled`,
      // Tag email in metadata so the webhook can match even if customer_email is null
      metadata: typeof email === "string" ? { email } : undefined,
      subscription_data: {
        // also carry email on the subscription itself (webhook-friendly)
        metadata: typeof email === "string" ? { email } : undefined,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Checkout session has no URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout] error:", err);
    return NextResponse.json({ error: "Unable to start checkout" }, { status: 500 });
  }
}
