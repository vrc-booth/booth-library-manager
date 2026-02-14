import type { FilterTab } from "../../../types/booth.ts";

interface FilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  totalCount: number;
  favoritesCount: number;
  hiddenCount: number;
}

const TABS: { key: FilterTab; label: string; countKey: keyof Pick<FilterTabsProps, "totalCount" | "favoritesCount" | "hiddenCount"> }[] = [
  { key: "all", label: "All", countKey: "totalCount" },
  { key: "favorites", label: "Favorites", countKey: "favoritesCount" },
  { key: "hidden", label: "Hidden", countKey: "hiddenCount" },
];

export default function FilterTabs({
  activeTab,
  onTabChange,
  totalCount,
  favoritesCount,
  hiddenCount,
}: FilterTabsProps) {
  const counts: Record<string, number> = {
    totalCount,
    favoritesCount,
    hiddenCount,
  };

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = counts[tab.countKey] ?? 0;

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`
              flex-1 px-3 py-1.5 text-xs font-medium rounded-md
              transition-all duration-200
              ${isActive
                ? "bg-white text-[#fc4d50] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            {tab.label}
            <span className={`ml-1 ${isActive ? "text-[#fc4d50]/70" : "text-gray-400"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
