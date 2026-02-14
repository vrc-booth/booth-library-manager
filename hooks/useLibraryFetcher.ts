import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllLibrary, fetchLibraryPage, type FetchLibraryOptions } from "../utils/scraper.ts";
import { getLibraryCache, saveLibraryCache } from "../utils/libraryCache.ts";
import { type BoothItem, type SyncProgress } from "../types/booth.ts";

const LIBRARY_QUERY_KEY = ["booth-library"] as const;

const INITIAL_SYNC_PROGRESS: SyncProgress = {
  status: "idle",
  currentPage: 0,
  itemsCollected: 0,
};

const REFRESH_INTERVAL_MS = 60_000;

interface UseLibraryFetcherOptions {
  isPanelOpen?: boolean;
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    return /\b404\b/.test(error.message);
  }

  if (typeof error === "string") {
    return /\b404\b/.test(error);
  }

  return false;
}

function dedupeByKey(items: BoothItem[]): BoothItem[] {
  const unique = new Map<string, BoothItem>();

  for (const item of items) {
    const key = item.boothUrl || `${item.source ?? "library"}:${item.id}`;
    if (!unique.has(key)) {
      unique.set(key, item);
    }
  }

  return Array.from(unique.values());
}

function mergeWithLatestFirst(existingItems: BoothItem[], latestItems: BoothItem[]): BoothItem[] {
  return dedupeByKey([...latestItems, ...existingItems]);
}

export function useLibraryFetcher(options: UseLibraryFetcherOptions = {}) {
  const queryClient = useQueryClient();
  const [syncProgress, setSyncProgress] = useState<SyncProgress>(INITIAL_SYNC_PROGRESS);
  const [isCacheHydrated, setIsCacheHydrated] = useState(false);
  const hasAutoSyncedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  const { data: items = [] } = useQuery<BoothItem[]>({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: async () => queryClient.getQueryData<BoothItem[]>(LIBRARY_QUERY_KEY) ?? [],
    initialData: () => queryClient.getQueryData<BoothItem[]>(LIBRARY_QUERY_KEY) ?? [],
    staleTime: Number.POSITIVE_INFINITY,
  });

  const syncMutation = useMutation<
    { syncedItems: BoothItem[]; latestProgress: SyncProgress },
    Error,
    FetchLibraryOptions | undefined
  >({
    mutationFn: async (options?: FetchLibraryOptions) => {
      queryClient.setQueryData(LIBRARY_QUERY_KEY, []);

      let latestProgress: SyncProgress = {
        status: "syncing",
        currentPage: 1,
        itemsCollected: 0,
      };

      setSyncProgress(latestProgress);

      const syncedItems = await fetchAllLibrary(
        (progress) => {
          latestProgress = progress;
          setSyncProgress(progress);
        },
        {
          ...options,
          onItemsUpdate: (nextItems) => {
            queryClient.setQueryData(LIBRARY_QUERY_KEY, nextItems);
          },
        },
      );

      return { syncedItems, latestProgress };
    },
    onSuccess: ({ syncedItems, latestProgress }) => {
      queryClient.setQueryData(LIBRARY_QUERY_KEY, syncedItems);
      void saveLibraryCache(syncedItems);
      setSyncProgress({
        status: "success",
        currentPage: latestProgress.currentPage,
        totalPages: latestProgress.totalPages ?? latestProgress.currentPage,
        itemsCollected: syncedItems.length,
      });
    },
    onError: () => {
      setSyncProgress((prev) => ({ ...prev, status: "error" }));
    },
  });

  const sync = useCallback((options?: FetchLibraryOptions) => {
    if (syncMutation.isPending) {
      return;
    }
    syncMutation.mutate(options);
  }, [syncMutation]);

  const refreshFirstPage = useCallback(async () => {
    if (syncMutation.isPending || isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    try {
      const [libraryResult, giftsResult] = await Promise.allSettled([
        fetchLibraryPage(1, ""),
        fetchLibraryPage(1, "/gifts"),
      ]);

      const latestItems: BoothItem[] = [];

      if (libraryResult.status === "fulfilled") {
        latestItems.push(...libraryResult.value.items.map((item) => ({ ...item, source: "library" as const })));
      }

      if (giftsResult.status === "fulfilled") {
        latestItems.push(...giftsResult.value.items.map((item) => ({ ...item, source: "gifts" as const })));
      } else if (!isNotFoundError(giftsResult.reason)) {
        throw giftsResult.reason;
      }

      if (latestItems.length === 0) {
        return;
      }

      const existingItems = queryClient.getQueryData<BoothItem[]>(LIBRARY_QUERY_KEY) ?? [];
      const mergedItems = mergeWithLatestFirst(existingItems, latestItems);

      queryClient.setQueryData(LIBRARY_QUERY_KEY, mergedItems);
      await saveLibraryCache(mergedItems);

      setSyncProgress((prev) => {
        if (prev.status === "syncing") {
          return prev;
        }

        return {
          status: "success",
          currentPage: 1,
          totalPages: prev.totalPages,
          itemsCollected: mergedItems.length,
        };
      });
    } finally {
      isRefreshingRef.current = false;
    }
  }, [queryClient, syncMutation.isPending]);

  useEffect(() => {
    let cancelled = false;

    const hydrateFromStorage = async () => {
      try {
        const cachedItems = await getLibraryCache();
        if (cancelled) {
          return;
        }

        queryClient.setQueryData(LIBRARY_QUERY_KEY, cachedItems);
      } finally {
        if (!cancelled) {
          setIsCacheHydrated(true);
        }
      }
    };

    void hydrateFromStorage();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  useEffect(() => {
    if (!isCacheHydrated || hasAutoSyncedRef.current || syncMutation.isPending) {
      return;
    }

    const cachedItems = queryClient.getQueryData<BoothItem[]>(LIBRARY_QUERY_KEY) ?? [];
    if (cachedItems.length > 0) {
      return;
    }

    hasAutoSyncedRef.current = true;
    syncMutation.mutate({ includeGifts: true });
  }, [isCacheHydrated, queryClient, syncMutation]);

  useEffect(() => {
    if (!isCacheHydrated) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshFirstPage();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isCacheHydrated, refreshFirstPage]);

  useEffect(() => {
    if (!isCacheHydrated || !options.isPanelOpen) {
      return;
    }

    void refreshFirstPage();
  }, [isCacheHydrated, options.isPanelOpen, refreshFirstPage]);

  return {
    items,
    syncProgress,
    isSyncing: syncMutation.isPending,
    sync,
    error: syncMutation.error,
  };
}
