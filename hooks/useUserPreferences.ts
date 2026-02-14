import { useCallback, useEffect, useState } from "react";
import {
  addTag,
  getPreferences,
  removeTag,
  toggleFavorite,
  toggleHidden,
} from "../utils/storage.ts";
import { type UserPreferences } from "../types/booth.ts";

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  hidden: [],
  tags: {},
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      try {
        const prefs = await getPreferences();
        if (cancelled) {
          return;
        }
        setPreferences(prefs);
      } catch (caughtError) {
        if (cancelled) {
          return;
        }
        setError(caughtError instanceof Error ? caughtError : new Error("Failed to load preferences"));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleFavorite = useCallback(async (itemId: string) => {
    const updated = await toggleFavorite(itemId);
    setPreferences(updated);
    setError(null);
  }, []);

  const handleToggleHidden = useCallback(async (itemId: string) => {
    const updated = await toggleHidden(itemId);
    setPreferences(updated);
    setError(null);
  }, []);

  const handleAddTag = useCallback(async (itemId: string, tag: string) => {
    const updated = await addTag(itemId, tag);
    setPreferences(updated);
    setError(null);
  }, []);

  const handleRemoveTag = useCallback(async (itemId: string, tag: string) => {
    const updated = await removeTag(itemId, tag);
    setPreferences(updated);
    setError(null);
  }, []);

  const isFavorite = useCallback(
    (itemId: string) => preferences.favorites.includes(itemId),
    [preferences.favorites],
  );

  const isHidden = useCallback(
    (itemId: string) => preferences.hidden.includes(itemId),
    [preferences.hidden],
  );

  const getItemTags = useCallback(
    (itemId: string) => preferences.tags[itemId] ?? [],
    [preferences.tags],
  );

  return {
    preferences,
    isLoading,
    error,
    toggleFavorite: handleToggleFavorite,
    toggleHidden: handleToggleHidden,
    addTag: handleAddTag,
    removeTag: handleRemoveTag,
    isFavorite,
    isHidden,
    getItemTags,
  };
}
