import type { BoothItem, FilterTab, SourceTab, SyncProgress } from "../../../types/booth.ts";
import SearchBar from "./SearchBar.tsx";
import SourceTabs from "./SourceTabs.tsx";
import FilterTabs from "./FilterTabs.tsx";
import SyncButton from "./SyncButton.tsx";
import ItemGrid from "./ItemGrid.tsx";
import SkeletonCard from "./SkeletonCard.tsx";

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 720;

function clampPanelWidth(width: number): number {
  return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));
}

interface LibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: BoothItem[];
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
  syncProgress: SyncProgress;
  isSyncing: boolean;
  onSync: () => void;
  isFavorite: (itemId: string) => boolean;
  onToggleFavorite: (itemId: string) => void;
  onToggleHidden: (itemId: string) => void;
  error: Error | null;
  panelWidth: number;
  onPanelWidthChange: (width: number) => void;
}

export default function LibraryPanel({
  isOpen,
  onClose,
  items,
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
  syncProgress,
  isSyncing,
  onSync,
  isFavorite,
  onToggleFavorite,
  onToggleHidden,
  error,
  panelWidth,
  onPanelWidthChange,
}: LibraryPanelProps) {
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

  return (
    <>
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
          />
          <FilterTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            totalCount={totalCount}
            favoritesCount={favoritesCount}
            hiddenCount={hiddenCount}
          />
          <SyncButton
            onSync={onSync}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
          />
        </div>

        {/* Item count */}
        {totalCount > 0 && (
          <div className="px-4 py-2 text-xs text-gray-400 shrink-0">
            {filteredCount === totalCount
              ? `${totalCount} items`
              : `${filteredCount} of ${totalCount} items`}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error.message || "An error occurred while syncing."}
            </div>
          )}

          {isSyncing && totalCount === 0 ? (
            <SkeletonCard count={6} />
          ) : (
            <ItemGrid
              items={items}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
              onToggleHidden={onToggleHidden}
            />
          )}
        </div>
      </div>
    </>
  );
}
