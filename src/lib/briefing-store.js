import {
  getBriefingJson,
  getBriefingThumbnail as readBriefingThumbnail,
  hasBriefingThumbnailOnDisk,
  listBriefingJsonIds,
  localJsonPath,
  localThumbPath,
  saveBriefingJson,
  saveBriefingThumbnail as persistBriefingThumbnail,
} from "./briefing-storage";

const globalForBriefings = globalThis;
if (!globalForBriefings.__briefingStore) {
  globalForBriefings.__briefingStore = new Map();
}
const memoryStore = globalForBriefings.__briefingStore;

export async function saveBriefing(id, briefing) {
  const data = {
    ...briefing,
    createdAt: briefing.createdAt ?? Date.now(),
  };
  memoryStore.set(id, data);
  await saveBriefingJson(id, data);
}

export async function getBriefing(id) {
  if (memoryStore.has(id)) {
    return memoryStore.get(id);
  }

  const data = await getBriefingJson(id);
  if (data) {
    memoryStore.set(id, data);
  }
  return data;
}

function summarizeBriefing(id, briefing) {
  return {
    id,
    title: briefing.title ?? "Untitled briefing",
    createdAt: briefing.createdAt ?? 0,
    cardCount: briefing.cards?.length ?? 0,
    branding: briefing.branding ?? null,
    thumbnailUrl: hasBriefingThumbnail(id)
      ? `/api/brief/${id}/thumbnail`
      : null,
  };
}

export function briefingThumbnailPath(id) {
  return localThumbPath(id);
}

export function hasBriefingThumbnail(id) {
  return memoryStore.get(`thumb:${id}`) === true;
}

async function markThumbnailExists(id) {
  memoryStore.set(`thumb:${id}`, true);
}

export async function saveBriefingThumbnail(id, buffer) {
  await persistBriefingThumbnail(id, buffer);
  await markThumbnailExists(id);
}

export async function getBriefingThumbnail(id) {
  return readBriefingThumbnail(id);
}

export async function listBriefings() {
  const seen = new Set();
  const results = [];

  for (const [id, data] of memoryStore.entries()) {
    if (id.startsWith("thumb:")) continue;
    seen.add(id);
    if (await hasBriefingThumbnailOnDisk(id)) {
      await markThumbnailExists(id);
    }
    results.push(summarizeBriefing(id, data));
  }

  for (const id of await listBriefingJsonIds()) {
    if (seen.has(id)) continue;

    const data = await getBriefingJson(id);
    if (!data) continue;

    memoryStore.set(id, data);
    if (await hasBriefingThumbnailOnDisk(id)) {
      await markThumbnailExists(id);
    }
    results.push(summarizeBriefing(id, data));
  }

  return results.sort((a, b) => b.createdAt - a.createdAt);
}

export { localJsonPath };
