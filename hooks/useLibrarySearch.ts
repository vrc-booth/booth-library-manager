import { useMemo, useState } from "react";
import { type BoothItem, type FilterTab, type LibraryFolder, type SourceTab } from "../types/booth.ts";
import { findFolder, getAllFolderItemIds } from "../utils/folders.ts";

interface UseLibrarySearchOptions {
  items: BoothItem[];
  favorites: string[];
  hidden: string[];
  folders: LibraryFolder[];
}

function matchesQuery(item: BoothItem, normalizedQuery: string): boolean {
  return (
    item.title.toLowerCase().includes(normalizedQuery) ||
    item.creator.toLowerCase().includes(normalizedQuery)
  );
}

export function useLibrarySearch({ items, favorites, hidden, folders }: UseLibrarySearchOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [activeSourceTab, setActiveSourceTab] = useState<SourceTab>("library");
  const [selectedFolderId, setActiveFolderId] = useState<string | null>(null);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);

  // 열어 둔 폴더가 지워졌으면 최상위로 돌아간다.
  const activeFolderId = findFolder(folders, selectedFolderId) ? selectedFolderId : null;

  const itemsById = useMemo(() => {
    const map = new Map<string, BoothItem>();
    for (const item of items) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [items]);

  const sourceItems = useMemo(() => {
    return items.filter((item) => (item.source ?? "library") === activeSourceTab);
  }, [activeSourceTab, items]);

  // Custom 탭은 Library/Gifts 구분 없이 폴더에 넣은 아이템을 보여준다.
  const customItems = useMemo(() => {
    const folder = findFolder(folders, activeFolderId);
    const hasQuery = searchQuery.trim().length > 0;
    const itemIds = folder
      ? folder.itemIds
      : hasQuery
        ? getAllFolderItemIds(folders)
        : [];

    return itemIds
      .map((itemId) => itemsById.get(itemId))
      .filter((item): item is BoothItem => item !== undefined);
  }, [activeFolderId, folders, itemsById, searchQuery]);

  const filteredItems = useMemo(() => {
    let result: BoothItem[];

    if (activeSourceTab === "custom") {
      result = customItems;
    } else if (activeTab === "favorites") {
      result = sourceItems.filter((item) => favoriteSet.has(item.id));
    } else if (activeTab === "hidden") {
      result = sourceItems.filter((item) => hiddenSet.has(item.id));
    } else {
      result = sourceItems.filter((item) => !hiddenSet.has(item.id));
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return result;
    }

    return result.filter((item) => matchesQuery(item, normalizedQuery));
  }, [activeSourceTab, activeTab, customItems, favoriteSet, hiddenSet, searchQuery, sourceItems]);

  const sourceCounts = useMemo(() => {
    let libraryCount = 0;
    let giftsCount = 0;

    for (const item of items) {
      if ((item.source ?? "library") === "gifts") {
        giftsCount += 1;
      } else {
        libraryCount += 1;
      }
    }

    return {
      libraryCount,
      giftsCount,
    };
  }, [items]);

  const totalCount = activeSourceTab === "custom" ? customItems.length : sourceItems.length;

  const favoritesCount = useMemo(() => {
    return sourceItems.filter((item) => favoriteSet.has(item.id)).length;
  }, [favoriteSet, sourceItems]);

  const hiddenCount = useMemo(() => {
    return sourceItems.filter((item) => hiddenSet.has(item.id)).length;
  }, [hiddenSet, sourceItems]);

  const customCount = useMemo(() => {
    return getAllFolderItemIds(folders).filter((itemId) => itemsById.has(itemId)).length;
  }, [folders, itemsById]);

  return {
    searchQuery,
    setSearchQuery,
    activeSourceTab,
    setActiveSourceTab,
    activeTab,
    setActiveTab,
    activeFolderId,
    setActiveFolderId,
    filteredItems,
    totalCount,
    filteredCount: filteredItems.length,
    libraryCount: sourceCounts.libraryCount,
    giftsCount: sourceCounts.giftsCount,
    favoritesCount,
    hiddenCount,
    customCount,
  };
}
