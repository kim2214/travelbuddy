// 환율 조회/캐시/환산 유틸.
// 무료·무키 API(open.er-api.com)에서 KRW 기준 환율을 받아오고, Storage에 캐시해요.
// 네트워크 실패 시 마지막 캐시로 폴백해요.

import { Storage } from "@apps-in-toss/web-framework";

const API_URL = "https://open.er-api.com/v6/latest/KRW";
const CACHE_KEY = "rates_cache_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간

/** KRW 1단위당 각 통화 환율. 예: rates.JPY = 1원당 엔 */
export type Rates = Record<string, number>;

export interface RatesResult {
  rates: Rates;
  /** epoch ms */
  fetchedAt: number;
  /** 캐시(오프라인 폴백)에서 가져온 값인지 여부 */
  fromCache: boolean;
}

interface CachePayload {
  rates: Rates;
  fetchedAt: number;
}

async function readCache(): Promise<CachePayload | null> {
  try {
    const raw = await Storage.getItem(CACHE_KEY);
    if (raw == null) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachePayload;
    if (parsed && parsed.rates && typeof parsed.fetchedAt === "number") {
      return parsed;
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

/**
 * 환율을 가져와요.
 * 1) 유효한(6시간 이내) 캐시가 있으면 그대로 사용
 * 2) 없으면 API 호출 → 성공 시 캐시 갱신
 * 3) API 실패 시 오래된 캐시라도 폴백 사용
 */
export async function fetchRates(now: number = Date.now()): Promise<RatesResult> {
  const cached = await readCache();
  if (cached != null && now - cached.fetchedAt < CACHE_TTL_MS) {
    return { rates: cached.rates, fetchedAt: cached.fetchedAt, fromCache: true };
  }

  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as { result?: string; rates?: Rates };
    if (data.result !== "success" || data.rates == null) {
      throw new Error("invalid response");
    }
    const fetchedAt = now;
    await writeCache({ rates: data.rates, fetchedAt });
    return { rates: data.rates, fetchedAt, fromCache: false };
  } catch (error) {
    if (cached != null) {
      // 만료됐더라도 마지막 캐시로 폴백
      return { rates: cached.rates, fetchedAt: cached.fetchedAt, fromCache: true };
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

/** 통화별 표시 소수 자릿수 (JPY/VND 등 소수 없는 통화 처리) */
export function fractionDigitsFor(currency: string): number {
  return ["JPY", "VND", "KRW"].includes(currency) ? 0 : 2;
}

/** 환산 결과를 통화에 맞춰 천 단위 콤마 + 소수 자릿수로 포맷해요. */
export function formatAmount(value: number, currency: string): string {
  const digits = fractionDigitsFor(currency);
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
