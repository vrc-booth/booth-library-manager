export type LibrarySource = "library" | "gifts";

export interface BoothItem {
  id: string;
  title: string;
  creator: string;
  thumbnailUrl: string;
  boothUrl: string;
  downloadUrls: DownloadFile[];
  purchasedAt?: string;
  source?: LibrarySource;
}

export interface DownloadFile {
  name: string;
  url: string;
}

export interface LibraryFolder {
  id: string;
  name: string;
  parentId: string | null;
  itemIds: string[];
  createdAt: number;
}

export interface UserPreferences {
  favorites: string[];
  hidden: string[];
  tags: Record<string, string[]>;
  folders: LibraryFolder[];
}

export interface LibraryPage {
  items: BoothItem[];
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
}

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncProgress {
  status: SyncStatus;
  currentPage: number;
  totalPages?: number;
  itemsCollected: number;
  source?: LibrarySource;
}

export type FilterTab = "all" | "favorites" | "hidden" | "custom";

export type SourceTab = "library" | "gifts";
