import { useEffect, useState } from "react";
import type { LibraryFolder } from "../../../types/booth.ts";
import { flattenFolderTree } from "../../../utils/folders.ts";
import FolderIcon from "./FolderIcon.tsx";
import FolderNameInput from "./FolderNameInput.tsx";

interface FolderPickerDialogProps {
  title: string;
  description: string;
  folders: LibraryFolder[];
  /** 주어지면 체크박스로 여러 폴더를 켜고 끄는 방식, 없으면 폴더 하나를 고르는 방식 */
  checkedFolderIds?: string[];
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onClose: () => void;
}

export default function FolderPickerDialog({
  title,
  description,
  folders,
  checkedFolderIds,
  onSelectFolder,
  onCreateFolder,
  onClose,
}: FolderPickerDialogProps) {
  // undefined: 입력 닫힘, null: 최상위에 만들기, string: 해당 폴더 안에 만들기
  const [creatingParentId, setCreatingParentId] = useState<string | null | undefined>(undefined);
  const entries = flattenFolderTree(folders);
  const isToggleMode = checkedFolderIds !== undefined;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCreate = (name: string) => {
    onCreateFolder(name, creatingParentId ?? null);
    setCreatingParentId(undefined);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm max-h-[80%] flex flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2 shrink-0">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{description}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {entries.length === 0 && creatingParentId === undefined && (
            <p className="px-2 py-6 text-center text-xs text-gray-400">No folders yet. Create one below.</p>
          )}

          {entries.map(({ folder, depth }) => {
            const isChecked = checkedFolderIds?.includes(folder.id) ?? false;

            return (
              <div key={folder.id}>
                <div className="group/row flex items-center rounded-md hover:bg-gray-50" style={{ paddingLeft: depth * 16 }}>
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-left text-xs text-gray-700"
                  >
                    {isToggleMode && (
                      <span
                        className={`
                          w-4 h-4 shrink-0 rounded border flex items-center justify-center
                          ${isChecked ? "bg-[#fc4d50] border-[#fc4d50]" : "bg-white border-gray-300"}
                        `}
                      >
                        {isChecked && (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                    )}
                    <FolderIcon className="shrink-0 text-gray-400" />
                    <span className="truncate">{folder.name}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-gray-400">{folder.itemIds.length}</span>
                  </button>
                  <button
                    onClick={() => setCreatingParentId(folder.id)}
                    title={`New folder in ${folder.name}`}
                    className="mr-1 p-1 rounded text-gray-400 opacity-0 group-hover/row:opacity-100 hover:bg-gray-200 hover:text-gray-600 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
                {creatingParentId === folder.id && (
                  <div className="py-1 pr-1" style={{ paddingLeft: (depth + 1) * 16 + 8 }}>
                    <FolderNameInput submitLabel="Create" onSubmit={handleCreate} onCancel={() => setCreatingParentId(undefined)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 shrink-0 space-y-2">
          {creatingParentId === null ? (
            <FolderNameInput submitLabel="Create" onSubmit={handleCreate} onCancel={() => setCreatingParentId(undefined)} />
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCreatingParentId(null)}
                className="flex items-center gap-1 text-xs font-medium text-[#fc4d50] hover:text-[#e03e41]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New folder
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
              >
                {isToggleMode ? "Done" : "Cancel"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
