import { getBriefing, saveBriefing } from "@/lib/briefing-store";

export async function GET(_request, { params }) {
  const { id } = await params;
  const briefing = await getBriefing(id);

  if (!briefing) {
    return Response.json({ error: "Briefing not found" }, { status: 404 });
  }

  return Response.json(briefing);
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const existing = await getBriefing(id);

    if (!existing) {
      return Response.json({ error: "Briefing not found" }, { status: 404 });
    }

    const body = await request.json();

    const updated = {
      ...existing,
      title: body.title ?? existing.title,
      cards: body.cards ?? existing.cards,
      branding: body.branding !== undefined ? body.branding : existing.branding,
      updatedAt: Date.now(),
    };

    await saveBriefing(id, updated);

    return Response.json({ id, ...updated });
  } catch (error) {
    console.error("Briefing update error:", error);
    return Response.json(
      { error: "Failed to save briefing." },
      { status: 500 }
    );
  }
}
