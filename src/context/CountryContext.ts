// 선택된 여행지(국가) Context와 소비 훅. (Provider는 CountryProvider.tsx)

import { createContext, useContext } from "react";

import type { Country } from "../data/countries";

export interface CountryContextValue {
  country: Country;
  countryCode: string;
  /** 사용자가 직접 국가를 고를 때 호출해요. 선택을 저장해요. */
  setCountryCode: (code: string) => void;
  /**
   * 사용자가 "현재 위치로 찾기"를 눌렀을 때 호출해요. (위치 권한은 이 시점에 요청돼요.)
   * 지원 국가를 찾으면 그 국가로 바꾸고 저장한 뒤 코드를 반환하고, 못 찾으면 null을 반환해요.
   */
  detectByLocation: () => Promise<string | null>;
  /** 현재 위치로 감지를 진행 중인지 여부 (UX 표시용) */
  detecting: boolean;
}

export const CountryContext = createContext<CountryContextValue | null>(null);

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (ctx == null) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return ctx;
}
