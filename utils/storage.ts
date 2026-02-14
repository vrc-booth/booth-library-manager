import { browser } from "wxt/browser";
import { type UserPreferences } from "../types/booth.ts";

const STORAGE_KEY = "booth-library-preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  hidden: [],
  tags: {},
};

function cloneDefaultPreferences(): UserPreferences {
  return {
    favorites: [],
    hidden: [],
    tags: {},
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
    return { ...DEFAULT_PREFERENCES, tags: {} };
  }
  return normalizePreferences(stored);
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  const normalized = normalizePreferences(prefs);
  await storageSet(STORAGE_KEY, normalized);
}

export async function toggleFavorite(itemId: string): Promise<UserPreferences> {
  const normalizedItemId = sanitizeItemId(itemId);
  const current = await getPreferences();

  if (normalizedItemId.length === 0) {
    return current;
  }

  const updated: UserPreferences = {
    ...current,
    favorites: toggleItem(current.favorites, normalizedItemId),
  };

  await savePreferences(updated);
  return updated;
}

export async function toggleHidden(itemId: string): Promise<UserPreferences> {
  const normalizedItemId = sanitizeItemId(itemId);
  const current = await getPreferences();

  if (normalizedItemId.length === 0) {
    return current;
  }

  const updated: UserPreferences = {
    ...current,
    hidden: toggleItem(current.hidden, normalizedItemId),
  };

  await savePreferences(updated);
  return updated;
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
