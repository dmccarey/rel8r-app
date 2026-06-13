import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { presentationPlanSchema } from "@/lib/schema";
import { PLANNING_PROMPT, buildPlanPrompt } from "@/lib/prompt";

export async function POST(request) {
  try {
    const { text } = await request.json();

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
      schema: presentationPlanSchema,
      system: PLANNING_PROMPT,
      prompt: buildPlanPrompt(text.trim()),
    });

    return Response.json(object);
  } catch (error) {
    console.error("Plan error:", error);
    return Response.json(
      { error: "Failed to plan presentation. Please try again." },
      { status: 500 }
    );
  }
}
