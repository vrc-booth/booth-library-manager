import { browser } from "wxt/browser";
import { type LibraryFolder, type UserPreferences } from "../types/booth.ts";
import { normalizeFolders } from "./folders.ts";

const STORAGE_KEY = "booth-library-preferences";

function cloneDefaultPreferences(): UserPreferences {
  return {
    favorites: [],
    hidden: [],
    tags: {},
    folders: [],
  };
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return Array.from(new Set(normalized));
}

function normalizeTags(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const tags: Record<string, string[]> = {};

  for (const [itemId, rawTags] of entries) {
    const normalizedItemId = itemId.trim();
    if (normalizedItemId.length === 0) {
      continue;
    }

    const normalizedTags = normalizeStringArray(rawTags);
    if (normalizedTags.length > 0) {
      tags[normalizedItemId] = normalizedTags;
    }
  }

  return tags;
}

function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== "object") {
    return cloneDefaultPreferences();
  }

  const raw = value as Record<string, unknown>;

  return {
    favorites: normalizeStringArray(raw.favorites),
    hidden: normalizeStringArray(raw.hidden),
    tags: normalizeTags(raw.tags),
    folders: normalizeFolders(raw.folders),
  };
}

async function storageGet<T>(key: string): Promise<T | undefined> {
  const result = await browser.storage.local.get(key);
  return result[key] as T | undefined;
}

async function storageSet<T>(key: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

function toggleItem(items: string[], itemId: string): string[] {
  if (items.includes(itemId)) {
    return items.filter((id) => id !== itemId);
  }
  return [...items, itemId];
}

function sanitizeItemId(itemId: string): string {
  return itemId.trim();
}

function sanitizeTag(tag: string): string {
  return tag.trim();
}

export async function getPreferences(): Promise<UserPreferences> {
  const stored = await storageGet<unknown>(STORAGE_KEY);
  if (stored === undefined) {
    return cloneDefaultPreferences();
  }
  return normalizePreferences(stored);
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  const normalized = normalizePreferences(prefs);
  await storageSet(STORAGE_KEY, normalized);
}

let pendingUpdate: Promise<unknown> = Promise.resolve();

/**
 * 읽기-수정-쓰기를 한 줄로 세워 실행한다. 빠르게 연달아 바꿔도 앞선 변경이 덮어써지지 않는다.
 */
function updatePreferences(update: (current: UserPreferences) => UserPreferences): Promise<UserPreferences> {
  const run = async () => {
    const current = await getPreferences();
    const updated = update(current);
    if (updated === current) {
      return current;
    }
    await savePreferences(updated);
    return normalizePreferences(updated);
  };

  const result = pendingUpdate.then(run, run);
  pendingUpdate = result.catch(() => undefined);
  return result;
}

export function updateFolders(transform: (folders: LibraryFolder[]) => LibraryFolder[]): Promise<UserPreferences> {
  return updatePreferences((current) => {
    const folders = transform(current.folders);
    return folders === current.folders ? current : { ...current, folders };
  });
}

export function toggleFavorite(itemId: string): Promise<UserPreferences> {
  const normalizedItemId = sanitizeItemId(itemId);

  return updatePreferences((current) => {
    if (normalizedItemId.length === 0) {
      return current;
    }
    return { ...current, favorites: toggleItem(current.favorites, normalizedItemId) };
  });
}

export function toggleHidden(itemId: string): Promise<UserPreferences> {
  const normalizedItemId = sanitizeItemId(itemId);

  return updatePreferences((current) => {
    if (normalizedItemId.length === 0) {
      return current;
    }
    return { ...current, hidden: toggleItem(current.hidden, normalizedItemId) };
  });
}

export async function addTag(itemId: string, tag: string): Promise<UserPreferences> {
  const normalizedItemId = sanitizeItemId(itemId);
  const normalizedTag = sanitizeTag(tag);
  const current = await getPreferences();

  if (normalizedItemId.length === 0 || normalizedTag.length === 0) {
    return current;
  }

  const existingTags = current.tags[normalizedItemId] ?? [];
  const updatedTags = Array.from(new Set([...existingTags, normalizedTag]));

  const updated: UserPreferences = {
    ...current,
    tags: {
      ...current.tags,
      [normalizedItemId]: updatedTags,
    },
  };

  await savePreferences(updated);
  return updated;
}

export async function removeTag(itemId: string, tag: string): Promise<UserPreferences> {
  const normalizedItemId = sanitizeItemId(itemId);
  const normalizedTag = sanitizeTag(tag);
  const current = await getPreferences();

  if (normalizedItemId.length === 0 || normalizedTag.length === 0) {
    return current;
  }

  const existingTags = current.tags[normalizedItemId] ?? [];
  const filteredTags = existingTags.filter((value) => value !== normalizedTag);
  const nextTags: Record<string, string[]> = { ...current.tags };

  if (filteredTags.length === 0) {
    delete nextTags[normalizedItemId];
  } else {
    nextTags[normalizedItemId] = filteredTags;
  }

  const updated: UserPreferences = {
    ...current,
    tags: nextTags,
  };

  await savePreferences(updated);
  return updated;
}

const PANEL_WIDTH_KEY = "booth-library-panel-width";

export async function getPanelWidth(): Promise<number | null> {
  const stored = await storageGet<unknown>(PANEL_WIDTH_KEY);
  return typeof stored === "number" && Number.isFinite(stored) ? stored : null;
}

export async function savePanelWidth(width: number): Promise<void> {
  await storageSet(PANEL_WIDTH_KEY, Math.round(width));
}
