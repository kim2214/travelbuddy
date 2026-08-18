// 현지 물가로 감 잡기.
// 커피·라멘·택시 같은 현지 대표 물가를 원화로 즉시 환산해 "체감 물가"를 보여줘요.

import { Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";

import { useCountry } from "../context/CountryContext";
import { useExchangeRateContext } from "../context/exchangeRateContext";
import { convert, formatAmount } from "../lib/exchangeRate";
import { SectionHeader } from "./SectionHeader";

export function LocalPricePresets() {
  const { country } = useCountry();
  const { rates } = useExchangeRateContext();
  const prices = country.localPrices;

  if (prices.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionHeader padding="16px 24px 10px">
        {country.name} 물가로 감 잡기
      </SectionHeader>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          padding: "0 24px",
        }}
      >
        {prices.map((p) => {
          const krw = rates == null ? null : convert(p.amount, country.currency, "KRW", rates);
          return (
            <div
              key={p.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "13px 14px",
                borderRadius: 14,
                backgroundColor: adaptive.background,
                boxShadow: "0 1px 2px rgba(23,31,40,0.05)",
              }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{p.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <Text
                  typography="t7"
                  fontWeight="semibold"
                  color={adaptive.grey800}
                  style={{
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.label}
                </Text>
                <Text
                  typography="st12"
                  color={adaptive.grey500}
                  style={{ display: "block", fontVariantNumeric: "tabular-nums" }}
                >
                  {country.currencySymbol}
                  {p.amount.toLocaleString("ko-KR")}
                </Text>
              </div>
              <Text
                typography="t7"
                fontWeight="bold"
                color={adaptive.blue500}
                style={{
                  marginLeft: "auto",
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {krw == null ? "—" : `${formatAmount(Math.round(krw), "KRW")}원`}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
