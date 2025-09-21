// app/api/webhooks/stripe/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

const secret = process.env.STRIPE_WEBHOOK_SECRET;

/** Map Stripe sub status to a boolean Pro flag */
function isProFromStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/** Some Stripe typings omit these fields; extend for safety. */
type SubLike = Stripe.Subscription & {
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
};

/** Narrow helpers without using `any` / unsafe member access */
function isCheckoutSession(x: unknown): x is Stripe.Checkout.Session {
  if (typeof x !== "object" || x === null) return false;
  const objType = (x as { object?: unknown }).object;
  return objType === "checkout.session";
}
function isSubscription(x: unknown): x is SubLike {
  if (typeof x !== "object" || x === null) return false;
  const objType = (x as { object?: unknown }).object;
  return objType === "subscription";
}
function isInvoice(x: unknown): x is Stripe.Invoice {
  if (typeof x !== "object" || x === null) return false;
  const objType = (x as { object?: unknown }).object;
  return objType === "invoice";
}

/** Update a user either by Stripe customer id or by email. */
async function setProByEmailOrCustomer(opts: {
  email?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  status?: string | null;
  currentPeriodEnd?: number | null; // unix seconds
  cancelAtPeriodEnd?: boolean | null;
}) {
  const {
    email,
    customerId,
    subscriptionId,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = opts;

  // Build a plain object; cast to Prisma arg types at callsites via `unknown`.
  const updateData: Record<string, unknown> = {
    ...(customerId ? { stripeCustomerId: customerId } : {}),
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    ...(typeof cancelAtPeriodEnd === "boolean" ? { cancelAtPeriodEnd } : {}),
    ...(typeof currentPeriodEnd === "number"
      ? { currentPeriodEnd: new Date(currentPeriodEnd * 1000) }
      : {}),
    ...(status !== undefined ? { isPro: isProFromStatus(status) } : {}),
    // Your schema has `planStatus` enum; assigning the raw string is OK at runtime.
    ...(status !== undefined ? { planStatus: status } : {}),
  };

  // Infer Prisma types from the client to avoid `any`.
  type UpdateManyArgs = Parameters<typeof prisma.user.updateMany>[0];
  type UpdateArgs = Parameters<typeof prisma.user.update>[0];

  // 1) Prefer updating by Stripe customer id
  if (customerId) {
    const updated = await prisma.user.updateMany({
      where: ({ stripeCustomerId: customerId } as unknown) as UpdateManyArgs["where"],
      data: (updateData as unknown) as UpdateManyArgs["data"],
    });
    if (updated.count > 0) return;
  }

  // 2) Fallback to email if present (don’t create ghost users)
  if (email) {
    try {
      await prisma.user.update({
        where: { email },
        data: (updateData as unknown) as UpdateArgs["data"],
      });
    } catch {
      // No user with that email yet — ignore or log as needed.
    }
  }
}

export async function POST(req: Request) {
  if (!secret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  try {
    const sig = req.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Raw body required for Stripe verification
    const raw = await req.text();
    const event = await stripe.webhooks.constructEventAsync(raw, sig, secret);

    // 🔐 Optional idempotency guard.
    // Use dynamic access so this compiles even if you haven't added/regenerated the WebhookEvent model yet.
    try {
      const prismaAny = prisma as unknown as {
        webhookEvent?: {
          findUnique(args: { where: { id: string }; select?: { id: boolean } }): Promise<{ id: string } | null>;
          create(args: { data: { id: string; type: string } }): Promise<unknown>;
        };
      };
      if (prismaAny.webhookEvent) {
        const existed = await prismaAny.webhookEvent.findUnique({
          where: { id: event.id },
          select: { id: true },
        });
        if (existed) {
          return NextResponse.json({ received: true });
        }
        await prismaAny.webhookEvent.create({
          data: { id: event.id, type: event.type },
        });
      }
    } catch {
      // If the WebhookEvent table doesn't exist yet, continue without failing.
    }

    const obj = event.data.object as unknown;

    switch (event.type) {
      case "checkout.session.completed": {
        if (isCheckoutSession(obj)) {
          const emailFromSession =
            obj.customer_details?.email ??
            obj.customer_email ??
            (typeof obj.metadata?.email === "string" ? obj.metadata.email : null);

          await setProByEmailOrCustomer({
            email: emailFromSession ?? null,
            customerId:
              typeof obj.customer === "string" ? obj.customer : obj.customer?.id ?? null,
            subscriptionId:
              typeof obj.subscription === "string"
                ? obj.subscription
                : obj.subscription?.id ?? null,
            status: "active", // treat as activated; subsequent sub events will confirm
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        if (isSubscription(obj)) {
          const emailFromMeta =
            typeof obj.metadata?.email === "string" ? obj.metadata.email : null;

          // If no email in metadata, attempt to fetch the customer to get an email
          let emailFromCustomer: string | null = null;
          if (!emailFromMeta && obj.customer) {
            const cId = typeof obj.customer === "string" ? obj.customer : obj.customer.id;
            try {
              const customerResp = await stripe.customers.retrieve(cId);
              // Stripe.Response<T> is T & { lastResponse: ... }
              if ("email" in customerResp && typeof (customerResp as Stripe.Customer).email === "string") {
                emailFromCustomer = (customerResp as Stripe.Customer).email!;
              }
            } catch {
              // ignore
            }
          }

          await setProByEmailOrCustomer({
            email: emailFromMeta ?? emailFromCustomer,
            customerId:
              typeof obj.customer === "string" ? obj.customer : obj.customer?.id ?? null,
            subscriptionId: obj.id,
            status: obj.status,
            currentPeriodEnd: obj.current_period_end ?? null,
            cancelAtPeriodEnd: obj.cancel_at_period_end ?? null,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        if (isSubscription(obj)) {
          await setProByEmailOrCustomer({
            customerId:
              typeof obj.customer === "string" ? obj.customer : obj.customer?.id ?? null,
            subscriptionId: obj.id,
            status: "canceled",
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        if (isInvoice(obj)) {
          const emailFromMeta =
            typeof obj.metadata?.email === "string" ? obj.metadata.email : null;
          await setProByEmailOrCustomer({
            email: emailFromMeta ?? obj.customer_email ?? null,
            customerId:
              typeof obj.customer === "string" ? obj.customer : obj.customer?.id ?? null,
            status: "unpaid",
          });
        }
        break;
      }

      default:
        // Unhandled events can be ignored or logged
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ webhook error:", err);
    return NextResponse.json(
      { error: "Invalid signature or handler error" },
      { status: 400 }
    );
  }
}
