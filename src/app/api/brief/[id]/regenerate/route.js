import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { briefingSchema } from "@/lib/schema";
import { SYSTEM_PROMPT, buildRegeneratePrompt } from "@/lib/prompt";
import { getBriefing, saveBriefing } from "@/lib/briefing-store";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const existing = await getBriefing(id);

    if (!existing) {
      return Response.json({ error: "Briefing not found" }, { status: 404 });
    }

    const { edits } = await request.json();

    if (!edits?.trim()) {
      return Response.json({ error: "Edits are required" }, { status: 400 });
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
      prompt: buildRegeneratePrompt(existing, edits.trim()),
    });

    const updated = {
      ...object,
      sourceText: existing.sourceText ?? null,
      branding: existing.branding ?? null,
      updatedAt: Date.now(),
    };

    await saveBriefing(id, updated);

    return Response.json({ id, ...updated });
  } catch (error) {
    console.error("Regenerate error:", error);
    return Response.json(
      { error: "Failed to regenerate briefing. Please try again." },
      { status: 500 }
    );
  }
}
