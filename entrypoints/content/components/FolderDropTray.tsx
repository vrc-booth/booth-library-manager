import { useState, type DragEvent } from "react";
import type { LibraryFolder } from "../../../types/booth.ts";
import { flattenFolderTree } from "../../../utils/folders.ts";
import FolderIcon from "./FolderIcon.tsx";

interface FolderDropTrayProps {
  folders: LibraryFolder[];
  itemCount: number;
  isMove: boolean;
  sourceFolderId: string | null;
  onDrop: (folderId: string) => void;
}

export default function FolderDropTray({ folders, itemCount, isMove, sourceFolderId, onDrop }: FolderDropTrayProps) {
  const [hoveredFolderId, setHoveredFolderId] = useState<string | null>(null);
  const entries = flattenFolderTree(folders);
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  const handleDragOver = (event: DragEvent<HTMLElement>, folderId: string) => {
    if (folderId === sourceFolderId) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = isMove ? "move" : "copy";
    if (hoveredFolderId !== folderId) {
      setHoveredFolderId(folderId);
    }
  };

  const handleDrop = (event: DragEvent<HTMLElement>, folderId: string) => {
    event.preventDefault();
    setHoveredFolderId(null);
    if (folderId !== sourceFolderId) {
      onDrop(folderId);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 max-h-[45%] flex flex-col border-t border-gray-200 bg-white/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
      <p className="px-4 pt-3 pb-2 text-xs font-medium text-gray-600 shrink-0">
        {entries.length === 0
          ? "No folders yet. Create one in the Custom tab first."
          : `Drop on a folder to ${isMove ? "move" : "add"} ${itemLabel}`}
      </p>
      <ul className="flex-1 overflow-y-auto px-2 pb-3">
        {entries.map(({ folder, depth }) => {
          const isSource = folder.id === sourceFolderId;
          const isHovered = hoveredFolderId === folder.id;

          return (
            <li key={folder.id} style={{ paddingLeft: depth * 16 }}>
              <div
                onDragOver={(event) => handleDragOver(event, folder.id)}
                onDragLeave={(event) => {
                  if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
                    return;
                  }
                  setHoveredFolderId((current) => (current === folder.id ? null : current));
                }}
                onDrop={(event) => handleDrop(event, folder.id)}
                className={`
                  flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors
                  ${isSource ? "text-gray-300" : "text-gray-700"}
                  ${isHovered ? "bg-[#fc4d50]/10 ring-2 ring-[#fc4d50]/50" : ""}
                `}
              >
                <FolderIcon size={14} filled={isHovered} className={isHovered ? "text-[#fc4d50]" : "text-gray-400"} />
                <span className="truncate">{folder.name}</span>
                {isSource && <span className="ml-auto text-[10px]">current</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
