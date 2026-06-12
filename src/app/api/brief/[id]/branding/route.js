import { getBriefing, saveBriefing } from "@/lib/briefing-store";
import { enrichBranding } from "@/lib/branding";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const existing = await getBriefing(id);

    if (!existing) {
      return Response.json({ error: "Briefing not found" }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { branding } = await request.json();
    const enriched = await enrichBranding(branding, {
      previousBranding: existing.branding,
    });

    const updated = {
      ...existing,
      branding: enriched,
      updatedAt: Date.now(),
    };

    await saveBriefing(id, updated);

    return Response.json({ id, ...updated });
  } catch (error) {
    console.error("Branding update error:", error);
    return Response.json(
      { error: "Failed to update branding" },
      { status: 500 }
    );
  }
}
