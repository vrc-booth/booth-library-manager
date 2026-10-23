import { parseLibraryPage } from "./parser.ts";
import { getParserRules, refreshParserRules } from "./remoteParserRules.ts";
import { type BoothItem, type LibraryPage, type LibrarySource, type SyncProgress } from "../types/booth.ts";

const LIBRARY_BASE_URL = "https://accounts.booth.pm/library";
const PAGE_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 400;

export interface FetchLibraryOptions {
  includeGifts?: boolean;
  onItemsUpdate?: (items: BoothItem[]) => void;
}

interface SyncTarget {
  source: LibrarySource;
  path: string;
}

const SYNC_TARGETS: ReadonlyArray<SyncTarget> = [
  { source: "library", path: "" },
  { source: "gifts", path: "/gifts" },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}

function isNotFoundPageError(error: unknown): boolean {
  return /\b404\b/.test(getErrorMessage(error));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchLibraryPage(page: number, path = ""): Promise<LibraryPage> {
  const url = `${LIBRARY_BASE_URL}${path}?page=${page}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error(`Failed to fetch library page ${page}: ${response.status}`);
  }

  const html = await response.text();
  let parsed = parseLibraryPage(html, await getParserRules());

  // 아이템이 하나도 안 잡히면 BOOTH 마크업이 바뀌었을 수 있으니 원격 규칙을 다시 받아 한 번 더 파싱한다.
  if (parsed.items.length === 0) {
    const refreshedRules = await refreshParserRules();
    if (refreshedRules) {
      parsed = parseLibraryPage(html, refreshedRules);
    }
  }

  return {
    ...parsed,
    currentPage: parsed.currentPage > 0 ? parsed.currentPage : page,
  };
}

function mergeUniqueItems(items: BoothItem[]): BoothItem[] {
  const uniqueByKey = new Map<string, BoothItem>();

  for (const item of items) {
    const dedupeKey = item.boothUrl || `${item.source ?? "library"}:${item.id}`;
    if (!uniqueByKey.has(dedupeKey)) {
      uniqueByKey.set(dedupeKey, item);
    }
  }

  return Array.from(uniqueByKey.values());
}

export async function fetchAllLibrary(
  onProgress?: (progress: SyncProgress) => void,
  options: FetchLibraryOptions = {},
): Promise<BoothItem[]> {
  const collectedItems: BoothItem[] = [];
  const targets = options.includeGifts === false
    ? SYNC_TARGETS.filter((target) => target.source === "library")
    : SYNC_TARGETS;

  try {
    for (const [targetIndex, target] of targets.entries()) {
      let latestPage = 0;

      const appendSourceItems = (items: BoothItem[]) => {
        if (items.length === 0) {
          return;
        }

        const sourceItems = items.map((item) => ({
          ...item,
          source: target.source,
        }));

        collectedItems.push(...sourceItems);
        options.onItemsUpdate?.(mergeUniqueItems(collectedItems));
      };

      onProgress?.({
        status: "syncing",
        currentPage: 1,
        itemsCollected: collectedItems.length,
        source: target.source,
      });

      const firstPage = await fetchLibraryPage(1, target.path);
      latestPage = 1;
      appendSourceItems(firstPage.items);

      let totalPages = firstPage.totalPages;
      let nextPage = 2;

      if (!firstPage.hasNextPage && typeof totalPages !== "number") {
        totalPages = 1;
      }

      const isSinglePage =
        (typeof totalPages === "number" && totalPages <= 1) ||
        (!firstPage.hasNextPage && typeof totalPages !== "number");

      if (isSinglePage) {
        onProgress?.({
          status: "syncing",
          currentPage: 1,
          totalPages: 1,
          itemsCollected: collectedItems.length,
          source: target.source,
        });

        if (targetIndex < targets.length - 1) {
          await delay(BATCH_DELAY_MS);
        }

        continue;
      }

      while (typeof totalPages !== "number" || nextPage <= totalPages) {
        const batchPages: number[] = [];
        for (let offset = 0; offset < PAGE_BATCH_SIZE; offset += 1) {
          const pageNumber = nextPage + offset;
          if (typeof totalPages === "number" && pageNumber > totalPages) {
            break;
          }
          batchPages.push(pageNumber);
        }

        const lastBatchPage = batchPages.at(-1);
        if (typeof lastBatchPage !== "number") {
          break;
        }

        const batchResults = await Promise.allSettled(
          batchPages.map(async (pageNumber) => ({
            pageNumber,
            page: await fetchLibraryPage(pageNumber, target.path),
          })),
        );

        let hasSuccessfulPage = false;

        for (const [index, result] of batchResults.entries()) {
          const pageNumber = batchPages[index];
          if (typeof pageNumber !== "number") {
            continue;
          }

          if (result.status === "rejected") {
            if (typeof totalPages !== "number" && pageNumber > 1 && isNotFoundPageError(result.reason)) {
              totalPages = pageNumber - 1;
              continue;
            }

            throw result.reason;
          }

          hasSuccessfulPage = true;
          const { page } = result.value;
          latestPage = pageNumber;

          if (typeof page.totalPages === "number") {
            totalPages = typeof totalPages === "number"
              ? Math.min(totalPages, page.totalPages)
              : page.totalPages;
          }

          appendSourceItems(page.items);

          onProgress?.({
            status: "syncing",
            currentPage: pageNumber,
            totalPages,
            itemsCollected: collectedItems.length,
            source: target.source,
          });
        }

        if (!hasSuccessfulPage) {
          break;
        }

        if (typeof totalPages !== "number") {
          const hasAnyNextPage = batchResults.some((result) => {
            return result.status === "fulfilled" && result.value.page.hasNextPage;
          });
          if (!hasAnyNextPage) {
            break;
          }
        }

        nextPage = lastBatchPage + 1;
        await delay(BATCH_DELAY_MS);
      }

      onProgress?.({
        status: "syncing",
        currentPage: latestPage,
        totalPages,
        itemsCollected: collectedItems.length,
        source: target.source,
      });

      if (targetIndex < targets.length - 1) {
        await delay(BATCH_DELAY_MS);
      }
    }

    const mergedItems = mergeUniqueItems(collectedItems);

    onProgress?.({
      status: "success",
      currentPage: 0,
      totalPages: 0,
      itemsCollected: mergedItems.length,
    });

    return mergedItems;
  } catch (error) {
    onProgress?.({
      status: "error",
      currentPage: 0,
      itemsCollected: collectedItems.length,
    });
    throw error;
  }
}
