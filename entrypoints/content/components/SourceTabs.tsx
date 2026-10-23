import type { SourceTab } from "../../../types/booth.ts";

interface SourceTabsProps {
  activeSourceTab: SourceTab;
  onSourceTabChange: (tab: SourceTab) => void;
  libraryCount: number;
  giftsCount: number;
  customCount: number;
}

const TABS: { key: SourceTab; label: string }[] = [
  { key: "library", label: "Library" },
  { key: "gifts", label: "Gifts" },
  { key: "custom", label: "Custom" },
];

export default function SourceTabs({
  activeSourceTab,
  onSourceTabChange,
  libraryCount,
  giftsCount,
  customCount,
}: SourceTabsProps) {
  const counts: Record<SourceTab, number> = {
    library: libraryCount,
    gifts: giftsCount,
    custom: customCount,
  };

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {TABS.map((tab) => {
        const isActive = activeSourceTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onSourceTabChange(tab.key)}
            title={tab.label}
            className={`
              flex-1 min-w-0 flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md whitespace-nowrap
              transition-all duration-200
              ${isActive
                ? "bg-white text-[#fc4d50] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <span className="truncate">{tab.label}</span>
            <span className={`ml-1 shrink-0 ${isActive ? "text-[#fc4d50]/70" : "text-gray-400"}`}>
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
