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

  // Fixed: Use proper Prisma model names - they should match your schema exactly
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

  const user = `My data (last 12 months):
- Monthly recurring: $${monthlyRecurring.toFixed(2)}
- Total one-time expenses: $${totalExpenses.toFixed(2)}  
- Total orders: $${totalOrders.toFixed(2)}
- Planning horizon: ${horizonMonths} months

Give me specific saving recommendations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_advice_plan",
            description: "Emit a structured savings advice plan",
            parameters: {
              type: "object",
              properties: {
                keyInsights: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-5 key insights about spending patterns",
                },
                immediateActions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      action: { type: "string" },
                      impact: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    },
                    required: ["action", "impact", "difficulty"],
                  },
                  description: "3-4 specific actions to take this month",
                },
                projectedSavings: {
                  type: "object",
                  properties: {
                    monthly: { type: "number" },
                    annual: { type: "number" },
                    confidence: { type: "string", enum: ["low", "medium", "high"] },
                  },
                  required: ["monthly", "annual", "confidence"],
                },
              },
              required: ["keyInsights", "immediateActions", "projectedSavings"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_advice_plan" } },
    });

    const rawArgs = extractToolArguments(completion.choices[0]);
    if (!rawArgs) {
      return NextResponse.json({ error: "No valid advice generated" }, { status: 500 });
    }

    const parsed = AdvicePlan.safeParse(JSON.parse(rawArgs));
    if (!parsed.success) {
      console.error("Invalid advice plan:", parsed.error);
      return NextResponse.json({ error: "Invalid advice format" }, { status: 500 });
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error("AI advice error:", error);
    return NextResponse.json({ error: "Failed to generate advice" }, { status: 500 });
  }
}