// 1초 환율 계산기.
// 금액을 입력하면 KRW ↔ 현지 통화를 즉시 환산하고, 방향 전환 버튼을 제공해요.

import { Button, Loader, Skeleton, Text, TextButton, TextField } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useMemo, useState, type CSSProperties } from "react";

import { amountInputFormat } from "../lib/amountFormat";
import { logEvent } from "../lib/analytics";
import { useCountry } from "../context/CountryContext";
import { useExchangeRateContext } from "../context/exchangeRateContext";
import {
  convert,
  fractionDigitsFor,
  formatAmount,
  rateDisplayUnitFor,
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
  TWD: [100, 500, 1000],
  PHP: [100, 500, 1000],
  EUR: [10, 50, 100],
  GBP: [10, 50, 100],
  CNY: [50, 100, 500],
  HKD: [100, 500, 1000],
  AUD: [10, 50, 100],
  MYR: [50, 100, 500],
  IDR: [100000, 500000, 1000000],
};

function presetsFor(currency: string): number[] {
  return AMOUNT_PRESETS[currency] ?? [10, 50, 100];
}

/** 최초 진입/국가 변경 시 기본 입력 금액. 해당 통화 프리셋 중 가장 큰 값을 써요. */
function defaultAmountFor(currency: string): number {
  const presets = presetsFor(currency);
  return presets[presets.length - 1];
}

export function CurrencyConverter() {
  const { country } = useCountry();
  const { rates, fetchedAt, fromCache, loading, error, reload } = useExchangeRateContext();
  const [direction, setDirection] = useState<Direction>("foreignToKrw");
  const [input, setInput] = useState(() => String(defaultAmountFor(country.currency)));

  // 국가가 바뀌면 입력 금액을 새 통화의 기본값으로 리셋해요(렌더 중 상태 보정 패턴).
  // 이전 값(예: ¥10,000)을 두면 $10,000처럼 의미가 바뀌어요.
  // 단, KRW 입력 모드(krwToForeign)에서는 입력 통화가 그대로 KRW라 값을 유지해요.
  const [lastCountryCode, setLastCountryCode] = useState(country.code);
  if (lastCountryCode !== country.code) {
    setLastCountryCode(country.code);
    if (direction === "foreignToKrw") {
      setInput(String(defaultAmountFor(country.currency)));
    }
  }

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

  // 통화별 보기 편한 단위 기준 환율 (예: 100¥ = 919원, 1$ = 1,490원)
  const unitAmount = rateDisplayUnitFor(country.currency);
  const unitRate = useMemo(() => {
    if (rates == null) {
      return null;
    }
    return convert(unitAmount, country.currency, "KRW", rates);
  }, [rates, country.currency, unitAmount]);

  const handleSwap = () => {
    setDirection((d) => (d === "foreignToKrw" ? "krwToForeign" : "foreignToKrw"));
    logEvent("converter_swap", { country: country.code });
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

  const containerStyle: CSSProperties = {
    margin: "0 24px",
    padding: 20,
    borderRadius: 20,
    backgroundColor: adaptive.grey50 ?? adaptive.greyBackground,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  // 최초 로딩: 아직 받은 환율이 없어요 → 스켈레톤
  if (rates == null && loading) {
    return (
      <div style={containerStyle}>
        <Skeleton custom={["card", "spacer(12)", "subtitle"]} />
      </div>
    );
  }

  // 완전 실패: 환율도 저장된 캐시도 없어요 → 재시도 안내
  if (rates == null) {
    return (
      <div
        style={{ ...containerStyle, gap: 8, alignItems: "center", textAlign: "center", padding: "28px 20px" }}
      >
        <div style={{ fontSize: 40 }}>📡</div>
        <Text typography="st10" fontWeight="bold" color={adaptive.grey800} style={{ display: "block" }}>
          환율을 불러오지 못했어요
        </Text>
        <Text typography="t7" color={adaptive.grey500} style={{ display: "block" }}>
          네트워크 상태를 확인하고 다시 시도해 주세요
        </Text>
        <Button size="small" onClick={reload}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 입력 (from 통화) */}
      <TextField
        variant="box"
        label={`${symbolOf(from, country)} ${from} (입력)`}
        labelOption="sustain"
        placeholder="금액을 입력해요"
        value={input}
        inputMode="decimal"
        format={amountInputFormat}
        onChange={(e) => setInput(e.target.value)}
      />

      {/* 빠른 금액 프리셋 */}
      <div style={{ display: "flex", gap: 8 }}>
        {presetsFor(from).map((amount) => (
          <button
            key={amount}
            type="button"
            // "빠른 금액 프리셋"은 값을 설정해요(누적 아님).
            onClick={() => {
              setInput(String(amount));
              logEvent("amount_preset", { currency: from, amount });
            }}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 10,
              border: `1px solid ${adaptive.grey200}`,
              backgroundColor: adaptive.background,
              cursor: "pointer",
            }}
          >
            <Text typography="t7" fontWeight="semibold" color={adaptive.grey700}>
              {amount.toLocaleString("ko-KR")}
            </Text>
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
          backgroundColor: adaptive.background,
          textAlign: "right",
        }}
      >
        <Text
          typography="t7"
          color={adaptive.grey500}
          style={{ display: "block", marginBottom: 4 }}
        >
          {symbolOf(to, country)} {to}
        </Text>
        <Text
          typography="st2"
          fontWeight="bold"
          color={adaptive.grey800}
          style={{ display: "block", fontVariantNumeric: "tabular-nums" }}
        >
          {result == null
            ? "—"
            : `${symbolOf(to, country)} ${formatAmount(
                Number(result.toFixed(fractionDigitsFor(to))),
                to,
              )}`}
        </Text>
      </div>

      {/* 기준 환율 + 갱신 시각 */}
      <div style={{ textAlign: "center" }}>
        {unitRate != null && (
          <Text
            typography="st12"
            color={adaptive.grey500}
            style={{ display: "block", fontVariantNumeric: "tabular-nums" }}
          >
            {unitAmount.toLocaleString("ko-KR")} {country.currencySymbol}
            {country.currency} = {formatAmount(Math.round(unitRate), "KRW")}원
          </Text>
        )}
        {error ? (
          <div
            style={{
              marginTop: 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text typography="st12" color={adaptive.red500}>
              최신 환율 갱신에 실패했어요 · 저장된 값
            </Text>
            <TextButton size="small" variant="underline" onClick={reload}>
              다시 시도
            </TextButton>
          </div>
        ) : (
          <Text typography="st12" color={adaptive.grey400} style={{ display: "block", marginTop: 2 }}>
            {updatedLabel}
          </Text>
        )}
        {/* 시장 평균(mid-market) 환율이라 실제 환전 적용 환율과 달라요. 오해 방지용 고지. */}
        <Text typography="st12" color={adaptive.grey400} style={{ display: "block", marginTop: 2 }}>
          시장 평균 환율 기준이라 실제 환전 환율과 다를 수 있어요
        </Text>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Loader size="small" />
        </div>
      )}
    </div>
  );
}
