import { useState, type FormEvent, type KeyboardEvent } from "react";
import { MAX_FOLDER_NAME_LENGTH } from "../../../utils/folders.ts";

interface FolderNameInputProps {
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export default function FolderNameInput({
  initialValue = "",
  placeholder = "Folder name",
  submitLabel,
  onSubmit,
  onCancel,
}: FolderNameInputProps) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (trimmed.length === 0) {
      return;
    }
    onSubmit(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 패널 바깥(BOOTH 페이지)의 단축키가 반응하지 않도록 키 입력을 여기서 멈춘다.
    event.stopPropagation();
    if (event.key === "Escape") {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={value}
        maxLength={MAX_FOLDER_NAME_LENGTH}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          flex-1 min-w-0 px-2 py-1 text-xs
          border border-gray-200 rounded-md bg-white text-gray-800
          focus:outline-none focus:ring-2 focus:ring-[#fc4d50]/30 focus:border-[#fc4d50]
        "
      />
      <button
        type="submit"
        disabled={trimmed.length === 0}
        className="px-2 py-1 text-xs font-medium text-white bg-[#fc4d50] rounded-md hover:bg-[#e03e41] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-1.5 py-1 text-xs text-gray-500 rounded-md hover:bg-gray-100 transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
