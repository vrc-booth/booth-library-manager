export const PARSER_RULES_SCHEMA_VERSION = 1;

const MAX_SELECTORS_PER_KEY = 20;
const MAX_SELECTOR_LENGTH = 300;

export const PARSER_RULE_KEYS = [
  "itemContainer",
  "mainArea",
  "itemLink",
  "itemCardLink",
  "itemCardThumbnail",
  "itemCardFallbackContainer",
  "title",
  "creator",
  "thumbnail",
  "downloadButton",
  "otherDownloadsButton",
  "downloadRow",
  "downloadFileName",
  "downloadLink",
  "purchasedAt",
  "currentPage",
  "pageLink",
  "nextPage",
] as const;

export type ParserRuleKey = (typeof PARSER_RULE_KEYS)[number];

export type ParserRules = Record<ParserRuleKey, readonly string[]>;

export type ParserSelectorOverrides = Partial<Record<ParserRuleKey, string[]>>;

export interface ParserRulesFile {
  schemaVersion: number;
  selectors: ParserSelectorOverrides;
}

export const DEFAULT_PARSER_RULES: ParserRules = {
  itemContainer: [
    ".l-library-item",
    "[data-product-id]",
    ".library-item",
    "main > div.w-full > div[class*='bg-white'][class*='p-16']",
    "main div[class*='desktop:rounded-8'][class*='bg-white'][class*='p-16']",
  ],
  mainArea: ["main", "[role='main']", ".l-main", ".main-content", "#main"],
  itemLink: [
    "a[href*='://booth.pm/items/']",
    "a[href*='.booth.pm/items/']",
    "a[href*='booth.pm/items/']",
    "a[href^='/items/']",
    "a[href*='/items/']",
  ],
  itemCardLink: [
    "a[href*='/items/']",
    "a[href*='://booth.pm/items/']",
    "a[href*='://booth.pm/ko/items/']",
  ],
  itemCardThumbnail: [".l-library-item-thumbnail", "img[src*='booth.pximg.net']"],
  itemCardFallbackContainer: ["div[class*='desktop:rounded-8'][class*='bg-white'][class*='p-16']"],
  title: [
    ".text-text-default.font-bold.text-16.mb-8.break-all",
    ".text-text-default.font-bold.text-16.break-all",
    ".item-name",
    ".library-item-title",
    "h1",
    "h2",
    "h3",
    "h4",
    "[data-title]",
  ],
  creator: [
    ".text-14.text-text-gray600.break-all",
    ".shop-name",
    ".creator",
    ".item-creator",
    ".library-item-shop",
    "[data-shop-name]",
  ],
  thumbnail: ["img", "[data-thumbnail] img", ".thumbnail img", ".item-thumbnail img"],
  downloadButton: [".js-download-button"],
  otherDownloadsButton: [".w-full", "[data-test='other-downloads-button']"],
  downloadRow: [".mt-16", "[class*='desktop:flex']"],
  downloadFileName: [".text-14"],
  downloadLink: [
    "a[href*='/download/']",
    "a[href*='download']",
    "a[data-download-url]",
  ],
  purchasedAt: ["time[datetime]", "time"],
  currentPage: [
    "[aria-current='page']",
    ".pagination .current",
    ".pagination .is-current",
    ".pager .current",
  ],
  pageLink: [".pagination a", ".pager a", "a[href*='?page=']"],
  nextPage: [
    "a[rel='next']",
    ".pagination a.next",
    ".pager a.next",
    "a[aria-label*='Next']",
    "a[aria-label*='next']",
  ],
};

function isValidSelector(selector: string): boolean {
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch (error) {
    console.warn(`[booth-library-manager] Ignoring invalid parser selector: ${selector}`, error);
    return false;
  }
}

function normalizeSelectorList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const selectors = value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && entry.length <= MAX_SELECTOR_LENGTH)
    .filter(isValidSelector);

  return Array.from(new Set(selectors)).slice(0, MAX_SELECTORS_PER_KEY);
}

/**
 * 원격 규칙 파일을 검증한다. 셀렉터 문자열 목록 외의 값은 모두 버린다.
 * 지원하지 않는 schemaVersion이거나 형식이 틀리면 null을 반환한다.
 */
export function normalizeParserRulesFile(value: unknown): ParserRulesFile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion !== PARSER_RULES_SCHEMA_VERSION) {
    return null;
  }

  if (!raw.selectors || typeof raw.selectors !== "object") {
    return null;
  }

  const rawSelectors = raw.selectors as Record<string, unknown>;
  const selectors: ParserSelectorOverrides = {};

  for (const key of PARSER_RULE_KEYS) {
    const normalized = normalizeSelectorList(rawSelectors[key]);
    if (normalized.length > 0) {
      selectors[key] = normalized;
    }
  }

  return {
    schemaVersion: PARSER_RULES_SCHEMA_VERSION,
    selectors,
  };
}

/**
 * 원격 셀렉터를 내장 기본값 앞에 붙인다. 원격 셀렉터가 먼저 시도되고,
 * 맞는 요소가 없으면 내장 기본값으로 넘어간다.
 */
export function mergeParserRules(overrides: ParserSelectorOverrides): ParserRules {
  const merged = { ...DEFAULT_PARSER_RULES };

  for (const key of PARSER_RULE_KEYS) {
    const override = overrides[key];
    if (override && override.length > 0) {
      merged[key] = Array.from(new Set([...override, ...DEFAULT_PARSER_RULES[key]]));
    }
  }

  return merged;
}
