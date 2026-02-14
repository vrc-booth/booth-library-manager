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

export interface UserPreferences {
  favorites: string[];
  hidden: string[];
  tags: Record<string, string[]>;
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

export type FilterTab = "all" | "favorites" | "hidden";

export type SourceTab = "library" | "gifts";
