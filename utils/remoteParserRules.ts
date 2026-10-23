import { browser } from "wxt/browser";
import {
  DEFAULT_PARSER_RULES,
  mergeParserRules,
  normalizeParserRulesFile,
  type ParserRules,
  type ParserRulesFile,
} from "./parserRules.ts";

export const PARSER_RULES_URL =
  "https://raw.githubusercontent.com/vrc-booth/booth-library-manager/main/rules/parser-rules.json";
export const FETCH_PARSER_RULES_MESSAGE = "booth-library-manager:fetch-parser-rules";

const PARSER_RULES_CACHE_KEY = "booth-library-parser-rules";
const RULES_TTL_MS = 24 * 60 * 60 * 1000;
const MIN_REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RULES_FILE_LENGTH = 64 * 1024;

export type ParserRulesResponse =
  | { ok: true; body: string }
  | { ok: false; error: string };

interface CachedParserRules {
  fetchedAt: number;
  rules: ParserRulesFile;
}

let activeRules: Promise<ParserRules> | null = null;
let activeRulesExpiresAt = 0;
let lastRemoteAttemptAt = 0;
let refreshInFlight: Promise<ParserRules | null> | null = null;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error";
}

export function isFetchParserRulesMessage(message: unknown): boolean {
  if (!message || typeof message !== "object") {
    return false;
  }
  return (message as Record<string, unknown>).type === FETCH_PARSER_RULES_MESSAGE;
}

function isParserRulesResponse(value: unknown): value is ParserRulesResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const raw = value as Record<string, unknown>;
  if (raw.ok === true) {
    return typeof raw.body === "string";
  }
  return raw.ok === false && typeof raw.error === "string";
}

/**
 * 백그라운드에서 실행한다. 고정된 URL만 받아오며, 응답은 문자열 그대로 돌려준다.
 */
export async function fetchRemoteParserRulesText(): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // raw.githubusercontent.com은 CORS 사전 요청(OPTIONS)을 403으로 거절한다.
    // 사전 요청이 생기지 않도록 커스텀 헤더 없는 단순 GET으로만 요청한다.
    const response = await fetch(PARSER_RULES_URL, {
      credentials: "omit",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch parser rules: ${response.status}`);
    }

    const body = await response.text();
    if (body.length > MAX_RULES_FILE_LENGTH) {
      throw new Error(`Parser rules file is too large: ${body.length} bytes`);
    }

    return body;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestRemoteRules(): Promise<ParserRulesFile> {
  lastRemoteAttemptAt = Date.now();

  const response: unknown = await browser.runtime.sendMessage({ type: FETCH_PARSER_RULES_MESSAGE });
  if (!isParserRulesResponse(response)) {
    throw new Error("Invalid parser rules response from background");
  }
  if (!response.ok) {
    throw new Error(response.error);
  }

  const rules = normalizeParserRulesFile(JSON.parse(response.body));
  if (!rules) {
    throw new Error("Remote parser rules have an unsupported format");
  }

  return rules;
}

async function readCachedRules(): Promise<CachedParserRules | null> {
  try {
    const result = await browser.storage.local.get(PARSER_RULES_CACHE_KEY);
    const raw = result[PARSER_RULES_CACHE_KEY];
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const cached = raw as Record<string, unknown>;
    const rules = normalizeParserRulesFile(cached.rules);
    if (typeof cached.fetchedAt !== "number" || !rules) {
      return null;
    }

    return { fetchedAt: cached.fetchedAt, rules };
  } catch (error) {
    console.warn("[booth-library-manager] Failed to read cached parser rules", error);
    return null;
  }
}

async function updateRemoteRules(): Promise<ParserRules> {
  const rules = await requestRemoteRules();
  const cached: CachedParserRules = { fetchedAt: Date.now(), rules };
  await browser.storage.local.set({ [PARSER_RULES_CACHE_KEY]: cached });
  return mergeParserRules(rules.selectors);
}

async function resolveParserRules(): Promise<ParserRules> {
  const cached = await readCachedRules();
  if (cached && Date.now() - cached.fetchedAt < RULES_TTL_MS) {
    return mergeParserRules(cached.rules.selectors);
  }

  try {
    return await updateRemoteRules();
  } catch (error) {
    console.warn(
      `[booth-library-manager] Failed to update parser rules, using ${cached ? "cached" : "built-in"} rules: ${getErrorMessage(error)}`,
    );
    return cached ? mergeParserRules(cached.rules.selectors) : DEFAULT_PARSER_RULES;
  }
}

/**
 * 원격 규칙(24시간 캐시) → 만료된 캐시 → 내장 기본값 순서로 파서 규칙을 고른다.
 */
export function getParserRules(): Promise<ParserRules> {
  const now = Date.now();
  if (!activeRules || now >= activeRulesExpiresAt) {
    activeRules = resolveParserRules();
    activeRulesExpiresAt = now + MIN_REFRESH_INTERVAL_MS;
  }
  return activeRules;
}

async function refreshRemoteRulesIfDue(): Promise<ParserRules | null> {
  const cached = await readCachedRules();
  const lastCheckedAt = Math.max(lastRemoteAttemptAt, cached?.fetchedAt ?? 0);
  if (Date.now() - lastCheckedAt < MIN_REFRESH_INTERVAL_MS) {
    return null;
  }

  try {
    const rules = await updateRemoteRules();
    activeRules = Promise.resolve(rules);
    activeRulesExpiresAt = Date.now() + MIN_REFRESH_INTERVAL_MS;
    return rules;
  } catch (error) {
    console.warn(`[booth-library-manager] Failed to refresh parser rules: ${getErrorMessage(error)}`);
    return null;
  }
}

/**
 * 캐시 만료와 상관없이 원격 규칙을 다시 받는다. 파싱 결과가 비었을 때 쓴다.
 * 최근 1시간 안에 받았거나 시도했다면 건너뛰고 null을 반환한다.
 */
export function refreshParserRules(): Promise<ParserRules | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshRemoteRulesIfDue().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
