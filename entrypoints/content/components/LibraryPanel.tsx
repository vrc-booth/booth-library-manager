import { useCallback, useEffect, useMemo, useState } from "react";
import type { BoothItem, FilterTab, LibraryFolder, SourceTab, SyncProgress } from "../../../types/booth.ts";
import type { FolderActions } from "../../../hooks/useUserPreferences.ts";
import {
  collectFolderItemIds,
  findFolder,
  getAllFolderItemIds,
  getDescendantFolderIds,
  getItemFolderIds,
} from "../../../utils/folders.ts";
import { requestDownloads } from "../../../utils/downloads.ts";
import { LibraryActionsContext, type LibraryActions } from "../libraryActions.ts";
import SearchBar from "./SearchBar.tsx";
import SourceTabs from "./SourceTabs.tsx";
import FilterTabs from "./FilterTabs.tsx";
import SyncButton from "./SyncButton.tsx";
import ItemGrid from "./ItemGrid.tsx";
import SkeletonCard from "./SkeletonCard.tsx";
import FolderBrowser from "./FolderBrowser.tsx";
import FolderPickerDialog from "./FolderPickerDialog.tsx";
import FolderDropTray from "./FolderDropTray.tsx";
import SelectionBar from "./SelectionBar.tsx";
import ConfirmDialog from "./ConfirmDialog.tsx";
import DownloadDialog from "./DownloadDialog.tsx";

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 720;
const TOAST_DURATION_MS = 3000;

function clampPanelWidth(width: number): number {
  return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));
}

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function collectDownloadUrls(items: BoothItem[]): string[] {
  const urls = items.flatMap((item) => item.downloadUrls.map((link) => link.url.trim()));
  return Array.from(new Set(urls.filter((url) => url.length > 0)));
}

type PickerTarget =
  | { kind: "item"; itemId: string }
  | { kind: "bulk"; itemIds: string[] };

interface DownloadTarget {
  title: string;
  itemIds: string[];
}

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "default" | "danger";
  onConfirm: () => void;
}

interface LibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: BoothItem[];
  allItems: BoothItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeSourceTab: SourceTab;
  onSourceTabChange: (tab: SourceTab) => void;
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  libraryCount: number;
  giftsCount: number;
  totalCount: number;
  filteredCount: number;
  favoritesCount: number;
  hiddenCount: number;
  customCount: number;
  syncProgress: SyncProgress;
  isSyncing: boolean;
  onSync: () => void;
  isFavorite: (itemId: string) => boolean;
  onToggleFavorite: (itemId: string) => void;
  onToggleHidden: (itemId: string) => void;
  folders: LibraryFolder[];
  folderActions: FolderActions;
  activeFolderId: string | null;
  onOpenFolder: (folderId: string | null) => void;
  error: Error | null;
  panelWidth: number;
  onPanelWidthChange: (width: number) => void;
}

export default function LibraryPanel({
  isOpen,
  onClose,
  items,
  allItems,
  searchQuery,
  onSearchChange,
  activeSourceTab,
  onSourceTabChange,
  activeTab,
  onTabChange,
  libraryCount,
  giftsCount,
  totalCount,
  filteredCount,
  favoritesCount,
  hiddenCount,
  customCount,
  syncProgress,
  isSyncing,
  onSync,
  isFavorite,
  onToggleFavorite,
  onToggleHidden,
  folders,
  folderActions,
  activeFolderId,
  onOpenFolder,
  error,
  panelWidth,
  onPanelWidthChange,
}: LibraryPanelProps) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [draggedItemIds, setDraggedItemIds] = useState<string[] | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [downloadTarget, setDownloadTarget] = useState<DownloadTarget | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isCustomTab = activeSourceTab === "custom";
  const isInsideFolder = isCustomTab && activeFolderId !== null;
  const activeFolder = findFolder(folders, activeFolderId);

  const itemsById = useMemo(() => {
    const map = new Map<string, BoothItem>();
    for (const item of allItems) {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [allItems]);

  const folderItemIdSet = useMemo(() => new Set(getAllFolderItemIds(folders)), [folders]);

  const getItems = useCallback((itemIds: string[]) => {
    return itemIds
      .map((itemId) => itemsById.get(itemId))
      .filter((item): item is BoothItem => item !== undefined);
  }, [itemsById]);

  // 탭이나 폴더를 바꾸면 보이지 않는 아이템이 선택된 채로 남지 않게 선택을 비운다.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, activeSourceTab, activeFolderId]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeoutId = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  const runFolderAction = useCallback(async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action();
      setToast(successMessage);
    } catch (caughtError) {
      setToast(`Failed: ${caughtError instanceof Error ? caughtError.message : "Unknown error"}`);
    }
  }, []);

  const startDownloads = useCallback(async (urls: string[]) => {
    try {
      const queued = await requestDownloads(urls);
      setToast(queued === 0 ? "No downloadable files" : `Downloading ${pluralize(queued, "file")}`);
    } catch (caughtError) {
      setToast(`Download failed: ${caughtError instanceof Error ? caughtError.message : "Unknown error"}`);
    }
  }, []);

  const openDownloadDialog = useCallback((itemId: string) => {
    const item = itemsById.get(itemId);
    if (item) {
      setDownloadTarget({ title: item.title, itemIds: [itemId] });
    }
  }, [itemsById]);

  const toggleSelected = useCallback((itemId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const startItemDrag = useCallback((itemId: string) => {
    const itemIds = selectedIds.has(itemId) ? Array.from(selectedIds) : [itemId];
    // dragstart 안에서 바로 화면을 바꾸면 Chrome이 드래그를 취소할 수 있어 다음 틱으로 미룬다.
    setTimeout(() => setDraggedItemIds(itemIds), 0);
  }, [selectedIds]);

  const endItemDrag = useCallback(() => {
    setTimeout(() => setDraggedItemIds(null), 0);
  }, []);

  const handleDropItems = useCallback((folderId: string) => {
    const itemIds = draggedItemIds;
    setDraggedItemIds(null);
    if (!itemIds || itemIds.length === 0) {
      return;
    }

    const folderName = findFolder(folders, folderId)?.name ?? "folder";
    const label = pluralize(itemIds.length, "item");

    if (isInsideFolder && activeFolderId !== null && activeFolderId !== folderId) {
      void runFolderAction(
        () => folderActions.moveItems(activeFolderId, folderId, itemIds),
        `Moved ${label} to ${folderName}`,
      );
      return;
    }

    void runFolderAction(() => folderActions.addItems(folderId, itemIds), `Added ${label} to ${folderName}`);
  }, [activeFolderId, draggedItemIds, folderActions, folders, isInsideFolder, runFolderAction]);

  const libraryActions = useMemo<LibraryActions>(() => ({
    isFavorite,
    toggleFavorite: onToggleFavorite,
    toggleHidden: onToggleHidden,
    isInAnyFolder: (itemId) => folderItemIdSet.has(itemId),
    openFolderPicker: (itemId) => setPickerTarget({ kind: "item", itemId }),
    openDownloadDialog,
    isSelectMode,
    isSelected: (itemId) => selectedIds.has(itemId),
    toggleSelected,
    startItemDrag,
    endItemDrag,
  }), [
    endItemDrag,
    folderItemIdSet,
    isFavorite,
    isSelectMode,
    onToggleFavorite,
    onToggleHidden,
    openDownloadDialog,
    selectedIds,
    startItemDrag,
    toggleSelected,
  ]);

  const selectedItemIds = Array.from(selectedIds);
  const selectedFileUrls = collectDownloadUrls(getItems(selectedItemIds));

  const activeFolderFileUrls = useMemo(() => {
    if (!activeFolderId) {
      return [];
    }
    return collectDownloadUrls(getItems(collectFolderItemIds(folders, activeFolderId, true)));
  }, [activeFolderId, folders, getItems]);

  const handleDownloadFolder = () => {
    if (!activeFolder) {
      return;
    }
    setDownloadTarget({
      title: `Download from "${activeFolder.name}" and its subfolders`,
      itemIds: collectFolderItemIds(folders, activeFolder.id, true),
    });
  };

  const handleDownloadSelected = () => {
    setDownloadTarget({
      title: `Download from ${pluralize(selectedItemIds.length, "selected item")}`,
      itemIds: selectedItemIds,
    });
  };

  const handleConfirmDownload = (urls: string[]) => {
    setDownloadTarget(null);
    void startDownloads(urls);
  };

  const handleRequestDeleteFolder = (folder: LibraryFolder) => {
    const descendantIds = getDescendantFolderIds(folders, folder.id);
    const subfolderCount = descendantIds.length - 1;

    setConfirmState({
      title: `Delete "${folder.name}"?`,
      message: `${subfolderCount > 0 ? `Its ${pluralize(subfolderCount, "subfolder")} will be deleted too. ` : ""}Items stay in your library.`,
      confirmLabel: "Delete",
      tone: "danger",
      onConfirm: () => {
        setConfirmState(null);
        if (activeFolderId !== null && descendantIds.includes(activeFolderId)) {
          onOpenFolder(folder.parentId);
        }
        void runFolderAction(() => folderActions.deleteFolder(folder.id), `Deleted ${folder.name}`);
      },
    });
  };

  const handleExitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleRemoveFromFolder = () => {
    if (!activeFolder || selectedItemIds.length === 0) {
      return;
    }
    const label = pluralize(selectedItemIds.length, "item");
    void runFolderAction(
      () => folderActions.removeItems(activeFolder.id, selectedItemIds),
      `Removed ${label} from ${activeFolder.name}`,
    );
    setSelectedIds(new Set());
  };

  const handlePickerSelect = (folderId: string) => {
    if (!pickerTarget) {
      return;
    }

    const folderName = findFolder(folders, folderId)?.name ?? "folder";

    if (pickerTarget.kind === "item") {
      const isMember = getItemFolderIds(folders, pickerTarget.itemId).includes(folderId);
      void runFolderAction(
        () => isMember
          ? folderActions.removeItems(folderId, [pickerTarget.itemId])
          : folderActions.addItems(folderId, [pickerTarget.itemId]),
        isMember ? `Removed from ${folderName}` : `Added to ${folderName}`,
      );
      return;
    }

    const { itemIds } = pickerTarget;
    setPickerTarget(null);
    void runFolderAction(
      () => folderActions.addItems(folderId, itemIds),
      `Added ${pluralize(itemIds.length, "item")} to ${folderName}`,
    );
  };

  const handlePickerCreate = (name: string, parentId: string | null) => {
    if (!pickerTarget) {
      return;
    }

    const target = pickerTarget;
    if (target.kind === "bulk") {
      setPickerTarget(null);
    }

    const itemIds = target.kind === "item" ? [target.itemId] : target.itemIds;
    void runFolderAction(async () => {
      const folderId = await folderActions.createFolder(name, parentId);
      await folderActions.addItems(folderId, itemIds);
    }, `Created ${name} and added ${pluralize(itemIds.length, "item")}`);
  };

  const handleResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const nextWidth = clampPanelWidth(startWidth + deltaX);
      onPanelWidthChange(nextWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const pickerItem = pickerTarget?.kind === "item" ? itemsById.get(pickerTarget.itemId) : undefined;
  const showItemGrid = !isCustomTab || activeFolderId !== null || searchQuery.trim().length > 0;

  const countRow = (
    <div className={`flex items-center justify-between shrink-0 ${isCustomTab ? "pb-2" : "px-4 py-2"}`}>
      <span className="text-xs text-gray-400">
        {filteredCount === totalCount
          ? pluralize(totalCount, "item")
          : `${filteredCount} of ${pluralize(totalCount, "item")}`}
      </span>
      {filteredCount > 0 && (
        <button
          onClick={isSelectMode ? handleExitSelectMode : () => setIsSelectMode(true)}
          className={`
            px-2 py-0.5 text-xs font-medium rounded-md transition-colors
            ${isSelectMode ? "bg-[#fc4d50] text-white" : "text-gray-500 hover:bg-gray-100"}
          `}
        >
          {isSelectMode ? "Selecting" : "Select"}
        </button>
      )}
    </div>
  );

  return (
    <LibraryActionsContext.Provider value={libraryActions}>
      {/* Backdrop */}
      <div
        className={`
          pointer-events-auto
          fixed inset-0 bg-black/30 z-[1100]
          transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          pointer-events-auto
          fixed top-0 right-0 h-full z-[1101]
          bg-white shadow-2xl
          transition-transform duration-300 ease-out
          flex flex-col
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
        style={{ width: clampPanelWidth(panelWidth) }}
      >
        <div
          className="absolute left-0 top-0 h-full w-2 -translate-x-1/2 cursor-col-resize"
          onMouseDown={handleResizeStart}
          title="Drag to resize"
        >
          <div className="mx-auto h-full w-0.5 bg-gray-200 hover:bg-[#fc4d50] transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">
            Booth Library
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 space-y-3 border-b border-gray-100 shrink-0">
          <SearchBar value={searchQuery} onChange={onSearchChange} />
          <SourceTabs
            activeSourceTab={activeSourceTab}
            onSourceTabChange={onSourceTabChange}
            libraryCount={libraryCount}
            giftsCount={giftsCount}
            customCount={customCount}
          />
          {/* Custom은 폴더로 보여주므로 All/Favorites/Hidden 필터가 해당하지 않는다. */}
          {!isCustomTab && (
            <FilterTabs
              activeTab={activeTab}
              onTabChange={onTabChange}
              totalCount={totalCount}
              favoritesCount={favoritesCount}
              hiddenCount={hiddenCount}
            />
          )}
          <SyncButton
            onSync={onSync}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
          />
        </div>

        {/* Item count + select toggle (Custom 탭에서는 폴더 목록 아래에 둔다) */}
        {!isCustomTab && totalCount > 0 && countRow}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto px-4 pb-4 ${isCustomTab ? "pt-3" : ""}`}>
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error.message || "An error occurred while syncing."}
            </div>
          )}

          {isCustomTab && (
            <FolderBrowser
              folders={folders}
              activeFolderId={activeFolderId}
              onOpenFolder={onOpenFolder}
              folderActions={folderActions}
              isDraggingItems={draggedItemIds !== null}
              onDropItems={handleDropItems}
              folderFileCount={activeFolderFileUrls.length}
              onDownloadFolder={handleDownloadFolder}
              onRequestDelete={handleRequestDeleteFolder}
            />
          )}

          {isCustomTab && showItemGrid && countRow}

          {isSyncing && totalCount === 0 && !isCustomTab ? (
            <SkeletonCard count={6} />
          ) : (
            showItemGrid && (
              isCustomTab ? (
                <ItemGrid
                  items={items}
                  emptyTitle={activeFolderId ? "This folder is empty" : "No matching items in folders"}
                  emptyDescription={activeFolderId ? "Drag items here, or use the folder button on a card." : "Try a different search."}
                />
              ) : (
                <ItemGrid items={items} />
              )
            )
          )}
        </div>

        {isSelectMode && (
          <SelectionBar
            selectedCount={selectedIds.size}
            visibleCount={items.length}
            fileCount={selectedFileUrls.length}
            canRemoveFromFolder={isInsideFolder}
            onSelectAll={() => setSelectedIds(new Set(items.map((item) => item.id)))}
            onClearSelection={() => setSelectedIds(new Set())}
            onAddToFolder={() => setPickerTarget({ kind: "bulk", itemIds: selectedItemIds })}
            onDownload={handleDownloadSelected}
            onRemoveFromFolder={handleRemoveFromFolder}
            onDone={handleExitSelectMode}
          />
        )}

        {draggedItemIds && (
          <FolderDropTray
            folders={folders}
            itemCount={draggedItemIds.length}
            isMove={isInsideFolder}
            sourceFolderId={isInsideFolder ? activeFolderId : null}
            onDrop={handleDropItems}
          />
        )}

        {toast && (
          <div className="absolute left-1/2 bottom-24 z-[60] -translate-x-1/2 max-w-[85%] px-3 py-2 rounded-lg bg-gray-900/90 text-xs text-white shadow-lg pointer-events-none">
            {toast}
          </div>
        )}

        {pickerTarget && (
          <FolderPickerDialog
            title={pickerTarget.kind === "item" ? "Add to folders" : `Add ${pluralize(pickerTarget.itemIds.length, "item")} to a folder`}
            description={pickerTarget.kind === "item" ? pickerItem?.title ?? "" : "Choose a folder. Items can be in several folders."}
            folders={folders}
            checkedFolderIds={pickerTarget.kind === "item" ? getItemFolderIds(folders, pickerTarget.itemId) : undefined}
            onSelectFolder={handlePickerSelect}
            onCreateFolder={handlePickerCreate}
            onClose={() => setPickerTarget(null)}
          />
        )}

        {downloadTarget && (
          <DownloadDialog
            title={downloadTarget.title}
            items={getItems(downloadTarget.itemIds)}
            onDownload={handleConfirmDownload}
            onClose={() => setDownloadTarget(null)}
          />
        )}

        {confirmState && (
          <ConfirmDialog
            title={confirmState.title}
            message={confirmState.message}
            confirmLabel={confirmState.confirmLabel}
            tone={confirmState.tone}
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState(null)}
          />
        )}
      </div>
    </LibraryActionsContext.Provider>
  );
}
