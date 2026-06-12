import { toPng } from "html-to-image";

export async function captureElementAsPng(node) {
  if (!node) return null;

  try {
    return await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
    });
  } catch (error) {
    console.warn("Thumbnail capture failed:", error);
    return null;
  }
}

export async function uploadBriefingThumbnail(id, dataUrl) {
  const res = await fetch(`/api/brief/${id}/thumbnail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl }),
  });

  if (!res.ok) {
    throw new Error("Failed to save thumbnail");
  }

  return `/api/brief/${id}/thumbnail`;
}

export function briefingThumbnailUrl(id) {
  return `/api/brief/${id}/thumbnail`;
}
