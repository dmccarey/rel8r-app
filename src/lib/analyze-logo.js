import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 6-digit hex color");

const logoAnalysisSchema = z.object({
  heightPx: z
    .number()
    .min(18)
    .max(48)
    .describe(
      "Smallest height in pixels that keeps the logo clearly readable in a compact header"
    ),
  maxWidthPx: z
    .number()
    .min(56)
    .max(200)
    .describe(
      "Smallest max width that keeps the logo readable; minimize unless wordmark requires more"
    ),
  accent: hexColor.describe(
    "Primary brand accent color extracted from the logo for card highlights"
  ),
  border: hexColor.describe(
    "Soft border color that complements the logo for card outlines"
  ),
  surface: hexColor.describe(
    "Very light background tint for icon areas and subtle fills"
  ),
  pager: hexColor.describe(
    "Active pagination dot color from the logo; vivid, works on light gray backgrounds"
  ),
});

const DEFAULT_ANALYSIS = {
  heightPx: 24,
  maxWidthPx: 96,
  accent: "#6366f1",
  border: "#c7d2fe",
  surface: "#eef2ff",
  pager: "#6366f1",
};

export async function analyzeLogo(logoUrl) {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: logoAnalysisSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this organization logo for a professional briefing app header and card theme.

## Logo sizing (heightPx, maxWidthPx)
Choose the **smallest** dimensions that remain clearly readable in a compact header on white background.

Rules:
- Default to the lower end of the acceptable range — minimize visual footprint
- Only increase size if text, fine detail, or thin strokes would become illegible smaller
- Simple icons and bold marks: prefer 18–28px height
- Wordmarks with text: use the minimum height where text is still readable (typically 24–36px)
- maxWidthPx: use the narrowest width that doesn't clip or compress the logo; wide wordmarks may need more width but still keep it as tight as possible
- When uncertain between two sizes, always choose the smaller one

## Card theme colors
- accent: primary brand color (vivid enough for icons, labels, bullet dots on white)
- border: soft harmonious border color for cards
- surface: very subtle tinted background for icon badges
- pager: active dot/pager indicator color from the logo; must stand out on #d1d5db inactive dots and light page background

Ensure accessible contrast on white backgrounds. Colors should clearly derive from the logo.`,
          },
          { type: "image", image: logoUrl },
        ],
      },
    ],
  });

  return object;
}

export async function analyzeLogoSafe(logoUrl) {
  try {
    return await analyzeLogo(logoUrl);
  } catch (error) {
    console.error("Logo analysis error:", error);
    return DEFAULT_ANALYSIS;
  }
}
