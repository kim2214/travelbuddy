// 선택된 여행지(국가)를 두 탭('환율'/'체크리스트')이 공유하기 위한 경량 Context.
//
// 국가 결정 규칙 (#1):
//  1) 저장된 수동 선택이 있으면 그걸 사용 (수동 우선, 자동 감지로 덮어쓰지 않음)
//  2) 없으면 최초 1회 현재 위치(GPS)로 자동 감지해 기본 국가를 설정
//  - 사용자가 직접 고르면 그 선택을 저장하고, 이후 자동 감지가 끼어들지 않아요.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { DEFAULT_COUNTRY_CODE, getCountry, type Country } from "../data/countries";
import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { detectCountryByGPS } from "../lib/geo";

interface CountryContextValue {
  country: Country;
  countryCode: string;
  /** 사용자가 직접 국가를 고를 때 호출해요. 선택을 저장하고 자동 감지보다 우선해요. */
  setCountryCode: (code: string) => void;
  /** 현재 위치로 자동 감지를 진행 중인지 여부 (UX 표시용) */
  detecting: boolean;
}

const CountryContext = createContext<CountryContextValue | null>(null);

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

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (ctx == null) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return ctx;
}
