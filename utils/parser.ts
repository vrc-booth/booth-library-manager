import { type BoothItem, type DownloadFile, type LibraryPage } from "../types/booth.ts";
import { DEFAULT_PARSER_RULES, type ParserRules } from "./parserRules.ts";

const BOOTH_BASE_URL = "https://booth.pm";
const ACCOUNTS_BASE_URL = "https://accounts.booth.pm";

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

function queryFirst<T extends Element>(root: ParentNode, selectors: readonly string[]): T | null {
  for (const selector of selectors) {
    const element = root.querySelector<T>(selector);
    if (element) {
      return element;
    }
  }
  return null;
}

function hasAnyMatch(root: ParentNode, selectors: readonly string[]): boolean {
  return selectors.some((selector) => root.querySelector(selector) !== null);
}

function closestOf(element: Element, selectors: readonly string[]): Element | null {
  if (selectors.length === 0) {
    return null;
  }
  return element.closest(selectors.join(", "));
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

function findItemLink(root: Element, rules: ParserRules): HTMLAnchorElement | null {
  const links = queryAll<HTMLAnchorElement>(root, rules.itemLink);
  for (const link of links) {
    const href = normalizeUrl(link.getAttribute("href") ?? "");
    if (href.includes("/items/")) {
      return link;
    }
  }
  return null;
}

function extractTitle(root: Element, rules: ParserRules, itemLink: HTMLAnchorElement | null): string {
  for (const selector of rules.title) {
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

function extractCreator(root: Element, rules: ParserRules, itemLink: HTMLAnchorElement | null): string {
  for (const selector of rules.creator) {
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

function extractThumbnail(root: Element, rules: ParserRules): string {
  for (const selector of rules.thumbnail) {
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

function extractDownloadUrls(root: Element, rules: ParserRules): DownloadFile[] {
  const files: DownloadFile[] = [];

  // Primary: parse js-download-button elements (BOOTH library pattern)
  const downloadButtons = dedupeElements(queryAll<HTMLElement>(root, rules.downloadButton));
  for (const button of downloadButtons) {
    const isOtherDownloadsButton = rules.otherDownloadsButton.some((selector) => button.matches(selector));

    if (isOtherDownloadsButton) {
      continue;
    }

    const href = button.getAttribute("data-href");
    // Find the filename from the sibling text-14 div within the same row container
    const rowContainer = closestOf(button, rules.downloadRow);
    let fileName = normalizeText(button.getAttribute("data-label"));

    if (rowContainer) {
      for (const selector of rules.downloadFileName) {
        const fileNameText = normalizeText(rowContainer.querySelector<HTMLElement>(selector)?.textContent);
        if (fileNameText.length > 0) {
          fileName = fileNameText;
          break;
        }
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
    const links = dedupeElements(queryAll<HTMLAnchorElement>(root, rules.downloadLink));
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

function extractPurchasedAt(root: Element, rules: ParserRules): string | undefined {
  const time = queryFirst<HTMLElement>(root, rules.purchasedAt);
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

function getItemContainers(document: Document, rules: ParserRules): Element[] {
  const isLikelyItemCard = (element: Element): boolean => {
    const hasItemLink = hasAnyMatch(element, rules.itemCardLink);
    const hasThumbnail = hasAnyMatch(element, rules.itemCardThumbnail);
    const hasDownloadButton = hasAnyMatch(element, rules.downloadButton);

    return hasItemLink && (hasThumbnail || hasDownloadButton);
  };

  for (const selector of rules.itemContainer) {
    const items = Array.from(document.querySelectorAll(selector)).filter(isLikelyItemCard);
    if (items.length > 0) {
      return dedupeElements(items);
    }
  }

  const scopes = queryAll<Element>(document, rules.mainArea);
  const containers: Element[] = [];
  for (const scope of scopes) {
    const links = queryAll<HTMLAnchorElement>(scope, rules.itemLink);
    for (const link of links) {
      const container =
        closestOf(link, rules.itemCardFallbackContainer) ||
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

function detectCurrentPage(document: Document, rules: ParserRules): number {
  for (const selector of rules.currentPage) {
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

function detectTotalPages(document: Document, rules: ParserRules): number | undefined {
  const pageCandidates = queryAll<HTMLAnchorElement>(document, rules.pageLink);

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

function detectHasNextPage(
  document: Document,
  rules: ParserRules,
  currentPage: number,
  totalPages?: number,
): boolean {
  for (const selector of rules.nextPage) {
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

function parseItem(container: Element, rules: ParserRules, index: number): BoothItem | null {
  const itemLink = findItemLink(container, rules);
  const href = itemLink?.getAttribute("href") ?? null;
  const boothUrl = href ? normalizeUrl(href) : "";
  const extractedId = extractItemId(container, href);

  if (!extractedId && boothUrl.length === 0) {
    return null;
  }

  const id = extractedId ?? `unknown-${index + 1}`;
  const title = extractTitle(container, rules, itemLink) || "Untitled item";
  const creator = extractCreator(container, rules, itemLink);
  const thumbnailUrl = extractThumbnail(container, rules);
  const downloadUrls = extractDownloadUrls(container, rules);
  const purchasedAt = extractPurchasedAt(container, rules);

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

export function parseLibraryPage(html: string, rules: ParserRules = DEFAULT_PARSER_RULES): LibraryPage {
  const parser = new DOMParser();
  const document = parser.parseFromString(html ?? "", "text/html");

  const containers = getItemContainers(document, rules);
  const seenIds = new Set<string>();
  const items: BoothItem[] = [];

  for (const [index, container] of containers.entries()) {
    const item = parseItem(container, rules, index);
    if (!item || seenIds.has(item.id)) {
      continue;
    }

    seenIds.add(item.id);
    items.push(item);
  }

  const currentPage = detectCurrentPage(document, rules);
  const totalPages = detectTotalPages(document, rules);
  const hasNextPage = detectHasNextPage(document, rules, currentPage, totalPages);

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
