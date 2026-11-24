// 환율 로딩/캐시/에러 상태를 관리하는 훅.

import { useCallback, useEffect, useState } from "react";

import { fetchRates, type Rates } from "../lib/exchangeRate";

export interface UseExchangeRateResult {
  rates: Rates | null;
  /** 환율 제공처가 이 환율을 갱신한 시각 (epoch ms). "○○ 기준" 표시에 써요. */
  updatedAt: number | null;
  /** 최신 환율을 받지 못해 저장된(만료된) 환율을 쓰고 있는지 여부 */
  stale: boolean;
  loading: boolean;
  /** 환율을 전혀 구하지 못했는지 여부 (저장된 환율도 없음) */
  error: boolean;
  reload: () => void;
}

export function useExchangeRate(): UseExchangeRateResult {
  const [rates, setRates] = useState<Rates | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 언마운트/재요청 이후의 늦은 응답이 상태를 덮어쓰지 않도록 가드해요.
  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchRates();
      if (!isActive()) {
        return;
      }
      setRates(result.rates);
      setUpdatedAt(result.updatedAt);
      setStale(result.stale);
    } catch {
      if (isActive()) {
        setError(true);
      }
    } finally {
      if (isActive()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    void load(() => active);
    return () => {
      active = false;
    };
  }, [load]);

  return { rates, updatedAt, stale, loading, error, reload: () => void load() };
}
