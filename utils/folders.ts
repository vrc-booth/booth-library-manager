import { type LibraryFolder } from "../types/booth.ts";

export const MAX_FOLDER_NAME_LENGTH = 60;

export function sanitizeFolderName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_FOLDER_NAME_LENGTH);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function compareFolders(a: LibraryFolder, b: LibraryFolder): number {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }) || a.createdAt - b.createdAt;
}

export function getChildFolders(folders: LibraryFolder[], parentId: string | null): LibraryFolder[] {
  return folders.filter((folder) => folder.parentId === parentId).sort(compareFolders);
}

export function findFolder(folders: LibraryFolder[], folderId: string | null): LibraryFolder | undefined {
  if (folderId === null) {
    return undefined;
  }
  return folders.find((folder) => folder.id === folderId);
}

/**
 * 최상위부터 해당 폴더까지의 경로를 반환한다.
 */
export function getFolderPath(folders: LibraryFolder[], folderId: string | null): LibraryFolder[] {
  const path: LibraryFolder[] = [];
  const visited = new Set<string>();
  let current = findFolder(folders, folderId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current);
    current = findFolder(folders, current.parentId);
  }

  return path;
}

/**
 * 폴더 자신과 모든 하위 폴더의 id를 반환한다.
 */
export function getDescendantFolderIds(folders: LibraryFolder[], folderId: string): string[] {
  const result: string[] = [];
  const queue = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === undefined || result.includes(currentId)) {
      continue;
    }

    result.push(currentId);
    for (const folder of folders) {
      if (folder.parentId === currentId) {
        queue.push(folder.id);
      }
    }
  }

  return result;
}

export function collectFolderItemIds(
  folders: LibraryFolder[],
  folderId: string,
  includeSubfolders: boolean,
): string[] {
  const folderIds = includeSubfolders ? getDescendantFolderIds(folders, folderId) : [folderId];
  const itemIds: string[] = [];

  for (const id of folderIds) {
    const folder = findFolder(folders, id);
    if (folder) {
      itemIds.push(...folder.itemIds);
    }
  }

  return uniqueStrings(itemIds);
}

export interface FolderTreeEntry {
  folder: LibraryFolder;
  depth: number;
}

/**
 * 트리를 화면에 그리기 좋게 깊이 우선 순서로 펼친다.
 */
export function flattenFolderTree(folders: LibraryFolder[]): FolderTreeEntry[] {
  const entries: FolderTreeEntry[] = [];

  const visit = (parentId: string | null, depth: number) => {
    for (const folder of getChildFolders(folders, parentId)) {
      entries.push({ folder, depth });
      visit(folder.id, depth + 1);
    }
  };

  visit(null, 0);
  return entries;
}

export function getAllFolderItemIds(folders: LibraryFolder[]): string[] {
  return uniqueStrings(folders.flatMap((folder) => folder.itemIds));
}

export function canMoveFolder(folders: LibraryFolder[], folderId: string, newParentId: string | null): boolean {
  if (newParentId === null) {
    return true;
  }
  if (!findFolder(folders, newParentId)) {
    return false;
  }
  return !getDescendantFolderIds(folders, folderId).includes(newParentId);
}

export function createFolder(
  folders: LibraryFolder[],
  name: string,
  parentId: string | null,
  id: string,
): LibraryFolder[] {
  const sanitizedName = sanitizeFolderName(name);
  if (sanitizedName.length === 0) {
    return folders;
  }

  const resolvedParentId = parentId !== null && findFolder(folders, parentId) ? parentId : null;

  return [
    ...folders,
    {
      id,
      name: sanitizedName,
      parentId: resolvedParentId,
      itemIds: [],
      createdAt: Date.now(),
    },
  ];
}

export function renameFolder(folders: LibraryFolder[], folderId: string, name: string): LibraryFolder[] {
  const sanitizedName = sanitizeFolderName(name);
  if (sanitizedName.length === 0) {
    return folders;
  }

  return folders.map((folder) => (folder.id === folderId ? { ...folder, name: sanitizedName } : folder));
}

/**
 * 폴더와 모든 하위 폴더를 지운다. 아이템 자체는 라이브러리에 그대로 남는다.
 */
export function deleteFolder(folders: LibraryFolder[], folderId: string): LibraryFolder[] {
  const removedIds = new Set(getDescendantFolderIds(folders, folderId));
  return folders.filter((folder) => !removedIds.has(folder.id));
}

export function moveFolder(folders: LibraryFolder[], folderId: string, newParentId: string | null): LibraryFolder[] {
  if (!canMoveFolder(folders, folderId, newParentId)) {
    return folders;
  }

  return folders.map((folder) => (folder.id === folderId ? { ...folder, parentId: newParentId } : folder));
}

export function addItemsToFolder(folders: LibraryFolder[], folderId: string, itemIds: string[]): LibraryFolder[] {
  return folders.map((folder) => {
    if (folder.id !== folderId) {
      return folder;
    }
    return { ...folder, itemIds: uniqueStrings([...folder.itemIds, ...itemIds]) };
  });
}

export function removeItemsFromFolder(folders: LibraryFolder[], folderId: string, itemIds: string[]): LibraryFolder[] {
  const removed = new Set(itemIds);
  return folders.map((folder) => {
    if (folder.id !== folderId) {
      return folder;
    }
    return { ...folder, itemIds: folder.itemIds.filter((itemId) => !removed.has(itemId)) };
  });
}

export function moveItemsToFolder(
  folders: LibraryFolder[],
  fromFolderId: string,
  toFolderId: string,
  itemIds: string[],
): LibraryFolder[] {
  if (fromFolderId === toFolderId || !findFolder(folders, toFolderId)) {
    return folders;
  }
  return addItemsToFolder(removeItemsFromFolder(folders, fromFolderId, itemIds), toFolderId, itemIds);
}

export function getItemFolderIds(folders: LibraryFolder[], itemId: string): string[] {
  return folders.filter((folder) => folder.itemIds.includes(itemId)).map((folder) => folder.id);
}

/**
 * 저장소에서 읽은 값을 검증한다. 부모가 없거나 순환하는 폴더는 최상위로 옮긴다.
 */
export function normalizeFolders(value: unknown): LibraryFolder[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();
  const folders: LibraryFolder[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const raw = entry as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const name = typeof raw.name === "string" ? sanitizeFolderName(raw.name) : "";
    if (id.length === 0 || name.length === 0 || seenIds.has(id)) {
      continue;
    }

    seenIds.add(id);
    folders.push({
      id,
      name,
      parentId: typeof raw.parentId === "string" ? raw.parentId : null,
      itemIds: Array.isArray(raw.itemIds)
        ? uniqueStrings(
            raw.itemIds
              .filter((itemId): itemId is string => typeof itemId === "string")
              .map((itemId) => itemId.trim())
              .filter((itemId) => itemId.length > 0),
          )
        : [],
      createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0,
    });
  }

  const withParents = folders.map((folder) => {
    return folder.parentId !== null && !seenIds.has(folder.parentId) ? { ...folder, parentId: null } : folder;
  });

  return withParents.map((folder) => {
    if (folder.parentId === null) {
      return folder;
    }

    const isCyclic = getFolderPath(withParents, folder.id)[0]?.parentId !== null;
    return isCyclic ? { ...folder, parentId: null } : folder;
  });
}
