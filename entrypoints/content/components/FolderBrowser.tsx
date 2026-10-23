import { useState, type DragEvent } from "react";
import type { LibraryFolder } from "../../../types/booth.ts";
import type { FolderActions } from "../../../hooks/useUserPreferences.ts";
import { canMoveFolder, getChildFolders, getFolderPath } from "../../../utils/folders.ts";
import DownloadIcon from "./DownloadIcon.tsx";
import FolderIcon from "./FolderIcon.tsx";
import FolderNameInput from "./FolderNameInput.tsx";

interface FolderBrowserProps {
  folders: LibraryFolder[];
  activeFolderId: string | null;
  onOpenFolder: (folderId: string | null) => void;
  folderActions: FolderActions;
  isDraggingItems: boolean;
  onDropItems: (folderId: string) => void;
  folderFileCount: number;
  onDownloadFolder: () => void;
  onRequestDelete: (folder: LibraryFolder) => void;
}

const ROOT_DROP_KEY = "__root__";

export default function FolderBrowser({
  folders,
  activeFolderId,
  onOpenFolder,
  folderActions,
  isDraggingItems,
  onDropItems,
  folderFileCount,
  onDownloadFolder,
  onRequestDelete,
}: FolderBrowserProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);

  const path = getFolderPath(folders, activeFolderId);
  const activeFolder = path.at(-1);
  const childFolders = getChildFolders(folders, activeFolderId);

  const canDropOn = (targetId: string | null): boolean => {
    if (draggedFolderId) {
      return draggedFolderId !== targetId && canMoveFolder(folders, draggedFolderId, targetId);
    }
    // 아이템은 최상위에 둘 수 없고, 지금 보고 있는 폴더에 다시 넣는 것도 의미가 없다.
    return isDraggingItems && targetId !== null && targetId !== activeFolderId;
  };

  const dropHandlers = (targetId: string | null) => {
    const key = targetId ?? ROOT_DROP_KEY;
    return {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!canDropOn(targetId)) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (dropTargetKey !== key) {
          setDropTargetKey(key);
        }
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        // 안쪽 자식 요소로 옮겨 갈 때도 dragleave가 오므로, 진짜로 벗어났을 때만 강조를 끈다.
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
          return;
        }
        if (dropTargetKey === key) {
          setDropTargetKey(null);
        }
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        setDropTargetKey(null);
        if (!canDropOn(targetId)) {
          return;
        }
        if (draggedFolderId) {
          void folderActions.moveFolder(draggedFolderId, targetId);
          setDraggedFolderId(null);
          return;
        }
        if (targetId !== null) {
          onDropItems(targetId);
        }
      },
    };
  };

  const handleCreate = async (name: string) => {
    setIsCreating(false);
    await folderActions.createFolder(name, activeFolderId);
  };

  const handleRename = async (folderId: string, name: string) => {
    setRenamingFolderId(null);
    await folderActions.renameFolder(folderId, name);
  };

  const highlight = (key: string) =>
    dropTargetKey === key ? "bg-[#fc4d50]/10 ring-2 ring-[#fc4d50]/50" : "";

  return (
    <div className="mb-3 space-y-2">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-0.5 text-xs">
        <button
          onClick={() => onOpenFolder(null)}
          {...dropHandlers(null)}
          className={`px-1.5 py-1 rounded-md font-medium transition-colors ${activeFolderId === null ? "text-gray-800" : "text-gray-500 hover:bg-gray-100"} ${highlight(ROOT_DROP_KEY)}`}
        >
          Folders
        </button>
        {path.map((folder) => (
          <span key={folder.id} className="flex items-center gap-0.5 min-w-0">
            <span className="text-gray-300">/</span>
            <button
              onClick={() => onOpenFolder(folder.id)}
              {...dropHandlers(folder.id)}
              className={`px-1.5 py-1 rounded-md truncate max-w-[160px] transition-colors ${folder.id === activeFolderId ? "font-semibold text-gray-800" : "text-gray-500 hover:bg-gray-100"} ${highlight(folder.id)}`}
              title={folder.name}
            >
              {folder.name}
            </button>
          </span>
        ))}
      </nav>

      {/* Actions */}
      {activeFolder && renamingFolderId === activeFolder.id ? (
        <FolderNameInput
          initialValue={activeFolder.name}
          submitLabel="Rename"
          onSubmit={(name) => void handleRename(activeFolder.id, name)}
          onCancel={() => setRenamingFolderId(null)}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#fc4d50] bg-[#fc4d50]/10 rounded-md hover:bg-[#fc4d50]/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New folder
          </button>
          {activeFolder && (
            <>
              <button
                onClick={onDownloadFolder}
                disabled={folderFileCount === 0}
                title="Download every file in this folder and its subfolders"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <DownloadIcon />
                Download ({folderFileCount})
              </button>
              <button
                onClick={() => setRenamingFolderId(activeFolder.id)}
                className="px-2 py-1 text-xs text-gray-500 rounded-md hover:bg-gray-100 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => onRequestDelete(activeFolder)}
                className="px-2 py-1 text-xs text-red-500 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {isCreating && (
        <FolderNameInput
          placeholder={activeFolder ? `New folder in ${activeFolder.name}` : "New folder"}
          submitLabel="Create"
          onSubmit={(name) => void handleCreate(name)}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Subfolders */}
      {childFolders.length > 0 && (
        <ul className="space-y-1">
          {childFolders.map((folder) => {
            const subfolderCount = getChildFolders(folders, folder.id).length;

            return (
              <li key={folder.id}>
                {renamingFolderId === folder.id ? (
                  <FolderNameInput
                    initialValue={folder.name}
                    submitLabel="Rename"
                    onSubmit={(name) => void handleRename(folder.id, name)}
                    onCancel={() => setRenamingFolderId(null)}
                  />
                ) : (
                  <div
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", folder.name);
                      setDraggedFolderId(folder.id);
                    }}
                    onDragEnd={() => {
                      setDraggedFolderId(null);
                      setDropTargetKey(null);
                    }}
                    {...dropHandlers(folder.id)}
                    className={`group/folder flex items-center gap-2 px-2.5 py-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors ${highlight(folder.id)}`}
                    onClick={() => onOpenFolder(folder.id)}
                  >
                    <FolderIcon size={16} filled className="shrink-0 text-[#fc4d50]/70" />
                    <span className="flex-1 min-w-0 truncate text-xs font-medium text-gray-700" title={folder.name}>
                      {folder.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">
                      {subfolderCount > 0 && `${subfolderCount} ${subfolderCount === 1 ? "folder" : "folders"} · `}
                      {folder.itemIds.length} {folder.itemIds.length === 1 ? "item" : "items"}
                    </span>
                    <span className="shrink-0 flex gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFolderId(folder.id);
                        }}
                        title="Rename"
                        className="p-1 rounded text-gray-400 hover:bg-white hover:text-gray-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDelete(folder);
                        }}
                        title="Delete"
                        className="p-1 rounded text-gray-400 hover:bg-white hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {activeFolderId === null && childFolders.length === 0 && !isCreating && (
        <div className="py-8 text-center text-gray-400">
          <FolderIcon size={36} className="mx-auto text-gray-300" />
          <p className="mt-3 text-sm">No folders yet</p>
          <p className="mt-1 text-xs">Create a folder, then add items with the folder button on a card, by selecting several items, or by dragging.</p>
        </div>
      )}
    </div>
  );
}
