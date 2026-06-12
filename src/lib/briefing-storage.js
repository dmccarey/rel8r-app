import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data", "briefings");
const THUMB_DIR = path.join(DATA_DIR, "thumbs");
const BRIEFING_PREFIX = "briefings/";

function storageMode() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  if (process.env.VERCEL) return "missing-blob";
  return "filesystem";
}

function briefingJsonPath(id) {
  return `${BRIEFING_PREFIX}${id}.json`;
}

function briefingThumbPath(id) {
  return `${BRIEFING_PREFIX}thumbs/${id}.png`;
}

function localJsonPath(id) {
  return path.join(DATA_DIR, `${id}.json`);
}

function localThumbPath(id) {
  return path.join(THUMB_DIR, `${id}.png`);
}

async function ensureFilesystemDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStream(stream) {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

function missingBlobError() {
  return new Error(
    "Persistent storage is not configured. Create a Vercel Blob store for this project (Storage → Blob) and redeploy so BLOB_READ_WRITE_TOKEN is available."
  );
}

async function saveBriefingJson(id, data) {
  const mode = storageMode();

  if (mode === "missing-blob") {
    throw missingBlobError();
  }

  if (mode === "blob") {
    const { put } = await import("@vercel/blob");
    await put(briefingJsonPath(id), JSON.stringify(data), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await ensureFilesystemDir();
  await fs.writeFile(localJsonPath(id), JSON.stringify(data), "utf8");
}

async function getBriefingJson(id) {
  const mode = storageMode();

  if (mode === "blob") {
    const { get } = await import("@vercel/blob");
    const result = await get(briefingJsonPath(id), { access: "private" });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    const text = await new Response(result.stream).text();
    return JSON.parse(text);
  }

  if (mode === "missing-blob") {
    return null;
  }

  try {
    const content = await fs.readFile(localJsonPath(id), "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function listBriefingJsonIds() {
  const mode = storageMode();

  if (mode === "blob") {
    const { list } = await import("@vercel/blob");
    const ids = new Set();
    let cursor;

    do {
      const page = await list({
        prefix: BRIEFING_PREFIX,
        cursor,
        limit: 1000,
      });

      for (const blob of page.blobs) {
        const name = blob.pathname.slice(BRIEFING_PREFIX.length);
        if (name.startsWith("thumbs/") || !name.endsWith(".json")) continue;
        ids.add(name.slice(0, -5));
      }

      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    return [...ids];
  }

  if (mode === "missing-blob") {
    return [];
  }

  try {
    await ensureFilesystemDir();
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.slice(0, -5));
  } catch {
    return [];
  }
}

async function hasBriefingThumbnailOnDisk(id) {
  const mode = storageMode();

  if (mode === "blob") {
    const { head } = await import("@vercel/blob");
    try {
      await head(briefingThumbPath(id), { access: "private" });
      return true;
    } catch {
      return false;
    }
  }

  if (mode === "missing-blob") {
    return false;
  }

  try {
    await fs.access(localThumbPath(id));
    return true;
  } catch {
    return false;
  }
}

async function saveBriefingThumbnail(id, buffer) {
  const mode = storageMode();

  if (mode === "missing-blob") {
    throw missingBlobError();
  }

  if (mode === "blob") {
    const { put } = await import("@vercel/blob");
    await put(briefingThumbPath(id), buffer, {
      access: "private",
      allowOverwrite: true,
      contentType: "image/png",
    });
    return;
  }

  await ensureFilesystemDir();
  await fs.mkdir(THUMB_DIR, { recursive: true });
  await fs.writeFile(localThumbPath(id), buffer);
}

async function getBriefingThumbnail(id) {
  const mode = storageMode();

  if (mode === "blob") {
    const { get } = await import("@vercel/blob");
    const result = await get(briefingThumbPath(id), { access: "private" });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return null;
    }

    return readStream(result.stream);
  }

  if (mode === "missing-blob") {
    return null;
  }

  try {
    return await fs.readFile(localThumbPath(id));
  } catch {
    return null;
  }
}

export {
  briefingJsonPath,
  briefingThumbPath,
  getBriefingJson,
  getBriefingThumbnail,
  hasBriefingThumbnailOnDisk,
  listBriefingJsonIds,
  localJsonPath,
  localThumbPath,
  saveBriefingJson,
  saveBriefingThumbnail,
  storageMode,
};
