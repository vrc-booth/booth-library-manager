import type { SyncProgress } from "../../../types/booth.ts";

interface SyncButtonProps {
  onSync: () => void;
  isSyncing: boolean;
  syncProgress: SyncProgress;
}

export default function SyncButton({ onSync, isSyncing, syncProgress }: SyncButtonProps) {
  const getLabel = () => {
    const sourceLabel = syncProgress.source === "gifts" ? "Gifts" : "Library";

    switch (syncProgress.status) {
      case "syncing":
        return `${sourceLabel} page ${syncProgress.currentPage}... (${syncProgress.itemsCollected} items)`;
      case "success":
        return `${syncProgress.itemsCollected} items synced (library + gifts)`;
      case "error":
        return "Sync failed - retry?";
      default:
        return "Sync Library";
    }
  };

  return (
    <button
      onClick={onSync}
      disabled={isSyncing}
      className={`
        w-full flex items-center justify-center gap-2
        px-4 py-2 text-sm font-medium rounded-lg
        transition-all duration-200
        ${isSyncing
          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
          : syncProgress.status === "error"
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-[#fc4d50] text-white hover:bg-[#e03e41] active:scale-[0.98]"
        }
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isSyncing ? "animate-spin" : ""}
      >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
      </svg>
      {getLabel()}
    </button>
  );
}
