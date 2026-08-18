// 국가별 출발일 상태를 관리하고 Storage에 동기화하는 훅.

import { useCallback, useEffect, useState } from "react";

import {
  clearDepartureDate,
  daysUntil,
  loadDepartureDate,
  parseDateString,
  saveDepartureDate,
} from "../lib/departureDate";

export interface UseDepartureDateResult {
  /** 출발일(YYYY-MM-DD). 미설정이면 null이에요. */
  date: string | null;
  /** 남은 일수 (0=오늘, 음수=지남). 미설정이면 null이에요. */
  dday: number | null;
  loading: boolean;
  setDate: (date: string) => void;
  clear: () => void;
}

export function useDepartureDate(countryCode: string): UseDepartureDateResult {
  const [date, setDateState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 국가가 바뀌면 해당 국가의 출발일을 로드해요.
  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadDepartureDate(countryCode).then((loaded) => {
      if (active) {
        setDateState(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [countryCode]);

  // 로드가 끝나기 전의 조작은 무시해요 — 곧 도착할 로드 결과가 덮어써 유실돼요.
  const setDate = useCallback(
    (next: string) => {
      if (loading || parseDateString(next) == null) {
        return;
      }
      setDateState(next);
      void saveDepartureDate(countryCode, next);
    },
    [countryCode, loading],
  );

  const clear = useCallback(() => {
    if (loading) {
      return;
    }
    setDateState(null);
    void clearDepartureDate(countryCode);
  }, [countryCode, loading]);

  const dday = date == null ? null : daysUntil(date);

  return { date, dday, loading, setDate, clear };
}
