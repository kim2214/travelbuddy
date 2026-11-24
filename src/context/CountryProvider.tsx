// 선택된 여행지(국가)를 탭들이 공유하기 위한 Provider.
//
// 국가 결정 규칙:
//  0) 진입 스킴(공유 링크 등)에 국가가 있으면 최우선으로 사용하고 저장
//  1) 저장된 선택이 있으면 그대로 사용
//  2) 없으면 기본 국가 (이때 needsCountryChoice=true로 첫 진입 힌트를 보여줘요)
//  - 현재 위치(GPS) 감지는 자동으로 하지 않아요. 앱을 열자마자 위치 권한 팝업이 뜨지 않도록
//    (앱인토스 출시 가이드: 기기 권한은 사용자 동의를 먼저 받아요) 사용자가
//    "현재 위치로 찾기"를 눌렀을 때만 detectByLocation으로 요청해요.
//  - 저장값 조회가 끝나기 전에 사용자가 먼저 여행지를 정하면, 뒤늦게 도착한 저장값이
//    그 선택을 덮어쓰지 않아요.

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

// 저장값 조회가 이 시간 안에 끝나지 않으면 기본 국가로 먼저 화면을 열어요.
// (Storage 브릿지가 응답하지 않아도 빈 화면에 머물지 않도록)
export const COUNTRY_LOAD_TIMEOUT_MS = 1000;

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCode] = useState(DEFAULT_COUNTRY_CODE);
  const [detecting, setDetecting] = useState(false);
  // 사용자가 여행지를 정했는지(직접 선택·현재 위치·저장값·진입 스킴) 여부
  const [chosen, setChosen] = useState(false);
  // 저장값 조회가 끝났는지 여부. 끝나기 전에는 힌트를 띄우지 않아요.
  const [loaded, setLoaded] = useState(false);
  // 화면을 그려도 되는지 여부. 조회가 끝났거나, 조회가 너무 오래 걸릴 때 true예요.
  const [ready, setReady] = useState(false);
  // 사용자가 이번 세션에 직접 여행지를 정했는지 여부 (늦게 도착한 저장값을 무시하기 위한 표시)
  const pickedByUserRef = useRef(false);

  const setCountryCode = useCallback((code: string) => {
    pickedByUserRef.current = true;
    setCode(code);
    setChosen(true);
    void saveSelectedCountry(code);
  }, []);

  const detectByLocation = useCallback(async (): Promise<string | null> => {
    setDetecting(true);
    try {
      const detected = await detectCountryByGPS();
      if (detected != null) {
        pickedByUserRef.current = true;
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
        setReady(true);
        void saveSelectedCountry(fromEntry);
        return;
      }

      const timer = setTimeout(() => {
        if (active) {
          setReady(true);
        }
      }, COUNTRY_LOAD_TIMEOUT_MS);

      // 1) 저장된 선택이 있으면 그대로 사용해요.
      const saved = await loadSelectedCountry();
      clearTimeout(timer);
      if (!active) {
        return;
      }
      // 조회 중에 사용자가 먼저 고른 여행지가 있으면 저장값으로 덮어쓰지 않아요.
      if (!pickedByUserRef.current && saved != null && getCountry(saved).code === saved) {
        setCode(saved);
        setChosen(true);
      }
      // 2) 없으면 기본 국가를 유지하고, 첫 진입 힌트를 보여줘요.
      setLoaded(true);
      setReady(true);
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
      ready,
    }),
    [countryCode, setCountryCode, detectByLocation, detecting, loaded, chosen, ready],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}
