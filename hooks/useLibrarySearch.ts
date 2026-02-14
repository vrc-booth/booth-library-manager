import { useMemo, useState } from "react";
import { type BoothItem, type FilterTab, type SourceTab } from "../types/booth.ts";

interface UseLibrarySearchOptions {
  items: BoothItem[];
  favorites: string[];
  hidden: string[];
}

export function useLibrarySearch({ items, favorites, hidden }: UseLibrarySearchOptions) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [activeSourceTab, setActiveSourceTab] = useState<SourceTab>("library");

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);
  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);

  const sourceItems = useMemo(() => {
    return items.filter((item) => (item.source ?? "library") === activeSourceTab);
  }, [activeSourceTab, items]);

  const filteredItems = useMemo(() => {
    let result = sourceItems;

    if (activeTab === "favorites") {
      result = result.filter((item) => favoriteSet.has(item.id));
    } else if (activeTab === "hidden") {
      result = result.filter((item) => hiddenSet.has(item.id));
    } else {
      result = result.filter((item) => !hiddenSet.has(item.id));
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return result;
    }

    return result.filter((item) => {
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.creator.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeTab, favoriteSet, hiddenSet, searchQuery, sourceItems]);

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

  const totalCount = sourceItems.length;

  const favoritesCount = useMemo(() => {
    return sourceItems.filter((item) => favoriteSet.has(item.id)).length;
  }, [favoriteSet, sourceItems]);

  const hiddenCount = useMemo(() => {
    return sourceItems.filter((item) => hiddenSet.has(item.id)).length;
  }, [hiddenSet, sourceItems]);

  return {
    searchQuery,
    setSearchQuery,
    activeSourceTab,
    setActiveSourceTab,
    activeTab,
    setActiveTab,
    filteredItems,
    totalCount,
    filteredCount: filteredItems.length,
    libraryCount: sourceCounts.libraryCount,
    giftsCount: sourceCounts.giftsCount,
    favoritesCount,
    hiddenCount,
  };
}
