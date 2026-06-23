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

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchRates();
      setRates(result.rates);
      setFetchedAt(result.fetchedAt);
      setFromCache(result.fromCache);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { rates, fetchedAt, fromCache, loading, error, reload: () => void load() };
}
