// app/api/billing/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const PRICE_LOOKUP_KEY = process.env.PRICE_LOOKUP_KEY;     // optional
const FALLBACK_PRICE_ID = process.env.STRIPE_PRICE_ID;     // e.g. price_...

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
    let priceId: string | undefined;
    if (PRICE_LOOKUP_KEY) {
      const prices = await stripe.prices.list({ lookup_keys: [PRICE_LOOKUP_KEY], active: true, limit: 1 });
      const price = prices.data[0];
      if (!price) {
        return NextResponse.json(
          { error: `No active price found for lookup key "${PRICE_LOOKUP_KEY}" in this Stripe mode` },
          { status: 400 }
        );
      }
      priceId = price.id;
    } else {
      priceId = FALLBACK_PRICE_ID!;
    }

    // Validate the price actually exists in this mode (catches live/test mismatch)
    try {
      const p = await stripe.prices.retrieve(priceId);
      if (!p?.active) {
        return NextResponse.json({ error: `Stripe price ${priceId} is not active` }, { status: 400 });
      }
    } catch (e: any) {
      // Typically: "No such price: 'price_xxx'"
      return NextResponse.json({ error: e?.message ?? "Invalid price ID for this Stripe mode" }, { status: 400 });
    }

    // Reuse or create a Stripe customer for this email (if provided)
    let customerId: string | undefined;
    if (typeof email === "string" && email.includes("@")) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data[0]?.id ?? (await stripe.customers.create({ email })).id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId ? { customer: customerId } : {}),
      success_url: `${appUrl()}/billing?status=success`,
      cancel_url: `${appUrl()}/billing?status=cancelled`,
      metadata: typeof email === "string" ? { email } : undefined,
      subscription_data: {
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
