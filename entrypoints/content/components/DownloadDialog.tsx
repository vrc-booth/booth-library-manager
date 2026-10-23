import { useEffect, useMemo, useState } from "react";
import type { BoothItem } from "../../../types/booth.ts";
import DownloadIcon from "./DownloadIcon.tsx";

interface DownloadDialogProps {
  title: string;
  items: BoothItem[];
  onDownload: (urls: string[]) => void;
  onClose: () => void;
}

function getFileUrls(item: BoothItem): string[] {
  return item.downloadUrls.map((link) => link.url.trim()).filter((url) => url.length > 0);
}

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
}

function Checkbox({ checked, indeterminate = false }: CheckboxProps) {
  const isOn = checked || indeterminate;

  return (
    <span
      className={`
        w-4 h-4 shrink-0 rounded border flex items-center justify-center
        ${isOn ? "bg-[#fc4d50] border-[#fc4d50]" : "bg-white border-gray-300"}
      `}
    >
      {checked && (
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {!checked && indeterminate && <span className="w-2 h-0.5 rounded bg-white" />}
    </span>
  );
}

export default function DownloadDialog({ title, items, onDownload, onClose }: DownloadDialogProps) {
  const itemsWithFiles = useMemo(() => items.filter((item) => getFileUrls(item).length > 0), [items]);
  const allUrls = useMemo(() => Array.from(new Set(itemsWithFiles.flatMap(getFileUrls))), [itemsWithFiles]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(() => new Set(allUrls));

  const isSingleItem = items.length === 1;
  const skippedCount = items.length - itemsWithFiles.length;
  const isAllSelected = allUrls.length > 0 && selectedUrls.size === allUrls.length;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const toggleUrls = (urls: string[], shouldSelect: boolean) => {
    setSelectedUrls((current) => {
      const next = new Set(current);
      for (const url of urls) {
        if (shouldSelect) {
          next.add(url);
        } else {
          next.delete(url);
        }
      }
      return next;
    });
  };

  const handleDownload = () => {
    onDownload(allUrls.filter((url) => selectedUrls.has(url)));
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm max-h-[85%] flex flex-col rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-3 shrink-0 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{title}</h3>
          {isSingleItem && items[0] && (
            <p className="mt-0.5 text-xs text-gray-500 truncate">{items[0].creator}</p>
          )}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {selectedUrls.size} of {allUrls.length} files selected
            </span>
            {allUrls.length > 1 && (
              <button
                onClick={() => toggleUrls(allUrls, !isAllSelected)}
                className="px-1.5 py-0.5 font-medium text-[#fc4d50] rounded hover:bg-[#fc4d50]/10 transition-colors"
              >
                {isAllSelected ? "Clear" : "Select all"}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {allUrls.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-gray-400">No downloadable files.</p>
          )}

          {itemsWithFiles.map((item) => {
            const urls = getFileUrls(item);
            const selectedInItem = urls.filter((url) => selectedUrls.has(url)).length;
            const isItemChecked = selectedInItem === urls.length;

            return (
              <div key={item.id} className={isSingleItem ? "" : "mb-2"}>
                {!isSingleItem && (
                  <button
                    onClick={() => toggleUrls(urls, !isItemChecked)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-gray-50"
                  >
                    <Checkbox checked={isItemChecked} indeterminate={selectedInItem > 0 && !isItemChecked} />
                    <span className="flex-1 min-w-0 truncate text-xs font-medium text-gray-800" title={item.title}>
                      {item.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">{urls.length}</span>
                  </button>
                )}

                <ul className={isSingleItem ? "" : "pl-6"}>
                  {item.downloadUrls
                    .filter((link) => link.url.trim().length > 0)
                    .map((link, index) => {
                      const url = link.url.trim();
                      const isChecked = selectedUrls.has(url);

                      return (
                        <li key={`${url}-${index}`}>
                          <button
                            onClick={() => toggleUrls([url], !isChecked)}
                            className="w-full flex items-start gap-2 px-2 py-1.5 rounded-md text-left hover:bg-gray-50"
                            title={link.name}
                          >
                            <span className="mt-px">
                              <Checkbox checked={isChecked} />
                            </span>
                            <span className="flex-1 min-w-0 break-all text-xs text-gray-700">{link.name}</span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            );
          })}

          {skippedCount > 0 && (
            <p className="px-2 pt-1 text-[10px] text-gray-400">
              {skippedCount} {skippedCount === 1 ? "item has" : "items have"} no downloadable files.
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 shrink-0 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selectedUrls.size === 0}
            autoFocus
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#fc4d50] rounded-md hover:bg-[#e03e41] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <DownloadIcon />
            Download ({selectedUrls.size})
          </button>
        </div>
      </div>
    </div>
  );
}
