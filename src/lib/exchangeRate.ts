// 환율 조회/캐시/환산 유틸.
// 무료·무키 API(open.er-api.com)에서 KRW 기준 환율을 받아오고, Storage에 캐시해요.
// 네트워크 실패 시 마지막 캐시로 폴백해요.

import { Storage } from "@apps-in-toss/web-framework";

import { COUNTRIES } from "../data/countries";
import { fetchWithTimeout } from "./fetchWithTimeout";

// 통화별 표시 소수 자릿수. 국가 데이터에서 파생하고, KRW는 0으로 둬요.
const CURRENCY_FRACTION_DIGITS: Record<string, number> = {
  KRW: 0,
  ...Object.fromEntries(COUNTRIES.map((c) => [c.currency, c.fractionDigits])),
};

// 주 소스: open.er-api.com (무료·무키). KRW 기준 환율.
const PRIMARY_URL = "https://open.er-api.com/v6/latest/KRW";
// 보조 소스: fawazahmed0 currency-api (무료·무키, jsDelivr 호스팅).
// 우리가 쓰는 모든 통화(VND·TWD 포함)를 커버하고, 값 의미가 주 소스와 같아요(1 KRW당 각 통화).
const SECONDARY_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/krw.json";
const CACHE_KEY = "rates_cache_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

/** KRW 1단위당 각 통화 환율. 예: rates.JPY = 1원당 엔 */
export type Rates = Record<string, number>;

export interface RatesResult {
  rates: Rates;
  /** 우리가 환율을 받아온 시각 (epoch ms). 캐시 신선도 판단에 써요. */
  fetchedAt: number;
  /**
   * 환율 제공처가 이 환율을 갱신한 시각 (epoch ms). 화면의 "○○ 기준" 표시에 써요.
   * 제공처는 하루 한 번 정도만 갱신하므로 fetchedAt보다 한참 이전일 수 있어요.
   */
  updatedAt: number;
  /** 캐시에서 가져온 값인지 여부 */
  fromCache: boolean;
  /** 최신 환율을 받지 못해 만료된 캐시로 폴백했는지 여부 (재시도 안내용) */
  stale: boolean;
}

interface CachePayload {
  rates: Rates;
  fetchedAt: number;
  updatedAt: number;
}

interface FetchedRates {
  rates: Rates;
  /** 제공처가 알려준 갱신 시각 (epoch ms). 알 수 없으면 null이에요. */
  updatedAt: number | null;
}

/** 제공처 갱신 시각이 쓸 만한 값인지 확인해요. 미래 시각은 믿지 않아요. */
function sanitizeUpdatedAt(value: unknown, now: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > now) {
    return null;
  }
  return value;
}

/** 값이 모두 유한한 숫자인 Rates 형태인지 런타임 검증해요. */
function isValidRates(value: unknown): value is Rates {
  if (value == null || typeof value !== "object") {
    return false;
  }
  const entries = Object.values(value as Record<string, unknown>);
  return entries.length > 0 && entries.every((v) => typeof v === "number" && Number.isFinite(v));
}

async function readCache(): Promise<CachePayload | null> {
  try {
    const raw = await Storage.getItem(CACHE_KEY);
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CachePayload>;
    if (isValidRates(parsed.rates) && typeof parsed.fetchedAt === "number") {
      return {
        rates: parsed.rates,
        fetchedAt: parsed.fetchedAt,
        // 구버전 캐시(updatedAt 없음)는 받아온 시각으로 대신해요.
        updatedAt:
          typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
            ? parsed.updatedAt
            : parsed.fetchedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function writeCache(payload: CachePayload): Promise<void> {
  try {
    await Storage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // 저장 실패는 치명적이지 않으므로 무시해요.
  }
}

/** 주 소스(open.er-api.com)에서 환율을 받아 검증해요. */
async function fetchPrimary(): Promise<FetchedRates> {
  const res = await fetchWithTimeout(PRIMARY_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    result?: string;
    rates?: unknown;
    time_last_update_unix?: unknown;
  };
  if (data.result !== "success" || !isValidRates(data.rates)) {
    throw new Error("invalid primary response");
  }
  // time_last_update_unix는 초 단위예요.
  const updatedAt =
    typeof data.time_last_update_unix === "number" ? data.time_last_update_unix * 1000 : null;
  return { rates: data.rates, updatedAt };
}

/**
 * 보조 소스(fawazahmed0 currency-api)에서 환율을 받아 우리 형식으로 정규화해요.
 * 응답은 `{ date: "2024-01-01", krw: { usd: 0.0007, jpy: 0.1, ... } }`처럼 소문자 키라
 * 대문자로 바꿔요. 갱신 시각은 날짜(UTC 자정)까지만 알 수 있어요.
 */
async function fetchSecondary(): Promise<FetchedRates> {
  const res = await fetchWithTimeout(SECONDARY_URL);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as { date?: unknown; krw?: unknown };
  if (data.krw == null || typeof data.krw !== "object") {
    throw new Error("invalid secondary response");
  }
  const rates: Rates = {};
  for (const [code, value] of Object.entries(data.krw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      rates[code.toUpperCase()] = value;
    }
  }
  if (!isValidRates(rates)) {
    throw new Error("invalid secondary rates");
  }
  const parsedDate =
    typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date)
      ? Date.parse(data.date)
      : NaN;
  return { rates, updatedAt: Number.isFinite(parsedDate) ? parsedDate : null };
}

/**
 * 환율을 가져와요.
 * 1) 유효한(6시간 이내) 캐시가 있으면 그대로 사용
 * 2) 없으면 주 소스 호출 → 실패 시 보조 소스로 폴백 → 성공 시 캐시 갱신
 * 3) 두 소스 모두 실패하면 오래된 캐시라도 폴백 사용 (stale=true)
 */
export async function fetchRates(now: number = Date.now()): Promise<RatesResult> {
  const cached = await readCache();
  if (cached != null) {
    const age = now - cached.fetchedAt;
    // age가 음수면(기기 시계 역행 등) 신선하다고 오판하지 않고 새로 받아요.
    if (age >= 0 && age < CACHE_TTL_MS) {
      return { ...cached, fromCache: true, stale: false };
    }
  }

  try {
    let fetched: FetchedRates;
    try {
      fetched = await fetchPrimary();
    } catch {
      // 주 소스 실패 → 보조 소스로 한 번 더 시도해요.
      fetched = await fetchSecondary();
    }
    const payload: CachePayload = {
      rates: fetched.rates,
      fetchedAt: now,
      // 제공처가 갱신 시각을 주지 않으면 받아온 시각으로 대신해요.
      updatedAt: sanitizeUpdatedAt(fetched.updatedAt, now) ?? now,
    };
    await writeCache(payload);
    return { ...payload, fromCache: false, stale: false };
  } catch (error) {
    if (cached != null) {
      // 두 소스 모두 실패 → 만료됐더라도 마지막 캐시로 폴백
      return { ...cached, fromCache: true, stale: true };
    }
    throw error;
  }
}

/**
 * from 통화 amount를 to 통화로 환산해요.
 * rates는 KRW 기준(rates[X] = 1 KRW당 X)이에요.
 * 같은 통화는 그대로, 변환 불가 시 null을 반환해요.
 */
export function convert(
  amount: number,
  from: string,
  to: string,
  rates: Rates,
): number | null {
  if (!Number.isFinite(amount)) {
    return null;
  }
  if (from === to) {
    return amount;
  }
  const krwPerFrom = from === "KRW" ? 1 : rates[from];
  const krwPerTo = to === "KRW" ? 1 : rates[to];
  if (krwPerFrom == null || krwPerTo == null || krwPerFrom === 0) {
    return null;
  }
  // amount(from) -> KRW -> to
  const krw = amount / krwPerFrom;
  return krw * krwPerTo;
}

/** 통화별 표시 소수 자릿수. 국가 데이터 기반이며, 미지원 통화는 2자리로 처리해요. */
export function fractionDigitsFor(currency: string): number {
  return CURRENCY_FRACTION_DIGITS[currency] ?? 2;
}

// 기준 환율을 보여줄 때 쓰는 통화별 '보기 편한 단위'.
// 엔·동·루피아처럼 1단위 값이 너무 작은 통화는 큰 단위로 봐야 환산 감이 와요.
// (예: 1엔=9원 → 100엔=919원, 1동=0.06원 → 1,000동=57원)
const RATE_DISPLAY_UNIT: Record<string, number> = {
  JPY: 100,
  VND: 1000,
  IDR: 1000,
};

/** 기준 환율 표시에 쓰는 통화별 단위. 지정하지 않은 통화는 1이에요. */
export function rateDisplayUnitFor(currency: string): number {
  return RATE_DISPLAY_UNIT[currency] ?? 1;
}

/** 환산 결과를 통화에 맞춰 천 단위 콤마 + 소수 자릿수로 포맷해요. */
export function formatAmount(value: number, currency: string): string {
  const digits = fractionDigitsFor(currency);
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
