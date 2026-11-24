// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/rateTrend", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/rateTrend")>()),
  fetchRateHistory: vi.fn(),
}));

import { ExchangeRateContext } from "../context/exchangeRateContext";
import {
  fetchRateHistory,
  HISTORY_SAMPLE_COUNT,
  historySampleDates,
  type RateHistory,
} from "../lib/rateTrend";
import type { UseExchangeRateResult } from "./useExchangeRate";
import { useRateTrend } from "./useRateTrend";

const fetchMock = vi.mocked(fetchRateHistory);

/** 모든 샘플 날짜에 같은 환율이 있는 과거 데이터예요. (1원당 0.1엔 → 100엔 = 1,000원) */
function historyOf(rates: Record<string, number>): RateHistory {
  return Object.fromEntries(historySampleDates(Date.now()).map((date) => [date, rates]));
}

function wrapperWith(value: Partial<UseExchangeRateResult>) {
  const ctx: UseExchangeRateResult = {
    rates: null,
    updatedAt: null,
    stale: false,
    loading: false,
    error: false,
    reload: () => {},
    ...value,
  };
  return ({ children }: { children: ReactNode }) => (
    <ExchangeRateContext.Provider value={ctx}>{children}</ExchangeRateContext.Provider>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("useRateTrend", () => {
  it("과거 환율에 오늘 환율을 마지막 점으로 붙인다", async () => {
    fetchMock.mockResolvedValue(historyOf({ JPY: 0.1 }));
    const { result } = renderHook(() => useRateTrend("JPY", 100), {
      // 오늘은 1원당 0.125엔 → 100엔 = 800원
      wrapper: wrapperWith({ rates: { JPY: 0.125 } }),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.points).toHaveLength(HISTORY_SAMPLE_COUNT + 1);
    expect(result.current.points[0].krwPerUnit).toBeCloseTo(1000);
    expect(result.current.points[HISTORY_SAMPLE_COUNT].krwPerUnit).toBeCloseTo(800);
    expect(result.current.summary?.latest).toBeCloseTo(800);
    // 오늘 값이 평균보다 낮아요.
    expect(result.current.summary?.diffRatio).toBeLessThan(0);
  });

  it("과거 환율을 받지 못하면 요약 없이 로딩을 끝낸다", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useRateTrend("JPY", 100), {
      wrapper: wrapperWith({ rates: { JPY: 0.125 } }),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    // 오늘 점 하나뿐이라 추이를 요약할 수 없어요.
    expect(result.current.points).toHaveLength(1);
    expect(result.current.summary).toBeNull();
  });

  it("오늘 환율을 아직 불러오는 중이면 로딩 상태를 유지한다", async () => {
    fetchMock.mockResolvedValue(historyOf({ JPY: 0.1 }));
    const { result } = renderHook(() => useRateTrend("JPY", 100), {
      wrapper: wrapperWith({ rates: null, loading: true }),
    });

    await waitFor(() => expect(result.current.points).toHaveLength(HISTORY_SAMPLE_COUNT));
    expect(result.current.loading).toBe(true);
  });

  it("통화가 바뀌면 과거 환율을 다시 받지 않고 점만 다시 계산한다", async () => {
    fetchMock.mockResolvedValue(historyOf({ JPY: 0.1, USD: 0.001 }));
    const { result, rerender } = renderHook(
      ({ currency, unit }) => useRateTrend(currency, unit),
      {
        initialProps: { currency: "JPY", unit: 100 },
        wrapper: wrapperWith({ rates: { JPY: 0.1, USD: 0.001 } }),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({ currency: "USD", unit: 1 });

    expect(result.current.points[0].krwPerUnit).toBeCloseTo(1000);
    expect(result.current.points).toHaveLength(HISTORY_SAMPLE_COUNT + 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
