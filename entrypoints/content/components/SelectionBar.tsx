import DownloadIcon from "./DownloadIcon.tsx";
import FolderIcon from "./FolderIcon.tsx";

interface SelectionBarProps {
  selectedCount: number;
  visibleCount: number;
  fileCount: number;
  canRemoveFromFolder: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onAddToFolder: () => void;
  onDownload: () => void;
  onRemoveFromFolder: () => void;
  onDone: () => void;
}

export default function SelectionBar({
  selectedCount,
  visibleCount,
  fileCount,
  canRemoveFromFolder,
  onSelectAll,
  onClearSelection,
  onAddToFolder,
  onDownload,
  onRemoveFromFolder,
  onDone,
}: SelectionBarProps) {
  const hasSelection = selectedCount > 0;
  const isAllSelected = visibleCount > 0 && selectedCount >= visibleCount;

  return (
    <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-2.5 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{selectedCount} selected</span>
        <div className="flex gap-1">
          <button
            onClick={isAllSelected ? onClearSelection : onSelectAll}
            className="px-2 py-1 text-gray-500 rounded-md hover:bg-gray-100 transition-colors"
          >
            {isAllSelected ? "Clear" : `Select all (${visibleCount})`}
          </button>
          <button
            onClick={onDone}
            className="px-2 py-1 font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={onAddToFolder}
          disabled={!hasSelection}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-[#fc4d50] rounded-md hover:bg-[#e03e41] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <FolderIcon size={12} />
          Add to folder
        </button>
        <button
          onClick={onDownload}
          disabled={fileCount === 0}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-[#fc4d50] bg-[#fc4d50]/10 rounded-md hover:bg-[#fc4d50]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <DownloadIcon />
          Download ({fileCount})
        </button>
        {canRemoveFromFolder && (
          <button
            onClick={onRemoveFromFolder}
            disabled={!hasSelection}
            className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Remove from folder
          </button>
        )}
      </div>
    </div>
  );
}
