// 국가 대표 도시의 날씨 상태를 관리하는 훅. 국가가 바뀌면 다시 로드해요.

import { useEffect, useState } from "react";

import { fetchWeather, type Weather } from "../lib/weather";

export interface UseWeatherResult {
  /** 실패(캐시도 없음)나 미지원 국가면 null — 이때는 위젯을 숨겨요. */
  weather: Weather | null;
  loading: boolean;
}

export function useWeather(countryCode: string): UseWeatherResult {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setWeather(null);
    void fetchWeather(countryCode)
      .catch((): Weather | null => null)
      .then((loaded) => {
        if (active) {
          setWeather(loaded);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [countryCode]);

  return { weather, loading };
}
