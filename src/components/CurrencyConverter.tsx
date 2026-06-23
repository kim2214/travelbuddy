// 1초 환율 계산기.
// 금액을 입력하면 KRW ↔ 현지 통화를 즉시 환산하고, 방향 전환 버튼을 제공해요.

import { Button, ProgressBar, TextField } from "@toss/tds-mobile";
import { adaptive, colors } from "@toss/tds-colors";
import { useMemo, useState } from "react";

import { useCountry } from "../context/CountryContext";
import { useExchangeRate } from "../hooks/useExchangeRate";
import {
  convert,
  fractionDigitsFor,
  formatAmount,
} from "../lib/exchangeRate";

type Direction = "foreignToKrw" | "krwToForeign";

function symbolOf(currency: string, country: { currencySymbol: string }) {
  return currency === "KRW" ? "₩" : country.currencySymbol;
}

// 통화별 자주 쓰는 금액 프리셋 (입력 통화 기준)
const AMOUNT_PRESETS: Record<string, number[]> = {
  KRW: [10000, 50000, 100000],
  JPY: [1000, 5000, 10000],
  THB: [100, 500, 1000],
  VND: [100000, 500000, 1000000],
  USD: [10, 50, 100],
  SGD: [10, 50, 100],
  EUR: [10, 50, 100],
};

function presetsFor(currency: string): number[] {
  return AMOUNT_PRESETS[currency] ?? [10, 50, 100];
}

export function CurrencyConverter() {
  const { country } = useCountry();
  const { rates, fetchedAt, fromCache, loading, error, reload } = useExchangeRate();
  const [direction, setDirection] = useState<Direction>("foreignToKrw");
  const [input, setInput] = useState("10000");

  const from = direction === "foreignToKrw" ? country.currency : "KRW";
  const to = direction === "foreignToKrw" ? "KRW" : country.currency;

  // 입력에서 숫자/소수점만 추출
  const numericInput = useMemo(() => {
    const cleaned = input.replace(/[^0-9.]/g, "");
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : 0;
  }, [input]);

  const result = useMemo(() => {
    if (rates == null) {
      return null;
    }
    return convert(numericInput, from, to, rates);
  }, [rates, numericInput, from, to]);

  // 1단위 기준 환율 (예: 1¥ = 9.1원)
  const unitRate = useMemo(() => {
    if (rates == null) {
      return null;
    }
    return convert(1, country.currency, "KRW", rates);
  }, [rates, country.currency]);

  const handleSwap = () => {
    setDirection((d) => (d === "foreignToKrw" ? "krwToForeign" : "foreignToKrw"));
  };

  const updatedLabel = (() => {
    if (loading) {
      return "환율 불러오는 중…";
    }
    if (error) {
      return "환율을 불러오지 못했어요. 다시 시도해 주세요.";
    }
    if (fetchedAt == null) {
      return "";
    }
    const time = new Date(fetchedAt).toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return fromCache ? `${time} 기준 (저장된 환율)` : `${time} 기준`;
  })();

  return (
    <div
      style={{
        margin: "0 24px",
        padding: 20,
        borderRadius: 20,
        backgroundColor: adaptive.grey50 ?? adaptive.greyBackground,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* 입력 (from 통화) */}
      <TextField
        variant="box"
        label={`${symbolOf(from, country)} ${from} (입력)`}
        labelOption="sustain"
        placeholder="금액을 입력해요"
        value={input}
        inputMode="decimal"
        format={{ transform: (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") }}
        onChange={(e) => setInput(e.target.value)}
      />

      {/* 빠른 금액 프리셋 */}
      <div style={{ display: "flex", gap: 8 }}>
        {presetsFor(from).map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() =>
              setInput((prev) => {
                const current = Number(prev.replace(/[^0-9.]/g, "")) || 0;
                return String(current + amount);
              })
            }
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 10,
              border: `1px solid ${adaptive.grey200}`,
              backgroundColor: colors.white,
              color: adaptive.grey700,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            +{amount.toLocaleString("ko-KR")}
          </button>
        ))}
      </div>

      {/* 방향 전환 */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button size="small" variant="weak" color="dark" onClick={handleSwap}>
          ⇅ 방향 바꾸기
        </Button>
      </div>

      {/* 결과 (to 통화) */}
      <div
        style={{
          padding: "16px 12px",
          borderRadius: 14,
          backgroundColor: colors.white,
          textAlign: "right",
        }}
      >
        <div style={{ fontSize: 13, color: adaptive.grey500, marginBottom: 4 }}>
          {symbolOf(to, country)} {to}
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, color: adaptive.grey800 }}>
          {result == null
            ? "—"
            : `${symbolOf(to, country)} ${formatAmount(
                Number(result.toFixed(fractionDigitsFor(to))),
                to,
              )}`}
        </div>
      </div>

      {/* 기준 환율 + 갱신 시각 */}
      <div style={{ fontSize: 12, color: adaptive.grey500, textAlign: "center" }}>
        {unitRate != null && (
          <div>
            1 {country.currencySymbol}
            {country.currency} = {formatAmount(Number(unitRate.toFixed(2)), "KRW")}원
          </div>
        )}
        <div
          style={{ marginTop: 2, color: error ? colors.red500 : adaptive.grey400 }}
          onClick={error ? reload : undefined}
        >
          {updatedLabel}
        </div>
      </div>

      {loading && <ProgressBar progress={0.4} size="light" animate />}
    </div>
  );
}
