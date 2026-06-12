import {
  getBriefingThumbnail,
  saveBriefingThumbnail,
} from "@/lib/briefing-store";

function dataUrlToBuffer(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  if (!base64) {
    throw new Error("Invalid image data");
  }
  return Buffer.from(base64, "base64");
}

export async function GET(_request, { params }) {
  const { id } = await params;
  const buffer = await getBriefingThumbnail(id);

  if (!buffer) {
    return Response.json({ error: "Thumbnail not found" }, { status: 404 });
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function POST(request, { params }) {
  const { id } = await params;

  try {
    const { dataUrl } = await request.json();

    if (!dataUrl?.startsWith("data:image/")) {
      return Response.json({ error: "Invalid image data" }, { status: 400 });
    }

    await saveBriefingThumbnail(id, dataUrlToBuffer(dataUrl));

    return Response.json({ ok: true, url: `/api/brief/${id}/thumbnail` });
  } catch (error) {
    console.error("Thumbnail save error:", error);
    return Response.json({ error: "Failed to save thumbnail" }, { status: 500 });
  }
}
