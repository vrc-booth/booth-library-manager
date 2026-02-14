import { browser } from "wxt/browser";
import { type BoothItem, type DownloadFile, type LibrarySource } from "../types/booth.ts";

const LIBRARY_CACHE_KEY = "booth-library-cache";

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normalizeSource(value: unknown): LibrarySource | undefined {
  if (value === "library" || value === "gifts") {
    return value;
  }

  return undefined;
}

function normalizeDownloadFiles(value: unknown): DownloadFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  const files: DownloadFile[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const raw = entry as Record<string, unknown>;
    const url = normalizeText(raw.url);
    const name = normalizeText(raw.name) || "Download";

    if (url.length === 0 || unique.has(url)) {
      continue;
    }

    unique.add(url);
    files.push({ name, url });
  }

  return files;
}

function normalizeBoothItem(value: unknown): BoothItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const id = normalizeText(raw.id);
  const title = normalizeText(raw.title);
  const creator = normalizeText(raw.creator);
  const thumbnailUrl = normalizeText(raw.thumbnailUrl);
  const boothUrl = normalizeText(raw.boothUrl);
  const purchasedAt = normalizeText(raw.purchasedAt);
  const source = normalizeSource(raw.source);
  const downloadUrls = normalizeDownloadFiles(raw.downloadUrls);

  if (id.length === 0 || title.length === 0 || creator.length === 0 || boothUrl.length === 0) {
    return null;
  }

  return {
    id,
    title,
    creator,
    thumbnailUrl,
    boothUrl,
    downloadUrls,
    purchasedAt: purchasedAt.length > 0 ? purchasedAt : undefined,
    source,
  };
}

function dedupeItems(items: BoothItem[]): BoothItem[] {
  const unique = new Map<string, BoothItem>();

  for (const item of items) {
    const key = item.boothUrl || `${item.source ?? "library"}:${item.id}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }

  return Array.from(unique.values());
}

export async function getLibraryCache(): Promise<BoothItem[]> {
  const result = await browser.storage.local.get(LIBRARY_CACHE_KEY);
  const rawItems = result[LIBRARY_CACHE_KEY];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  const normalized: BoothItem[] = [];

  for (const rawItem of rawItems) {
    const item = normalizeBoothItem(rawItem);
    if (item) {
      normalized.push(item);
    }
  }

  return dedupeItems(normalized);
}

export async function saveLibraryCache(items: BoothItem[]): Promise<void> {
  const normalized = dedupeItems(items);
  await browser.storage.local.set({ [LIBRARY_CACHE_KEY]: normalized });
}
