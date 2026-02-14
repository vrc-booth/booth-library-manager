import type { MouseEvent } from "react";
import type { BoothItem } from "../../../types/booth.ts";

interface ItemCardProps {
  item: BoothItem;
  isFavorite: boolean;
  onToggleFavorite: (itemId: string) => void;
  onToggleHidden: (itemId: string) => void;
}

export default function ItemCard({
  item,
  isFavorite,
  onToggleFavorite,
  onToggleHidden,
}: ItemCardProps) {
  const downloadLinks = item.downloadUrls.filter((link) => link.url.trim().length > 0);

  const handleCardClick = () => {
    window.open(item.boothUrl, "_blank", "noopener,noreferrer");
  };

  const handleFavoriteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleFavorite(item.id);
  };

  const handleHideClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleHidden(item.id);
  };

  const handleQuickDownload = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (downloadLinks.length === 0) {
      return;
    }

    window.open(downloadLinks[0].url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleCardClick}
      className="
        group relative rounded-lg
        bg-white border border-gray-100
        shadow-sm hover:shadow-md hover:z-30
        transition-all duration-200 hover:scale-[1.02]
        cursor-pointer
      "
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
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

      {/* Favorite indicator - always visible when favorited */}
      {isFavorite && (
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
      )}

      {/* Info */}
      <div className="p-2 flex flex-col min-h-[72px]">
        <p className="text-[10px] text-gray-500 truncate">
          {item.creator}
        </p>
        <h3 className="text-xs font-medium text-gray-800 line-clamp-2 leading-tight min-h-[2rem]">
          {item.title}
        </h3>

        <div
          className="relative mt-auto pt-2 group/download"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleQuickDownload}
            disabled={downloadLinks.length === 0}
            className={`
              w-full flex items-center justify-center gap-1.5
              px-2 py-1.5 text-[10px] font-medium rounded-md
              transition-colors
              ${downloadLinks.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-[#fc4d50]/10 text-[#fc4d50] hover:bg-[#fc4d50]/20"
              }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            {downloadLinks.length === 0 ? "No download" : "Download"}
          </button>

          {downloadLinks.length > 0 && (
            <div
              className="
                absolute left-0 right-0 top-full z-20
                opacity-0 pointer-events-none
                group-hover/download:opacity-100 group-hover/download:pointer-events-auto
                group-focus-within/download:opacity-100 group-focus-within/download:pointer-events-auto
                transition-opacity
              "
            >
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg p-1">
                {downloadLinks.map((link, index) => (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block px-2 py-1 text-[10px] text-gray-700 rounded hover:bg-gray-100 truncate"
                    title={link.name}
                  >
                    {index + 1}. {link.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
