import { createContext, useContext } from "react";

export interface LibraryActions {
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (itemId: string) => void;
  toggleHidden: (itemId: string) => void;
  isInAnyFolder: (itemId: string) => boolean;
  openFolderPicker: (itemId: string) => void;
  openDownloadDialog: (itemId: string) => void;
  isSelectMode: boolean;
  isSelected: (itemId: string) => boolean;
  toggleSelected: (itemId: string) => void;
  startItemDrag: (itemId: string) => void;
  endItemDrag: () => void;
}

export const LibraryActionsContext = createContext<LibraryActions | null>(null);

export function useLibraryActions(): LibraryActions {
  const actions = useContext(LibraryActionsContext);
  if (!actions) {
    throw new Error("useLibraryActions must be used inside LibraryActionsContext.Provider");
  }
  return actions;
}
