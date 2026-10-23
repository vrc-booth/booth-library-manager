import type { FilterTab } from "../../../types/booth.ts";

interface FilterTabsProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  totalCount: number;
  favoritesCount: number;
  hiddenCount: number;
  customCount: number;
}

type CountKey = keyof Pick<FilterTabsProps, "totalCount" | "favoritesCount" | "hiddenCount" | "customCount">;

const TABS: { key: FilterTab; label: string; countKey: CountKey }[] = [
  { key: "all", label: "All", countKey: "totalCount" },
  { key: "favorites", label: "Favorites", countKey: "favoritesCount" },
  { key: "hidden", label: "Hidden", countKey: "hiddenCount" },
  { key: "custom", label: "Custom", countKey: "customCount" },
];

export default function FilterTabs({
  activeTab,
  onTabChange,
  totalCount,
  favoritesCount,
  hiddenCount,
  customCount,
}: FilterTabsProps) {
  const counts: Record<CountKey, number> = {
    totalCount,
    favoritesCount,
    hiddenCount,
    customCount,
  };

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = counts[tab.countKey];

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            title={tab.label}
            className={`
              flex-1 min-w-0 flex items-center justify-center px-1.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap
              transition-all duration-200
              ${isActive
                ? "bg-white text-[#fc4d50] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <span className="truncate">{tab.label}</span>
            <span className={`ml-1 shrink-0 ${isActive ? "text-[#fc4d50]/70" : "text-gray-400"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
