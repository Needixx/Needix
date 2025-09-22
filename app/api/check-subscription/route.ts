import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const raw: unknown = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email } = parsed.data;

    // Find customer in Stripe
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer: Stripe.Customer | undefined = customers.data[0];

    if (!customer) {
      return NextResponse.json({
        isPro: false,
        status: "no_customer",
      });
    }

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 10,
    });

    const hasActiveSubscription = subscriptions.data.length > 0;

    const subscriptionData = subscriptions.data.map((sub) => ({
      id: sub.id,
      status: sub.status,
    }));

    return NextResponse.json({
      isPro: hasActiveSubscription,
      status: hasActiveSubscription ? "active" : "cancelled",
      subscriptions: subscriptionData,
    });
  } catch (error: unknown) {
    // Keep error type-safe
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error checking subscription:", message);
    return NextResponse.json(
      { error: "Error checking subscription", details: message },
      { status: 500 }
    );
  }
}
