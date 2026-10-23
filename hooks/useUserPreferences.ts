import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addTag,
  getPreferences,
  removeTag,
  toggleFavorite,
  toggleHidden,
  updateFolders,
} from "../utils/storage.ts";
import {
  addItemsToFolder,
  createFolder,
  deleteFolder,
  moveFolder,
  moveItemsToFolder,
  removeItemsFromFolder,
  renameFolder,
} from "../utils/folders.ts";
import { type LibraryFolder, type UserPreferences } from "../types/booth.ts";

const DEFAULT_PREFERENCES: UserPreferences = {
  favorites: [],
  hidden: [],
  tags: {},
  folders: [],
};

export interface FolderActions {
  createFolder: (name: string, parentId: string | null) => Promise<string>;
  renameFolder: (folderId: string, name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  moveFolder: (folderId: string, newParentId: string | null) => Promise<void>;
  addItems: (folderId: string, itemIds: string[]) => Promise<void>;
  removeItems: (folderId: string, itemIds: string[]) => Promise<void>;
  moveItems: (fromFolderId: string, toFolderId: string, itemIds: string[]) => Promise<void>;
}

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

  const applyFolderUpdate = useCallback(async (transform: (folders: LibraryFolder[]) => LibraryFolder[]) => {
    try {
      const updated = await updateFolders(transform);
      setPreferences(updated);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError : new Error("Failed to update folders"));
      throw caughtError;
    }
  }, []);

  const folderActions = useMemo<FolderActions>(() => ({
    createFolder: async (name, parentId) => {
      const folderId = crypto.randomUUID();
      await applyFolderUpdate((folders) => createFolder(folders, name, parentId, folderId));
      return folderId;
    },
    renameFolder: (folderId, name) => applyFolderUpdate((folders) => renameFolder(folders, folderId, name)),
    deleteFolder: (folderId) => applyFolderUpdate((folders) => deleteFolder(folders, folderId)),
    moveFolder: (folderId, newParentId) => applyFolderUpdate((folders) => moveFolder(folders, folderId, newParentId)),
    addItems: (folderId, itemIds) => applyFolderUpdate((folders) => addItemsToFolder(folders, folderId, itemIds)),
    removeItems: (folderId, itemIds) => applyFolderUpdate((folders) => removeItemsFromFolder(folders, folderId, itemIds)),
    moveItems: (fromFolderId, toFolderId, itemIds) => {
      return applyFolderUpdate((folders) => moveItemsToFolder(folders, fromFolderId, toFolderId, itemIds));
    },
  }), [applyFolderUpdate]);

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
    folderActions,
    isFavorite,
    isHidden,
    getItemTags,
  };
}
