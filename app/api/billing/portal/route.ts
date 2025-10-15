// app/api/billing/portal/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth"; // must return the server session

export const runtime = "nodejs";

function appUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

async function getOrCreateCustomerByEmail(email: string): Promise<string> {
  // Try to find an existing customer first (prevents dupes)
  const list = await stripe.customers.list({ email, limit: 1 });
  const first = list.data?.[0];
  if (first?.id) return first.id;
  const created = await stripe.customers.create({ email });
  return created.id;
}

export async function POST() {
  try {
    const session = await auth();
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure customer exists
    const customerId = await getOrCreateCustomerByEmail(email);

    if (!stripe.billingPortal) {
      return NextResponse.json(
        { error: "Stripe billing portal unavailable for this API version" },
        { status: 500 }
      );
    }

    const sessionResp = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl()}/billing?from=portal`,
    });

    if (!sessionResp.url) {
      return NextResponse.json({ error: "Portal session has no URL" }, { status: 500 });
    }

    return NextResponse.json({ url: sessionResp.url });
  } catch (err) {
    console.error("[billing/portal] error:", err);
    return NextResponse.json({ error: "Unable to open billing portal" }, { status: 500 });
  }
}

// Allow GET too in case the client does a GET by mistake
export const GET = POST;
