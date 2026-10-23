import type { DragEvent, MouseEvent } from "react";
import type { BoothItem } from "../../../types/booth.ts";
import { useLibraryActions } from "../libraryActions.ts";
import DownloadIcon from "./DownloadIcon.tsx";
import FolderIcon from "./FolderIcon.tsx";

interface ItemCardProps {
  item: BoothItem;
}

export default function ItemCard({ item }: ItemCardProps) {
  const actions = useLibraryActions();

  const fileCount = item.downloadUrls.filter((link) => link.url.trim().length > 0).length;
  const isFavorite = actions.isFavorite(item.id);
  const isSelected = actions.isSelected(item.id);
  const isInFolder = actions.isInAnyFolder(item.id);

  const handleCardClick = () => {
    if (actions.isSelectMode) {
      actions.toggleSelected(item.id);
      return;
    }
    window.open(item.boothUrl, "_blank", "noopener,noreferrer");
  };

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    actions.toggleFavorite(item.id);
  };

  const handleHideClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    actions.toggleHidden(item.id);
  };

  const handleFolderClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    actions.openFolderPicker(item.id);
  };

  const handleDownloadClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    actions.openDownloadDialog(item.id);
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData("text/plain", item.title);
    actions.startItemDrag(item.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={actions.endItemDrag}
      onClick={handleCardClick}
      className={`
        group relative rounded-lg
        bg-white border
        shadow-sm hover:shadow-md hover:z-30
        transition-all duration-200 hover:scale-[1.02]
        cursor-pointer
        ${isSelected ? "border-[#fc4d50] ring-2 ring-[#fc4d50]/40" : "border-gray-100"}
      `}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Action buttons - visible on hover */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleFolderClick}
          className="p-1.5 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
          title="Add to folders"
        >
          <FolderIcon filled={isInFolder} className={isInFolder ? "text-[#fc4d50]" : "text-gray-600"} />
        </button>
        <button
          onClick={handleFavoriteClick}
          className="p-1.5 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isFavorite ? "#fc4d50" : "none"}
            stroke={isFavorite ? "#fc4d50" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isFavorite ? "" : "text-gray-600"}
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
        <button
          onClick={handleHideClick}
          className="p-1.5 rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
          title="Hide item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-600"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        </button>
      </div>

      {/* Top-left indicator: selection checkbox in select mode, otherwise favorite */}
      {actions.isSelectMode ? (
        <div
          className={`
            absolute top-1.5 left-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm
            ${isSelected ? "bg-[#fc4d50] border-[#fc4d50]" : "bg-white/90 border-gray-300"}
          `}
        >
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      ) : (
        isFavorite && (
          <div className="absolute top-1 left-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="#fc4d50"
              stroke="#fc4d50"
              strokeWidth="2"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
        )
      )}

      {/* Info */}
      <div className="p-2 flex flex-col min-h-[72px]">
        <p className="text-[10px] text-gray-500 truncate">
          {item.creator}
        </p>
        <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight min-h-[2rem]">
          {item.title}
        </h3>

        <div className="mt-auto pt-2">
          <button
            onClick={handleDownloadClick}
            disabled={fileCount === 0}
            title={fileCount === 0 ? "No downloadable files" : "Choose files to download"}
            className={`
              w-full flex items-center justify-center gap-1.5
              px-2 py-1.5 text-[10px] font-medium rounded-md
              transition-colors
              ${fileCount === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#fc4d50]/10 text-[#fc4d50] hover:bg-[#fc4d50]/20"
              }
            `}
          >
            <DownloadIcon />
            {fileCount === 0 ? "No download" : fileCount > 1 ? `Download (${fileCount})` : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
