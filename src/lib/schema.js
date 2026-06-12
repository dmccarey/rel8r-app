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
