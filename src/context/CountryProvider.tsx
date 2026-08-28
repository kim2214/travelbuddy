// 선택된 여행지(국가)를 탭들이 공유하기 위한 Provider.
//
// 국가 결정 규칙:
//  0) 진입 스킴(공유 링크 등)에 국가가 있으면 최우선으로 사용하고 저장
//  1) 저장된 선택이 있으면 그대로 사용
//  2) 없으면 기본 국가 (이때 needsCountryChoice=true로 첫 진입 힌트를 보여줘요)
//  - 현재 위치(GPS) 감지는 자동으로 하지 않아요. 앱을 열자마자 위치 권한 팝업이 뜨지 않도록
//    (앱인토스 출시 가이드: 기기 권한은 사용자 동의를 먼저 받아요) 사용자가
//    "현재 위치로 찾기"를 눌렀을 때만 detectByLocation으로 요청해요.

import {
  useCallback,
  useEffect,
  useMemo,
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
  // 사용자가 여행지를 정했는지(직접 선택·현재 위치·저장값·진입 스킴) 여부
  const [chosen, setChosen] = useState(false);
  // 저장값 조회가 끝났는지 여부. 끝나기 전에는 힌트를 띄우지 않아요.
  const [loaded, setLoaded] = useState(false);

  const setCountryCode = useCallback((code: string) => {
    setCode(code);
    setChosen(true);
    void saveSelectedCountry(code);
  }, []);

  const detectByLocation = useCallback(async (): Promise<string | null> => {
    setDetecting(true);
    try {
      const detected = await detectCountryByGPS();
      if (detected != null) {
        setCode(detected);
        setChosen(true);
        void saveSelectedCountry(detected);
      }
      return detected;
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      // 0) 공유 링크 등 진입 스킴에 국가가 있으면 최우선으로 사용하고 저장해요.
      const fromEntry = getCountryFromEntry();
      if (fromEntry != null) {
        setCode(fromEntry);
        setChosen(true);
        setLoaded(true);
        void saveSelectedCountry(fromEntry);
        return;
      }

      // 1) 저장된 선택이 있으면 그대로 사용해요.
      const saved = await loadSelectedCountry();
      if (!active) {
        return;
      }
      if (saved != null && getCountry(saved).code === saved) {
        setCode(saved);
        setChosen(true);
      }
      // 2) 없으면 기본 국가를 유지하고, 첫 진입 힌트를 보여줘요.
      setLoaded(true);
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
      detectByLocation,
      detecting,
      needsCountryChoice: loaded && !chosen,
    }),
    [countryCode, setCountryCode, detectByLocation, detecting, loaded, chosen],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}
