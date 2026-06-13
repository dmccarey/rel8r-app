const PREFIX = "slidz:brief:";
const INDEX_KEY = "slidz:briefing-index";
const MAX_INDEX = 24;

function summarizeBriefing(id, briefing) {
  return {
    id,
    title: briefing.title ?? "Untitled briefing",
    createdAt: briefing.createdAt ?? Date.now(),
    cardCount: briefing.cards?.length ?? 0,
    branding: briefing.branding ?? null,
    thumbnailUrl: briefing.thumbnailUrl ?? null,
  };
}

export function updateBriefingThumbnail(id, thumbnailUrl) {
  const entries = readIndex();
  const index = entries.findIndex((item) => item.id === id);
  if (index === -1) return;

  entries[index] = { ...entries[index], thumbnailUrl };
  writeIndex(entries);
}

function readIndex() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries.slice(0, MAX_INDEX)));
  } catch {
    // Storage full or unavailable
  }
}

export function upsertBriefingIndex(id, briefing) {
  const entry = summarizeBriefing(id, briefing);
  const next = [entry, ...readIndex().filter((item) => item.id !== id)].slice(
    0,
    MAX_INDEX
  );
  writeIndex(next);
}

export function listRecentBriefings() {
  return readIndex().sort((a, b) => b.createdAt - a.createdAt);
}

export function cacheBriefing(id, briefing) {
  const data = { ...briefing, createdAt: briefing.createdAt ?? Date.now() };

  try {
    sessionStorage.setItem(`${PREFIX}${id}`, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — API fallback still works
  }

  upsertBriefingIndex(id, data);
}

export function getCachedBriefing(id) {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
