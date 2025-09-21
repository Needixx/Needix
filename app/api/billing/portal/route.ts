// app/api/billing/portal/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

function appUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function getOrCreateCustomer(email: string): Promise<string> {
  const list = await stripe.customers.list({ email, limit: 1 });
  const first = list.data?.[0];
  if (first?.id) return first.id;
  const created = await stripe.customers.create({ email });
  return created.id;
}

type PortalResponse = { url: string } | { error: string };

export async function POST(req: Request): Promise<NextResponse<PortalResponse>> {
  try {
    const { email } = (await req.json().catch(() => ({}))) as { email?: unknown };

    if (typeof email !== "string" || email.length < 3 || !email.includes("@")) {
      return NextResponse.json({ error: "Missing or invalid email" }, { status: 400 });
    }

    const customerId = await getOrCreateCustomer(email);

    const bp = stripe.billingPortal;
    if (!bp) {
      return NextResponse.json(
        { error: "Stripe billing portal unavailable for this API version" },
        { status: 500 }
      );
    }

    const session = await bp.sessions.create({
      customer: customerId,
      return_url: `${appUrl()}/billing?from=portal`,
    });

    const portalUrl: string | null = session.url ?? null;
    if (!portalUrl) {
      return NextResponse.json({ error: "Portal session has no URL" }, { status: 500 });
    }

    return NextResponse.json({ url: portalUrl });
  } catch (err) {
    console.error("[billing/portal] error:", err);
    return NextResponse.json({ error: "Unable to open billing portal" }, { status: 500 });
  }
}
