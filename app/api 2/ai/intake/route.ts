// app/api/ai/intake/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import {
  IntakePayload,
  IntakePayload as IntakePayloadT,
  SubscriptionInputT,
  ExpenseInputT,
} from "@/lib/ai/schemas";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** Safely extract function-call arguments across OpenAI SDK versions without using `any`. */
function extractToolArguments(
  choice: OpenAI.Chat.Completions.ChatCompletion.Choice | undefined
): string | undefined {
  const toolCalls = choice?.message?.tool_calls;
  const first = toolCalls?.[0] as unknown;
  if (
    first &&
    typeof first === "object" &&
    "type" in first &&
    (first as { type?: string }).type === "function" &&
    "function" in first &&
    typeof (first as { function?: { arguments?: unknown } }).function?.arguments === "string"
  ) {
    return (first as { function: { arguments: string } }).function.arguments;
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured: OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { text?: string } | null;
    const text = body?.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Missing 'text' in body" }, { status: 400 });
    }

    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "emit_intake_payload",
          description:
            "Emit strictly-typed intake payload: subscriptions (recurring), orders (merchant/items), expenses (one-offs). Use USD default. Orders are always created as 'active' status.",
          parameters: {
            type: "object",
            properties: {
              subscriptions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    amount: { type: "number" },
                    currency: { type: "string" },
                    billingInterval: {
                      type: "string",
                      enum: ["none", "daily", "weekly", "monthly", "yearly", "custom"],
                    },
                    nextBillingDate: { type: "string" },
                    notes: { type: "string" },
                    category: { type: "string" },
                    vendorUrl: { type: "string" },
                    status: { type: "string", enum: ["active", "paused", "canceled"] },
                  },
                  required: ["name", "amount"],
                  additionalProperties: false,
                },
              },
              orders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    merchant: { type: "string" },
                    total: { type: "number" },
                    currency: { type: "string" },
                    orderDate: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          qty: { type: "integer" },
                          unitPrice: { type: "number" },
                        },
                        required: ["name"],
                        additionalProperties: false,
                      },
                    },
                    notes: { type: "string" },
                    category: { type: "string" },
                  },
                  required: ["merchant", "total"],
                  additionalProperties: false,
                },
              },
              expenses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    amount: { type: "number" },
                    currency: { type: "string" },
                    date: { type: "string" },
                    merchant: { type: "string" },
                    category: { type: "string" },
                    recur: {
                      type: "string",
                      enum: ["none", "daily", "weekly", "monthly", "yearly", "custom"],
                    },
                  },
                  required: ["description", "amount"],
                  additionalProperties: false,
                },
              },
            },
            required: [],
            additionalProperties: false,
          },
        },
      },
    ];

    // Get current date for better AI context
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-based
    const currentDay = currentDate.getDate();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const system = `You are a precise financial intake parser for Needix. Convert user free text into structured subscriptions, orders, and expenses. 

CURRENT DATE CONTEXT:
- Today is ${monthName} ${currentDay}, ${currentYear}
- Current month is ${monthName} ${currentYear}
- When user says "this month" they mean ${monthName} ${currentYear}
- When user says "last month" they mean the previous month
- When user says "next month" they mean the month after ${monthName}

CLASSIFICATION RULES:
SUBSCRIPTIONS = Recurring services that automatically charge the user (Netflix, Spotify, ChatGPT Pro, etc.)
- Keywords: "subscription", "charged me", "renews", "monthly billing", "auto-pay"
- Examples: "Netflix charged me", "ChatGPT Pro subscription", "Spotify renews monthly"

ORDERS = One-time or planned purchases from merchants
- Keywords: "need to order", "want to buy", "planning to purchase", "going to order"
- Examples: "need to order groceries", "want to buy a laptop", "planning to order supplies"

EXPENSES = One-time costs or bills (rent, utilities, groceries bought, etc.)
- Keywords: "paid for", "spent on", "bought", "bill", "invoice"
- Examples: "paid rent", "bought groceries", "electricity bill"

DATE RULES:
- Use ISO 8601 dates (YYYY-MM-DD format)
- If user says "charged me this month on the 15th", use ${currentYear}-${currentMonth.toString().padStart(2, '0')}-15
- If user says "renews monthly", calculate next billing date from the last charge date
- If no specific date given, omit the date field entirely
- ALWAYS use ${currentYear} for current year unless explicitly told otherwise

IMPORTANT: 
- All orders should be created in 'active' status so users can mark them as completed when they actually make the purchase
- Use USD if currency absent
- Do not invent missing amounts or dates; omit instead
- Pay close attention to past tense vs future tense to distinguish subscriptions vs orders`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      tools,
      tool_choice: { type: "function", function: { name: "emit_intake_payload" } },
      messages: [
        { role: "system", content: system },
        { role: "user", content: text },
      ],
    });

    const args = extractToolArguments(completion.choices[0]);
    if (!args) {
      return NextResponse.json({ error: "No structured output from AI." }, { status: 422 });
    }

    const candidate = IntakePayload.safeParse(JSON.parse(args));
    if (!candidate.success) {
      return NextResponse.json(
        { error: "AI output failed validation", details: candidate.error.flatten() },
        { status: 422 }
      );
    }
    const parsed: IntakePayloadT = candidate.data;

    const userId = session.user.id;

    // ✅ Ensure a User row exists for this id (prevents FK errors in dev or fresh DBs)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
    });

    const results = await prisma.$transaction(async (tx) => {
      const createdSubs =
        parsed.subscriptions.length > 0
          ? await tx.subscription.createMany({
              data: parsed.subscriptions.map((s: SubscriptionInputT) => ({
                userId,
                name: s.name,
                amount: s.amount,
                currency: s.currency ?? "USD",
                interval: s.billingInterval ?? "monthly",
                nextBillingAt: s.nextBillingDate ? new Date(s.nextBillingDate) : null,
                notes: s.notes ?? null,
                category: s.category ?? null,
                vendorUrl: s.vendorUrl ?? null,
                status: s.status ?? "active",
              })),
            })
          : { count: 0 };

      const createdOrders: string[] = [];
      for (const orderInput of parsed.orders) {
        // Create order data with active status
        const orderData = {
          userId,
          merchant: orderInput.merchant,
          total: orderInput.total,
          currency: orderInput.currency ?? "USD",
          orderDate: orderInput.orderDate ? new Date(orderInput.orderDate) : new Date(),
          status: "active" as const,
          notes: orderInput.notes ?? null,
          category: orderInput.category ?? null,
          items: {
            create: (orderInput.items ?? []).map((i) => ({
              name: i.name,
              qty: i.qty ?? 1,
              unitPrice: i.unitPrice ?? null,
            })),
          },
        };

        const order = await tx.order.create({
          data: orderData,
          select: { id: true },
        });
        createdOrders.push(order.id);
      }

      const createdExpenses =
        parsed.expenses.length > 0
          ? await tx.expense.createMany({
              data: parsed.expenses.map((e: ExpenseInputT) => ({
                userId,
                description: e.description,
                amount: e.amount,
                currency: e.currency ?? "USD",
                date: e.date ? new Date(e.date) : new Date(),
                merchant: e.merchant ?? null,
                category: e.category ?? null,
                recurrence: e.recur ?? "none",
              })),
            })
          : { count: 0 };

      return { createdSubs, createdOrders, createdExpenses };
    });

    return NextResponse.json({ ok: true, results, payload: parsed });
  } catch (err) {
    // Log for server debugging; return JSON error to client
    console.error("[/api/ai/intake] Unhandled error:", err);
    const message =
      err instanceof Error ? err.message : "Unknown server error while processing intake.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}