import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data", "briefings");
const THUMB_DIR = path.join(DATA_DIR, "thumbs");

const globalForBriefings = globalThis;
if (!globalForBriefings.__briefingStore) {
  globalForBriefings.__briefingStore = new Map();
}
const memoryStore = globalForBriefings.__briefingStore;

function filePath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveBriefing(id, briefing) {
  const data = {
    ...briefing,
    createdAt: briefing.createdAt ?? Date.now(),
  };
  memoryStore.set(id, data);

  await ensureDir();
  await fs.writeFile(filePath(id), JSON.stringify(data), "utf8");
}

export async function getBriefing(id) {
  if (memoryStore.has(id)) {
    return memoryStore.get(id);
  }

  try {
    const content = await fs.readFile(filePath(id), "utf8");
    const data = JSON.parse(content);
    memoryStore.set(id, data);
    return data;
  } catch {
    return null;
  }
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
  return path.join(THUMB_DIR, `${id}.png`);
}

export function hasBriefingThumbnail(id) {
  return memoryStore.get(`thumb:${id}`) === true;
}

async function markThumbnailExists(id) {
  memoryStore.set(`thumb:${id}`, true);
}

export async function saveBriefingThumbnail(id, buffer) {
  await ensureDir();
  await fs.mkdir(THUMB_DIR, { recursive: true });
  await fs.writeFile(briefingThumbnailPath(id), buffer);
  await markThumbnailExists(id);
}

export async function getBriefingThumbnail(id) {
  try {
    return await fs.readFile(briefingThumbnailPath(id));
  } catch {
    return null;
  }
}

async function checkThumbnailOnDisk(id) {
  try {
    await fs.access(briefingThumbnailPath(id));
    await markThumbnailExists(id);
    return true;
  } catch {
    return false;
  }
}

export async function listBriefings() {
  const seen = new Set();
  const results = [];

  for (const [id, data] of memoryStore.entries()) {
    if (id.startsWith("thumb:")) continue;
    seen.add(id);
    await checkThumbnailOnDisk(id);
    results.push(summarizeBriefing(id, data));
  }

  try {
    await ensureDir();
    const files = await fs.readdir(DATA_DIR);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const id = file.slice(0, -5);
      if (seen.has(id)) continue;

      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), "utf8");
        const data = JSON.parse(content);
        memoryStore.set(id, data);
        await checkThumbnailOnDisk(id);
        results.push(summarizeBriefing(id, data));
      } catch {
        // Skip unreadable briefing files
      }
    }
  } catch {
    // Data directory may not exist yet
  }

  return results.sort((a, b) => b.createdAt - a.createdAt);
}
