import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { nanoid } from "nanoid";
import { briefingSchema } from "@/lib/schema";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { saveBriefing } from "@/lib/briefing-store";
import { enrichBranding } from "@/lib/branding";

export async function POST(request) {
  try {
    const { text, branding } = await request.json();

    if (!text?.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: briefingSchema,
      system: SYSTEM_PROMPT,
      prompt: `Transform the following unstructured notes into a stakeholder-ready briefing:\n\n${text}`,
    });

    const enrichedBranding = await enrichBranding(branding ?? {});
    const id = nanoid(10);
    const briefing = {
      ...object,
      sourceText: text.trim(),
      branding: enrichedBranding,
    };

    await saveBriefing(id, briefing);

    return Response.json({ id, ...briefing });
  } catch (error) {
    console.error("Generate error:", error);
    return Response.json(
      { error: "Failed to generate briefing. Please try again." },
      { status: 500 }
    );
  }
}
