// 선택된 여행지(국가)를 탭들이 공유하기 위한 Provider.
//
// 국가 결정 규칙:
//  0) 진입 스킴(공유 링크 등)에 국가가 있으면 최우선으로 사용하고 저장
//  1) 저장된 수동 선택이 있으면 그대로 사용
//  2) 없으면 최초 1회 현재 위치(GPS)로 자동 감지
//  - 사용자가 직접 고르면 그 선택을 저장하고, 이후 자동 감지가 끼어들지 않아요.

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_COUNTRY_CODE, getCountry } from "../data/countries";
import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { getCountryFromEntry } from "../lib/entry";
import { detectCountryByGPS } from "../lib/geo";
import { CountryContext, type CountryContextValue } from "./CountryContext";

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCode] = useState(DEFAULT_COUNTRY_CODE);
  const [detecting, setDetecting] = useState(false);
  // 사용자가 수동 선택했는지(또는 저장된 수동 선택을 불러왔는지) 추적해 자동 감지가 덮어쓰지 않게 해요.
  const manualRef = useRef(false);

  const setCountryCode = useCallback((code: string) => {
    manualRef.current = true;
    setCode(code);
    void saveSelectedCountry(code);
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      // 0) 공유 링크 등 진입 스킴에 국가가 있으면 최우선으로 사용하고 저장해요.
      const fromEntry = getCountryFromEntry();
      if (fromEntry != null) {
        manualRef.current = true;
        setCode(fromEntry);
        void saveSelectedCountry(fromEntry);
        return;
      }

      // 1) 저장된 수동 선택이 있으면 그대로 사용
      const saved = await loadSelectedCountry();
      if (!active) {
        return;
      }
      if (saved != null && getCountry(saved).code === saved) {
        manualRef.current = true;
        setCode(saved);
        return;
      }

      // 2) 수동 선택이 없으면 현재 위치로 1회 자동 감지
      setDetecting(true);
      const detected = await detectCountryByGPS();
      if (!active) {
        return;
      }
      // 감지 도중 사용자가 직접 골랐다면 자동 결과로 덮어쓰지 않아요.
      if (detected != null && !manualRef.current) {
        setCode(detected);
      }
      setDetecting(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<CountryContextValue>(
    () => ({
      country: getCountry(countryCode),
      countryCode,
      setCountryCode,
      detecting,
    }),
    [countryCode, setCountryCode, detecting],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}
