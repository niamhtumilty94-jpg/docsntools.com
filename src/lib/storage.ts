// Tiny localStorage wrapper for recents + favorites.
// Safe to call on server (returns empty arrays).

const RECENTS_KEY = "th:recents";
const FAVORITES_KEY = "th:favorites";
const RECENTS_LIMIT = 8;

const isBrowser = () => typeof window !== "undefined";

function read(key: string): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, value: string[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("th:storage-change", { detail: { key } }));
  } catch {
    /* ignore quota */
  }
}

// Cached snapshots so useSyncExternalStore gets stable references between calls.
// Without this, returning a fresh array each call causes infinite re-renders.
const snapshots: Record<string, string[]> = {};
const EMPTY: string[] = [];

function getSnapshot(key: string): string[] {
  if (!isBrowser()) return EMPTY;
  const fresh = read(key);
  const cached = snapshots[key];
  if (
    cached &&
    cached.length === fresh.length &&
    cached.every((v, i) => v === fresh[i])
  ) {
    return cached;
  }
  snapshots[key] = fresh;
  return fresh;
}

export function getRecents(): string[] {
  return getSnapshot(RECENTS_KEY);
}

export function pushRecent(slug: string) {
  const current = read(RECENTS_KEY).filter((s) => s !== slug);
  current.unshift(slug);
  write(RECENTS_KEY, current.slice(0, RECENTS_LIMIT));
}

export function getFavorites(): string[] {
  return getSnapshot(FAVORITES_KEY);
}

export function isFavorite(slug: string): boolean {
  return read(FAVORITES_KEY).includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const current = read(FAVORITES_KEY);
  let next: string[];
  let added: boolean;
  if (current.includes(slug)) {
    next = current.filter((s) => s !== slug);
    added = false;
  } else {
    next = [slug, ...current];
    added = true;
  }
  write(FAVORITES_KEY, next);
  return added;
}

export function subscribeStorage(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => cb();
  window.addEventListener("th:storage-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("th:storage-change", handler);
    window.removeEventListener("storage", handler);
  };
}

// Stable empty array reference for useSyncExternalStore's getServerSnapshot.
// Returning a fresh `[]` from inline arrows breaks the snapshot equality check
// and triggers React's "infinite loop" warning + render thrash.
export const EMPTY_LIST: string[] = [];
export const getEmptyList = (): string[] => EMPTY_LIST;
