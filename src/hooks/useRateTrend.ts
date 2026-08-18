// 환율 추이(과거 샘플 + 오늘 실시간) 상태를 관리하는 훅.
// 과거 환율은 국가와 무관하게 한 번만 받아오고, 통화가 바뀌면 점만 다시 계산해요.

import { useEffect, useMemo, useState } from "react";

import { useExchangeRateContext } from "../context/exchangeRateContext";
import {
  buildTrendPoints,
  fetchRateHistory,
  summarizeTrend,
  type RateHistory,
  type TrendPoint,
  type TrendSummary,
} from "../lib/rateTrend";

export interface UseRateTrendResult {
  points: TrendPoint[];
  /** 점이 부족하면 null — 이때는 위젯을 숨겨요. */
  summary: TrendSummary | null;
  loading: boolean;
}

export function useRateTrend(currency: string, unitAmount: number): UseRateTrendResult {
  const { rates, loading: ratesLoading } = useExchangeRateContext();
  const [history, setHistory] = useState<RateHistory | null>(null);

  useEffect(() => {
    let active = true;
    void fetchRateHistory()
      .catch((): RateHistory => ({}))
      .then((loaded) => {
        if (active) {
          setHistory(loaded);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const currentPerKrw = rates?.[currency] ?? null;

  const points = useMemo<TrendPoint[]>(() => {
    if (history == null) {
      return [];
    }
    return buildTrendPoints(history, currency, unitAmount, currentPerKrw);
  }, [history, currency, unitAmount, currentPerKrw]);

  const summary = useMemo(() => summarizeTrend(points), [points]);

  return { points, summary, loading: history == null || (rates == null && ratesLoading) };
}
