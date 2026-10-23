import { browser } from "wxt/browser";

export const DOWNLOAD_FILES_MESSAGE = "booth-library-manager:download-files";

const DOWNLOAD_INTERVAL_MS = 500;
const MAX_FILES_PER_REQUEST = 500;

export type DownloadFilesResponse =
  | { ok: true; queued: number }
  | { ok: false; error: string };

const downloadQueue: string[] = [];
let isProcessingQueue = false;

export function isAllowedDownloadUrl(url: string): boolean {
  if (!URL.canParse(url)) {
    return false;
  }

  const parsed = new URL(url);
  return parsed.protocol === "https:" && (parsed.hostname === "booth.pm" || parsed.hostname.endsWith(".booth.pm"));
}

function normalizeDownloadUrls(urls: unknown[]): string[] {
  const allowed = urls
    .filter((url): url is string => typeof url === "string")
    .filter(isAllowedDownloadUrl);

  return Array.from(new Set(allowed)).slice(0, MAX_FILES_PER_REQUEST);
}

export function getDownloadFilesUrls(message: unknown): string[] | null {
  if (!message || typeof message !== "object") {
    return null;
  }

  const raw = message as Record<string, unknown>;
  if (raw.type !== DOWNLOAD_FILES_MESSAGE || !Array.isArray(raw.urls)) {
    return null;
  }

  return normalizeDownloadUrls(raw.urls);
}

function isDownloadFilesResponse(value: unknown): value is DownloadFilesResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const raw = value as Record<string, unknown>;
  if (raw.ok === true) {
    return typeof raw.queued === "number";
  }
  return raw.ok === false && typeof raw.error === "string";
}

/**
 * 콘텐츠 스크립트에서 호출한다. 다운로드는 백그라운드가 순서대로 시작하며, 대기열에 넣은 파일 수를 반환한다.
 */
export async function requestDownloads(urls: string[]): Promise<number> {
  const normalized = normalizeDownloadUrls(urls);
  if (normalized.length === 0) {
    return 0;
  }

  const response: unknown = await browser.runtime.sendMessage({ type: DOWNLOAD_FILES_MESSAGE, urls: normalized });
  if (!isDownloadFilesResponse(response)) {
    throw new Error("Invalid download response from background");
  }
  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.queued;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processDownloadQueue(): Promise<void> {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  try {
    while (downloadQueue.length > 0) {
      const url = downloadQueue.shift();
      if (url === undefined) {
        continue;
      }

      try {
        await browser.downloads.download({ url, conflictAction: "uniquify" });
      } catch (error) {
        console.warn(`[booth-library-manager] Failed to start download: ${url}`, error);
      }

      if (downloadQueue.length > 0) {
        await delay(DOWNLOAD_INTERVAL_MS);
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * 백그라운드에서 호출한다. BOOTH가 한꺼번에 많은 요청을 받지 않도록 간격을 두고 하나씩 시작한다.
 */
export function enqueueDownloads(urls: string[]): number {
  const normalized = normalizeDownloadUrls(urls);
  downloadQueue.push(...normalized);
  void processDownloadQueue();
  return normalized.length;
}
