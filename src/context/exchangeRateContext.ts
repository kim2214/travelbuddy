// 환율 상태를 화면 전체에서 공유하기 위한 Context.
// 여러 컴포넌트(계산기·물가 프리셋 등)가 각각 fetch하지 않고 한 번 받은 값을 함께 써요.

import { createContext, useContext } from "react";

import type { UseExchangeRateResult } from "../hooks/useExchangeRate";

export const ExchangeRateContext = createContext<UseExchangeRateResult | null>(null);

export function useExchangeRateContext(): UseExchangeRateResult {
  const ctx = useContext(ExchangeRateContext);
  if (ctx == null) {
    throw new Error("useExchangeRateContext must be used within an ExchangeRateProvider");
  }
  return ctx;
}
