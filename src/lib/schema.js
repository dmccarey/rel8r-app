import { z } from "zod";

export const CARD_TYPES = [
  "status",
  "progress",
  "key_insight",
  "decision_required",
  "risk",
  "action_item",
  "next_steps",
  "recommendation",
];

export const cardSchema = z.object({
  type: z.enum(CARD_TYPES),
  title: z.string().describe("Short, scannable headline (3-8 words)"),
  bullets: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("1-3 concise bullet points. Each bullet is one short phrase or sentence."),
  priority: z
    .enum(["low", "medium", "high"])
    .nullable()
    .describe("Priority level, or null if not applicable"),
  impact: z
    .enum(["low", "medium", "high"])
    .nullable()
    .describe("Impact level, or null if not applicable"),
  status: z
    .string()
    .nullable()
    .describe("Status label, or null if not applicable"),
});

export const briefingSchema = z.object({
  title: z
    .string()
    .describe("Brief overall title for the briefing (4-10 words)"),
  cards: z
    .array(cardSchema)
    .min(4)
    .max(10)
    .describe("Between 4 and 10 high-quality briefing cards"),
});

export const slidePlanItemSchema = z.object({
  title: z.string().describe("Short slide title (3-8 words)"),
  type: z.enum(CARD_TYPES).describe("Best matching slide/card type"),
  purpose: z
    .string()
    .describe("Why this slide belongs in the presentation flow"),
  keyPoints: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("1-3 important points this slide should cover"),
});

export const presentationPlanSchema = z.object({
  summaryMessage: z
    .string()
    .describe(
      "Conversational response confirming the agent's understanding and whether the notes are sufficient"
    ),
  hasEnoughInfo: z
    .boolean()
    .describe("Whether there is enough information to generate a useful presentation"),
  inferredGoal: z
    .string()
    .describe("The point the presentation appears intended to make"),
  targetAudience: z
    .string()
    .nullable()
    .describe("Likely audience, or null if unclear"),
  recommendedTitle: z
    .string()
    .describe("Suggested overall presentation title (4-10 words)"),
  assumptions: z
    .array(z.string())
    .max(4)
    .describe("Important assumptions made from incomplete notes"),
  missingInfoQuestions: z
    .array(z.string())
    .max(4)
    .describe("Questions that would improve the presentation, if any"),
  slides: z
    .array(slidePlanItemSchema)
    .min(4)
    .max(10)
    .describe("Logical slide outline for the presentation"),
});
