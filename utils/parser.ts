import { type BoothItem, type DownloadFile, type LibraryPage } from "../types/booth.ts";

const BOOTH_BASE_URL = "https://booth.pm";
const ACCOUNTS_BASE_URL = "https://accounts.booth.pm";

const ITEM_CONTAINER_SELECTORS = [
  ".l-library-item",
  "[data-product-id]",
  ".library-item",
  "main > div.w-full > div[class*='bg-white'][class*='p-16']",
  "main div[class*='desktop:rounded-8'][class*='bg-white'][class*='p-16']",
] as const;

const MAIN_AREA_SELECTORS = ["main", "[role='main']", ".l-main", ".main-content", "#main"] as const;

const ITEM_LINK_SELECTORS = [
  "a[href*='://booth.pm/items/']",
  "a[href*='.booth.pm/items/']",
  "a[href*='booth.pm/items/']",
  "a[href^='/items/']",
  "a[href*='/items/']",
] as const;

const TITLE_SELECTORS = [
  ".text-text-default.font-bold.text-16.mb-8.break-all",
  ".text-text-default.font-bold.text-16.break-all",
  ".item-name",
  ".library-item-title",
  "h1",
  "h2",
  "h3",
  "h4",
  "[data-title]",
] as const;

const CREATOR_SELECTORS = [
  ".text-14.text-text-gray600.break-all",
  ".shop-name",
  ".creator",
  ".item-creator",
  ".library-item-shop",
  "[data-shop-name]",
] as const;

const THUMBNAIL_SELECTORS = ["img", "[data-thumbnail] img", ".thumbnail img", ".item-thumbnail img"] as const;

const DOWNLOAD_LINK_SELECTORS = [
  "a[href*='/download/']",
  "a[href*='download']",
  "a[data-download-url]",
] as const;

const ITEM_CARD_LINK_SELECTORS = [
  "a[href*='/items/']",
  "a[href*='://booth.pm/items/']",
  "a[href*='://booth.pm/ko/items/']",
] as const;

const CURRENT_PAGE_SELECTORS = [
  "[aria-current='page']",
  ".pagination .current",
  ".pagination .is-current",
  ".pager .current",
] as const;

const NEXT_PAGE_SELECTORS = [
  "a[rel='next']",
  ".pagination a.next",
  ".pager a.next",
  "a[aria-label*='Next']",
  "a[aria-label*='next']",
] as const;

function queryAll<T extends Element>(root: ParentNode, selectors: readonly string[]): T[] {
  const found: T[] = [];

  for (const selector of selectors) {
    const elements = Array.from(root.querySelectorAll<T>(selector));
    if (elements.length > 0) {
      found.push(...elements);
    }
  }

  return found;
}

function dedupeElements<T extends Element>(elements: T[]): T[] {
  const unique = new Set<T>();
  for (const element of elements) {
    unique.add(element);
  }
  return Array.from(unique);
}

function dedupeDownloads(downloads: DownloadFile[]): DownloadFile[] {
  const uniqueByUrl = new Set<string>();
  const result: DownloadFile[] = [];

  for (const download of downloads) {
    const normalizedUrl = normalizeUrl(download.url);
    if (normalizedUrl.length === 0 || uniqueByUrl.has(normalizedUrl)) {
      continue;
    }

    uniqueByUrl.add(normalizedUrl);
    result.push({
      name: normalizeText(download.name) || "Download",
      url: normalizedUrl,
    });
  }

  return result;
}

function extractItemId(source: Element, href: string | null): string | null {
  const fromData =
    source.getAttribute("data-product-id") ||
    source.getAttribute("data-item-id") ||
    source.getAttribute("data-id") ||
    source.getAttribute("data-product");

  if (fromData && fromData.trim().length > 0) {
    return fromData.trim();
  }

  if (!href) {
    return null;
  }

  const normalized = normalizeUrl(href);
  const match = normalized.match(/\/items\/(\d+)/);
  if (!match) {
    return null;
  }

  return match[1] ?? null;
}

function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.replace(/\s+/g, " ").trim();
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  try {
    return new URL(trimmed, BOOTH_BASE_URL).toString();
  } catch {
    try {
      return new URL(trimmed, ACCOUNTS_BASE_URL).toString();
    } catch {
      return trimmed;
    }
  }
}

function findItemLink(root: Element): HTMLAnchorElement | null {
  const links = queryAll<HTMLAnchorElement>(root, ITEM_LINK_SELECTORS);
  for (const link of links) {
    const href = normalizeUrl(link.getAttribute("href") ?? "");
    if (href.includes("/items/")) {
      return link;
    }
  }
  return null;
}

function extractTitle(root: Element, itemLink: HTMLAnchorElement | null): string {
  for (const selector of TITLE_SELECTORS) {
    const element = root.querySelector<HTMLElement>(selector);
    const text = normalizeText(element?.textContent);
    if (text.length > 0) {
      return text;
    }
  }

  const fromData = normalizeText(root.getAttribute("data-title"));
  if (fromData.length > 0) {
    return fromData;
  }

  return normalizeText(itemLink?.textContent);
}

function extractCreator(root: Element, itemLink: HTMLAnchorElement | null): string {
  for (const selector of CREATOR_SELECTORS) {
    const element = root.querySelector<HTMLElement>(selector);
    const text = normalizeText(element?.textContent);
    if (text.length > 0) {
      return text;
    }
  }

  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"));
  for (const link of links) {
    if (itemLink && link === itemLink) {
      continue;
    }

    const href = normalizeUrl(link.getAttribute("href") ?? "");
    const text = normalizeText(link.textContent);

    if (text.length === 0) {
      continue;
    }

    if (href.includes(".booth.pm") || href.includes("/shops/") || href.includes("booth.pm")) {
      return text;
    }
  }

  return "Unknown creator";
}

function extractThumbnail(root: Element): string {
  for (const selector of THUMBNAIL_SELECTORS) {
    const image = root.querySelector<HTMLImageElement>(selector);
    if (!image) {
      continue;
    }

    const src = image.getAttribute("src") ?? image.getAttribute("data-src") ?? "";
    const normalized = normalizeUrl(src);
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return "";
}

function extractDownloadUrls(root: Element): DownloadFile[] {
  const files: DownloadFile[] = [];

  // Primary: parse js-download-button elements (BOOTH library pattern)
  const downloadButtons = Array.from(root.querySelectorAll<HTMLElement>(".js-download-button"));
  for (const button of downloadButtons) {
    const isOtherDownloadsButton =
      button.classList.contains("w-full") ||
      button.getAttribute("data-test") === "other-downloads-button";

    if (isOtherDownloadsButton) {
      continue;
    }

    const href = button.getAttribute("data-href");
    // Find the filename from the sibling text-14 div within the same row container
    const rowContainer = button.closest(".mt-16, [class*='desktop:flex']");
    let fileName = normalizeText(button.getAttribute("data-label"));

    if (rowContainer) {
      const fileNameEl = rowContainer.querySelector<HTMLElement>(".text-14");
      const fileNameText = normalizeText(fileNameEl?.textContent);
      if (fileNameText.length > 0) {
        fileName = fileNameText;
      }
    }

    if (href) {
      files.push({
        name: fileName || "Download",
        url: href,
      });
    }
  }

  // Fallback: parse traditional <a> download links
  if (files.length === 0) {
    const links = dedupeElements(queryAll<HTMLAnchorElement>(root, DOWNLOAD_LINK_SELECTORS));
    for (const link of links) {
      const href = normalizeUrl(link.getAttribute("href") ?? link.getAttribute("data-download-url") ?? "");
      if (href.length === 0) {
        continue;
      }

      files.push({
        name: normalizeText(link.textContent) || "Download",
        url: href,
      });
    }
  }

  return dedupeDownloads(files);
}

function extractPurchasedAt(root: Element): string | undefined {
  const time = root.querySelector<HTMLTimeElement>("time[datetime], time");
  if (!time) {
    return undefined;
  }

  const datetime = normalizeText(time.getAttribute("datetime"));
  if (datetime.length > 0) {
    return datetime;
  }

  const text = normalizeText(time.textContent);
  return text.length > 0 ? text : undefined;
}

function getItemContainers(document: Document): Element[] {
  const isLikelyItemCard = (element: Element): boolean => {
    const hasItemLink = queryAll<HTMLAnchorElement>(element, ITEM_CARD_LINK_SELECTORS).length > 0;
    const hasThumbnail = element.querySelector(".l-library-item-thumbnail, img[src*='booth.pximg.net']") !== null;
    const hasDownloadButton = element.querySelector(".js-download-button") !== null;

    return hasItemLink && (hasThumbnail || hasDownloadButton);
  };

  for (const selector of ITEM_CONTAINER_SELECTORS) {
    const items = Array.from(document.querySelectorAll(selector)).filter(isLikelyItemCard);
    if (items.length > 0) {
      return dedupeElements(items);
    }
  }

  const scopes = queryAll<Element>(document, MAIN_AREA_SELECTORS);
  const containers: Element[] = [];
  for (const scope of scopes) {
    const links = queryAll<HTMLAnchorElement>(scope, ITEM_LINK_SELECTORS);
    for (const link of links) {
      const container =
        link.closest("div[class*='desktop:rounded-8'][class*='bg-white'][class*='p-16']") ||
        link.closest("article, li, section, div") ||
        link;
      containers.push(container);
    }
  }

  return dedupeElements(containers).filter(isLikelyItemCard);
}

function parsePageNumber(value: string): number | null {
  const match = value.match(/\d+/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[0], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function detectCurrentPage(document: Document): number {
  for (const selector of CURRENT_PAGE_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);
    const parsed = parsePageNumber(normalizeText(element?.textContent));
    if (parsed && parsed > 0) {
      return parsed;
    }
  }

  const currentFromAttribute = document.querySelector<HTMLElement>("[aria-current='page']")?.getAttribute("aria-label");
  const parsedFromAttribute = parsePageNumber(normalizeText(currentFromAttribute));
  if (parsedFromAttribute && parsedFromAttribute > 0) {
    return parsedFromAttribute;
  }

  return 1;
}

function detectTotalPages(document: Document): number | undefined {
  const pageCandidates = queryAll<HTMLAnchorElement>(document, [
    ".pagination a",
    ".pager a",
    "a[href*='?page=']",
  ]);

  let maxPage = 0;

  for (const candidate of pageCandidates) {
    const href = candidate.getAttribute("href") ?? "";
    const text = normalizeText(candidate.textContent);

    const textPage = parsePageNumber(text);
    if (textPage && textPage > maxPage) {
      maxPage = textPage;
    }

    const hrefMatch = href.match(/[?&]page=(\d+)/);
    if (hrefMatch && hrefMatch[1]) {
      const hrefPage = Number.parseInt(hrefMatch[1], 10);
      if (!Number.isNaN(hrefPage) && hrefPage > maxPage) {
        maxPage = hrefPage;
      }
    }
  }

  return maxPage > 0 ? maxPage : undefined;
}

function detectHasNextPage(document: Document, currentPage: number, totalPages?: number): boolean {
  for (const selector of NEXT_PAGE_SELECTORS) {
    const link = document.querySelector<HTMLAnchorElement>(selector);
    if (link && normalizeUrl(link.getAttribute("href") ?? "").length > 0) {
      return true;
    }
  }

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
  for (const link of links) {
    const text = normalizeText(link.textContent).toLowerCase();
    if (["next", "next page", "次", "次へ", ">", "›", "»"].includes(text)) {
      const className = (link.className ?? "").toString().toLowerCase();
      const ariaDisabled = link.getAttribute("aria-disabled") === "true";
      const disabled = className.includes("disabled") || ariaDisabled;
      if (!disabled) {
        return true;
      }
    }
  }

  if (typeof totalPages === "number") {
    return currentPage < totalPages;
  }

  return false;
}

function parseItem(container: Element, index: number): BoothItem | null {
  const itemLink = findItemLink(container);
  const href = itemLink?.getAttribute("href") ?? null;
  const boothUrl = href ? normalizeUrl(href) : "";
  const extractedId = extractItemId(container, href);

  if (!extractedId && boothUrl.length === 0) {
    return null;
  }

  const id = extractedId ?? `unknown-${index + 1}`;
  const title = extractTitle(container, itemLink) || "Untitled item";
  const creator = extractCreator(container, itemLink);
  const thumbnailUrl = extractThumbnail(container);
  const downloadUrls = extractDownloadUrls(container);
  const purchasedAt = extractPurchasedAt(container);

  const item: BoothItem = {
    id,
    title,
    creator,
    thumbnailUrl,
    boothUrl: boothUrl || `${BOOTH_BASE_URL}/items/${id}`,
    downloadUrls,
  };

  if (purchasedAt) {
    item.purchasedAt = purchasedAt;
  }

  return item;
}

export function parseLibraryPage(html: string): LibraryPage {
  const parser = new DOMParser();
  const document = parser.parseFromString(html ?? "", "text/html");

  const containers = getItemContainers(document);
  const seenIds = new Set<string>();
  const items: BoothItem[] = [];

  for (const [index, container] of containers.entries()) {
    const item = parseItem(container, index);
    if (!item || seenIds.has(item.id)) {
      continue;
    }

    seenIds.add(item.id);
    items.push(item);
  }

  const currentPage = detectCurrentPage(document);
  const totalPages = detectTotalPages(document);
  const hasNextPage = detectHasNextPage(document, currentPage, totalPages);

  if (typeof totalPages === "number") {
    return {
      items,
      currentPage,
      hasNextPage,
      totalPages,
    };
  }

  return {
    items,
    currentPage,
    hasNextPage,
  };
}
