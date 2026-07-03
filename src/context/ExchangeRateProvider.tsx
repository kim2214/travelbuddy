// 환율을 한 번만 조회해 하위 컴포넌트에 공유하는 Provider.

import type { ReactNode } from "react";

import { useExchangeRate } from "../hooks/useExchangeRate";
import { ExchangeRateContext } from "./exchangeRateContext";

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const value = useExchangeRate();
  return (
    <ExchangeRateContext.Provider value={value}>{children}</ExchangeRateContext.Provider>
  );
}
