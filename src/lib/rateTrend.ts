// 환율 추이(최근 30일) 데이터.
// fawazahmed0 currency-api(무료·무키)의 날짜 고정 URL로 과거 KRW 기준 환율을 샘플링해요.
// 날짜별 응답은 불변이라 Storage에 캐시하고, 오래된 날짜는 저장 시점에 정리해요.

import { Storage } from "@apps-in-toss/web-framework";

import { COUNTRIES } from "../data/countries";
import { fetchWithTimeout } from "./fetchWithTimeout";

/** 과거 샘플 지점(며칠 전). 오늘(실시간 환율)을 더해 총 7개 점으로 추이를 그려요. */
export const HISTORY_DAYS_AGO = [30, 25, 20, 15, 10, 5] as const;

/** 추이를 보여주기 위한 최소 점 개수. 못 채우면 위젯을 숨겨요. */
export const MIN_TREND_POINTS = 5;

const SUPPORTED_CURRENCIES = new Set(COUNTRIES.map((c) => c.currency));
const CACHE_KEY = "rates_history_v1";
// 샘플 최대 범위(30일)보다 여유 있게 두고, 그보다 오래된 캐시는 정리해요.
const MAX_CACHE_AGE_DAYS = 35;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 특정 날짜의 환율 (통화 코드 → 1 KRW당 값) */
type DailyRates = Record<string, number>;

/** 날짜(YYYY-MM-DD) → 그날의 환율 */
export type RateHistory = Record<string, DailyRates>;

export interface TrendPoint {
  /** YYYY-MM-DD */
  date: string;
  /** 표시 단위(unitAmount)당 원화 금액. 예: 100엔 = 919원 */
  krwPerUnit: number;
}

export interface TrendSummary {
  /** 전체 기간 평균 (krwPerUnit) */
  average: number;
  /** 마지막 점(오늘) 값 (krwPerUnit) */
  latest: number;
  /** (latest - average) / average. 음수면 평균보다 낮아요(원화 강세). */
  diffRatio: number;
}

/** now 기준 daysAgo일 전의 로컬 날짜를 YYYY-MM-DD로 반환해요. */
export function dateStringDaysAgo(now: number, daysAgo: number): string {
  const d = new Date(now - daysAgo * DAY_MS);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function historyUrlFor(date: string): string {
  return `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/krw.json`;
}

async function readCache(): Promise<RateHistory> {
  try {
    const raw = await Storage.getItem(CACHE_KEY);
    if (raw == null) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== "object") {
      return {};
    }
    // 손상된 항목(숫자 아님)은 걸러내요.
    const history: RateHistory = {};
    for (const [date, rates] of Object.entries(parsed as Record<string, unknown>)) {
      if (rates == null || typeof rates !== "object") {
        continue;
      }
      const daily: DailyRates = {};
      for (const [code, value] of Object.entries(rates as Record<string, unknown>)) {
        if (typeof value === "number" && Number.isFinite(value) && value > 0) {
          daily[code] = value;
        }
      }
      if (Object.keys(daily).length > 0) {
        history[date] = daily;
      }
    }
    return history;
  } catch {
    return {};
  }
}

async function writeCache(history: RateHistory, now: number): Promise<void> {
  try {
    // ISO 날짜는 문자열 비교가 시간 순서와 같아서, 기준일보다 작은 키를 정리해요.
    const oldest = dateStringDaysAgo(now, MAX_CACHE_AGE_DAYS);
    const pruned: RateHistory = {};
    for (const [date, rates] of Object.entries(history)) {
      if (date >= oldest) {
        pruned[date] = rates;
      }
    }
    await Storage.setItem(CACHE_KEY, JSON.stringify(pruned));
  } catch {
    // 저장 실패는 치명적이지 않으므로 무시해요.
  }
}

/** 하루치 환율을 받아 지원 통화만 대문자 키로 추려요. 실패 시 null이에요. */
async function fetchDay(date: string): Promise<DailyRates | null> {
  try {
    const res = await fetchWithTimeout(historyUrlFor(date));
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as { krw?: unknown };
    if (data.krw == null || typeof data.krw !== "object") {
      return null;
    }
    const daily: DailyRates = {};
    for (const [code, value] of Object.entries(data.krw as Record<string, unknown>)) {
      const upper = code.toUpperCase();
      if (
        SUPPORTED_CURRENCIES.has(upper) &&
        typeof value === "number" &&
        Number.isFinite(value) &&
        value > 0
      ) {
        daily[upper] = value;
      }
    }
    return Object.keys(daily).length > 0 ? daily : null;
  } catch {
    return null;
  }
}

/**
 * 샘플 날짜들의 과거 환율을 가져와요. 캐시에 있는 날짜는 재요청하지 않고,
 * 받아오지 못한 날짜는 건너뛰어요(부분 성공 허용). 모든 통화가 한 응답에 담겨 있어
 * 국가와 무관하게 한 번만 호출하면 돼요.
 */
export async function fetchRateHistory(now: number = Date.now()): Promise<RateHistory> {
  const cache = await readCache();
  const dates = HISTORY_DAYS_AGO.map((daysAgo) => dateStringDaysAgo(now, daysAgo));
  const missing = dates.filter((date) => cache[date] == null);

  if (missing.length > 0) {
    const fetched = await Promise.all(missing.map(fetchDay));
    let updated = false;
    missing.forEach((date, index) => {
      const daily = fetched[index];
      if (daily != null) {
        cache[date] = daily;
        updated = true;
      }
    });
    if (updated) {
      await writeCache(cache, now);
    }
  }

  return cache;
}

/**
 * 특정 통화의 추이 점들을 시간순으로 만들어요.
 * 과거 점은 history에서, 마지막 점(오늘)은 실시간 환율(currentPerKrw)에서 가져와요.
 * 값이 없는 날짜는 건너뛰어요.
 */
export function buildTrendPoints(
  history: RateHistory,
  currency: string,
  unitAmount: number,
  currentPerKrw: number | null,
  now: number = Date.now(),
): TrendPoint[] {
  const points: TrendPoint[] = [];
  // HISTORY_DAYS_AGO가 내림차순(옛날 → 최근)이라 그대로 시간순이에요.
  for (const daysAgo of HISTORY_DAYS_AGO) {
    const date = dateStringDaysAgo(now, daysAgo);
    const perKrw = history[date]?.[currency];
    if (perKrw != null && perKrw > 0) {
      points.push({ date, krwPerUnit: unitAmount / perKrw });
    }
  }
  if (currentPerKrw != null && currentPerKrw > 0) {
    points.push({ date: dateStringDaysAgo(now, 0), krwPerUnit: unitAmount / currentPerKrw });
  }
  return points;
}

/** 추이 요약(평균·오늘·차이 비율)을 계산해요. 점이 부족하면 null이에요. */
export function summarizeTrend(points: TrendPoint[]): TrendSummary | null {
  if (points.length < MIN_TREND_POINTS) {
    return null;
  }
  const sum = points.reduce((acc, p) => acc + p.krwPerUnit, 0);
  const average = sum / points.length;
  if (average <= 0) {
    return null;
  }
  const latest = points[points.length - 1].krwPerUnit;
  return { average, latest, diffRatio: (latest - average) / average };
}
