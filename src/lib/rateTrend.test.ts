import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  HISTORY_DAYS_AGO,
  MIN_TREND_POINTS,
  buildTrendPoints,
  dateStringDaysAgo,
  fetchRateHistory,
  summarizeTrend,
  type RateHistory,
  type TrendPoint,
} from "./rateTrend";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

const NOW = 1_700_000_000_000;

/** 샘플 날짜 전체(옛날 → 최근 순)를 만들어요. */
function sampleDates(now = NOW): string[] {
  return HISTORY_DAYS_AGO.map((daysAgo) => dateStringDaysAgo(now, daysAgo));
}

beforeEach(() => {
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe("dateStringDaysAgo", () => {
  it("YYYY-MM-DD 형식을 반환한다", () => {
    expect(dateStringDaysAgo(NOW, 0)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("더 오래된 날짜가 문자열 비교로도 더 작다", () => {
    expect(dateStringDaysAgo(NOW, 30) < dateStringDaysAgo(NOW, 5)).toBe(true);
    expect(dateStringDaysAgo(NOW, 5) < dateStringDaysAgo(NOW, 0)).toBe(true);
  });
});

describe("fetchRateHistory", () => {
  it("샘플 날짜들을 받아 지원 통화만 대문자 키로 모은다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          krw: { jpy: 0.1, usd: 0.00075, btc: 0.0000001, bad: "oops" },
        }),
      ),
    );

    const history = await fetchRateHistory(NOW);

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(HISTORY_DAYS_AGO.length);
    for (const date of sampleDates()) {
      // 미지원 통화(btc)와 숫자가 아닌 값(bad)은 걸러져요.
      expect(history[date]).toEqual({ JPY: 0.1, USD: 0.00075 });
    }
    expect(setItem).toHaveBeenCalled();
  });

  it("캐시에 있는 날짜는 다시 요청하지 않는다", async () => {
    const cached: RateHistory = {};
    for (const date of sampleDates()) {
      cached[date] = { JPY: 0.11 };
    }
    getItem.mockResolvedValue(JSON.stringify(cached));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const history = await fetchRateHistory(NOW);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(history[sampleDates()[0]]).toEqual({ JPY: 0.11 });
  });

  it("일부 날짜를 못 받아도 나머지는 유지한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({}, false, 404))
        .mockResolvedValue(jsonResponse({ krw: { jpy: 0.1 } })),
    );

    const history = await fetchRateHistory(NOW);
    const dates = sampleDates();

    // 첫 요청(가장 오래된 날짜)만 실패하고 나머지는 성공해요.
    expect(history[dates[0]]).toBeUndefined();
    for (const date of dates.slice(1)) {
      expect(history[date]).toEqual({ JPY: 0.1 });
    }
  });

  it("저장할 때 오래된 캐시 날짜를 정리한다", async () => {
    const staleDate = dateStringDaysAgo(NOW, 60);
    getItem.mockResolvedValue(JSON.stringify({ [staleDate]: { JPY: 0.2 } }));
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ krw: { jpy: 0.1 } })),
    );

    await fetchRateHistory(NOW);

    const saved = JSON.parse(setItem.mock.calls[0][1] as string) as RateHistory;
    expect(saved[staleDate]).toBeUndefined();
    expect(saved[sampleDates()[0]]).toEqual({ JPY: 0.1 });
  });

  it("손상된 캐시는 빈 상태로 시작한다", async () => {
    getItem.mockResolvedValue("not-json{");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ krw: { jpy: 0.1 } })),
    );

    const history = await fetchRateHistory(NOW);
    expect(history[sampleDates()[0]]).toEqual({ JPY: 0.1 });
  });
});

describe("buildTrendPoints", () => {
  function historyOf(perKrw: number): RateHistory {
    const history: RateHistory = {};
    for (const date of sampleDates()) {
      history[date] = { JPY: perKrw };
    }
    return history;
  }

  it("과거 점(시간순) 뒤에 오늘 실시간 점을 붙인다", () => {
    // 과거: 1엔 = 10원(100엔 = 1,000원), 오늘: 100엔 = 800원
    const points = buildTrendPoints(historyOf(0.1), "JPY", 100, 0.125, NOW);

    expect(points).toHaveLength(HISTORY_DAYS_AGO.length + 1);
    expect(points[0].date).toBe(dateStringDaysAgo(NOW, 30));
    expect(points[0].krwPerUnit).toBeCloseTo(1000);
    const last = points[points.length - 1];
    expect(last.date).toBe(dateStringDaysAgo(NOW, 0));
    expect(last.krwPerUnit).toBeCloseTo(800);
  });

  it("실시간 환율이 없으면 과거 점만 만든다", () => {
    const points = buildTrendPoints(historyOf(0.1), "JPY", 100, null, NOW);
    expect(points).toHaveLength(HISTORY_DAYS_AGO.length);
  });

  it("값이 없는 날짜는 건너뛴다", () => {
    const history = historyOf(0.1);
    delete history[dateStringDaysAgo(NOW, 15)];
    const points = buildTrendPoints(history, "JPY", 100, 0.1, NOW);
    expect(points).toHaveLength(HISTORY_DAYS_AGO.length); // 5개 과거 + 오늘
  });
});

describe("summarizeTrend", () => {
  function pointsOf(values: number[]): TrendPoint[] {
    return values.map((krwPerUnit, index) => ({
      date: dateStringDaysAgo(NOW, values.length - 1 - index),
      krwPerUnit,
    }));
  }

  it("점이 부족하면 null을 반환한다", () => {
    expect(summarizeTrend(pointsOf(Array(MIN_TREND_POINTS - 1).fill(1000)))).toBeNull();
  });

  it("평균·오늘 값·차이 비율을 계산한다", () => {
    const summary = summarizeTrend(pointsOf([1000, 1000, 1000, 1000, 900]));
    expect(summary).not.toBeNull();
    expect(summary!.average).toBeCloseTo(980);
    expect(summary!.latest).toBe(900);
    expect(summary!.diffRatio).toBeCloseTo((900 - 980) / 980);
  });
});
