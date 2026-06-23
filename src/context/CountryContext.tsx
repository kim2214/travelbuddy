// 선택된 여행지(국가)를 두 탭('환율'/'체크리스트')이 공유하기 위한 경량 Context.

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_COUNTRY_CODE, getCountry, type Country } from "../data/countries";

interface CountryContextValue {
  country: Country;
  countryCode: string;
  setCountryCode: (code: string) => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);

  const value = useMemo<CountryContextValue>(
    () => ({
      country: getCountry(countryCode),
      countryCode,
      setCountryCode,
    }),
    [countryCode],
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
