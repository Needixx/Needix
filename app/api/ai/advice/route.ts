// app/api/ai/advice/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { AdvicePlan } from "@/lib/ai/advice";

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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { horizonMonths = 3 } = (await req.json().catch(() => ({}))) as {
    horizonMonths?: number;
  };

  const userId = session.user.id;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [subs, expenses, orders] = await Promise.all([
    prisma.subscription.findMany({ where: { userId, status: "active" } }),
    prisma.expense.findMany({ where: { userId, date: { gte: oneYearAgo } } }),
    prisma.order.findMany({
      where: { userId, orderDate: { gte: oneYearAgo } },
      include: { items: true },
    }),
  ]);

  const monthlyRecurring = subs.reduce((sum, s) => {
    const amount = Number(s.amount) || 0;
    const factor =
      s.interval === "monthly"
        ? 1
        : s.interval === "yearly"
        ? 1 / 12
        : s.interval === "weekly"
        ? 4.345
        : 0;
    return sum + amount * factor;
  }, 0);

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalOrders = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);

  const system =
    "You are a practical financial savings coach. Given the user's structured spend data, produce a tactical savings plan with clear actions and conservative savings estimates. Do not invent data; use only what's provided.";

  const userFacts = {
    monthlyRecurringApprox: monthlyRecurring,
    totals: { totalExpenses, totalOrders },
    subscriptions: subs.map((s) => ({
      name: s.name,
      amount: Number(s.amount),
      interval: s.interval,
      category: s.category,
      status: s.status,
    })),
    expensesRecentYear: expenses.map((e) => ({
      amount: Number(e.amount),
      date: e.date,
      category: e.category,
      merchant: e.merchant,
    })),
    ordersRecentYear: orders.map((o) => ({
      merchant: o.merchant,
      total: Number(o.total),
      date: o.orderDate,
      items: o.items?.map((i) => ({
        name: i.name,
        qty: i.qty,
        unitPrice: i.unitPrice !== null ? Number(i.unitPrice) : null,
      })),
    })),
    horizonMonths,
  };

  const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: "function",
      function: {
        name: "emit_advice_plan",
        description:
          "Emit the AdvicePlan JSON with summary, quickWinsMonthly, projectedSavings3m/12m, actions[], and optional notes.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string" },
            quickWinsMonthly: { type: "number" },
            projectedSavings3m: { type: "number" },
            projectedSavings12m: { type: "number" },
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["cancel", "downgrade", "negotiate", "optimize", "reminder"],
                  },
                  target: { type: "string" },
                  rationale: { type: "string" },
                  estimatedMonthlySavings: { type: "number" },
                  steps: { type: "array", items: { type: "string" } },
                  confidence: { type: "number" },
                },
                required: ["type", "target", "rationale"],
                additionalProperties: false,
              },
            },
            notes: { type: "string" },
          },
          required: ["summary", "quickWinsMonthly", "projectedSavings3m", "projectedSavings12m", "actions"],
          additionalProperties: false,
        },
      },
    },
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    tools,
    tool_choice: { type: "function", function: { name: "emit_advice_plan" } },
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(userFacts) },
    ],
  });

  const args = extractToolArguments(completion.choices[0]);
  if (!args) {
    return NextResponse.json({ error: "No structured plan produced" }, { status: 422 });
  }

  let planJson: unknown;
  try {
    planJson = JSON.parse(args);
  } catch {
    return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 422 });
  }

  const validated = AdvicePlan.safeParse(planJson);
  if (!validated.success) {
    return NextResponse.json(
      { error: "Advice schema validation failed", details: validated.error.flatten() },
      { status: 422 }
    );
  }

  return NextResponse.json({ ok: true, plan: validated.data });
}
