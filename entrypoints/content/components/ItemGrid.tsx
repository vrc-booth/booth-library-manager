import type { BoothItem } from "../../../types/booth.ts";
import ItemCard from "./ItemCard.tsx";

interface ItemGridProps {
  items: BoothItem[];
  isFavorite: (itemId: string) => boolean;
  onToggleFavorite: (itemId: string) => void;
  onToggleHidden: (itemId: string) => void;
}

export default function ItemGrid({
  items,
  isFavorite,
  onToggleFavorite,
  onToggleHidden,
}: ItemGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M12 13V7" />
          <path d="M9 10l3-3 3 3" />
        </svg>
        <p className="mt-3 text-sm">No items found</p>
        <p className="text-xs mt-1">Try syncing your library or adjusting filters</p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))" }}
    >
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={onToggleFavorite}
          onToggleHidden={onToggleHidden}
        />
      ))}
    </div>
  );
}
