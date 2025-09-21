// lib/ai/advice.ts
import { z } from "zod";

export const AdviceAction = z.object({
  type: z.enum(["cancel","downgrade","negotiate","optimize","reminder"]),
  target: z.string(), // e.g., "Hulu"
  rationale: z.string(),
  estimatedMonthlySavings: z.number().nonnegative().default(0),
  steps: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.6)
});

export const AdvicePlan = z.object({
  summary: z.string(),
  quickWinsMonthly: z.number().nonnegative().default(0),
  projectedSavings3m: z.number().nonnegative().default(0),
  projectedSavings12m: z.number().nonnegative().default(0),
  actions: z.array(AdviceAction),
  notes: z.string().optional()
});

export type AdvicePlan = z.infer<typeof AdvicePlan>;
