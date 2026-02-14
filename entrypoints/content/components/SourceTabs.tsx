import type { SourceTab } from "../../../types/booth.ts";

interface SourceTabsProps {
  activeSourceTab: SourceTab;
  onSourceTabChange: (tab: SourceTab) => void;
  libraryCount: number;
  giftsCount: number;
}

export default function SourceTabs({
  activeSourceTab,
  onSourceTabChange,
  libraryCount,
  giftsCount,
}: SourceTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onSourceTabChange("library")}
        className={`
          flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
          ${activeSourceTab === "library"
            ? "bg-white text-[#fc4d50] shadow-sm"
            : "text-gray-500 hover:text-gray-700"
          }
        `}
      >
        Library
        <span className={`ml-1 ${activeSourceTab === "library" ? "text-[#fc4d50]/70" : "text-gray-400"}`}>
          {libraryCount}
        </span>
      </button>
      <button
        onClick={() => onSourceTabChange("gifts")}
        className={`
          flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
          ${activeSourceTab === "gifts"
            ? "bg-white text-[#fc4d50] shadow-sm"
            : "text-gray-500 hover:text-gray-700"
          }
        `}
      >
        Gifts
        <span className={`ml-1 ${activeSourceTab === "gifts" ? "text-[#fc4d50]/70" : "text-gray-400"}`}>
          {giftsCount}
        </span>
      </button>
    </div>
  );
}
