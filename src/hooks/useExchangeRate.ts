// 환율 로딩/캐시/에러 상태를 관리하는 훅.

import { useCallback, useEffect, useState } from "react";

import { fetchRates, type Rates } from "../lib/exchangeRate";

interface UseExchangeRateResult {
  rates: Rates | null;
  fetchedAt: number | null;
  fromCache: boolean;
  loading: boolean;
  error: boolean;
  reload: () => void;
}

export function useExchangeRate(): UseExchangeRateResult {
  const [rates, setRates] = useState<Rates | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);
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
      setFetchedAt(result.fetchedAt);
      setFromCache(result.fromCache);
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

  return { rates, fetchedAt, fromCache, loading, error, reload: () => void load() };
}
