// 면세 한도 계산기.
// 구매할 때마다 현지 통화 금액을 추가하면 USD로 환산해 합산하고,
// 한국 입국 기본 면세 한도(US$800) 대비 사용량과 남은 한도를 보여줘요.
// 내역은 국가별로 Storage에 영속돼요.

import { Button, ProgressBar, Text, TextButton, TextField } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useMemo, useState, type CSSProperties } from "react";

import { amountInputFormat } from "../lib/amountFormat";
import { logEvent } from "../lib/analytics";
import { DUTY_FREE_LIMIT_USD } from "../lib/dutyFree";
import { convert, formatAmount } from "../lib/exchangeRate";
import { useCountry } from "../context/CountryContext";
import { useExchangeRateContext } from "../context/exchangeRateContext";
import { useDutyFree } from "../hooks/useDutyFree";
import { SectionHeader } from "./SectionHeader";

export function DutyFreeCalculator() {
  const { country } = useCountry();
  const { rates } = useExchangeRateContext();
  const { items, addItem, removeItem, clearAll } = useDutyFree(country.code);
  const [input, setInput] = useState("");

  const cur = country.currency;
  const sym = country.currencySymbol;

  const inputAmount = useMemo(() => {
    const cleaned = input.replace(/[^0-9.]/g, "");
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : 0;
  }, [input]);

  /** 현지 통화 금액을 USD로 환산해요. 환율이 없으면 null이에요(USD 국가는 그대로). */
  const usdOf = (amount: number): number | null => {
    if (cur === "USD") {
      return amount;
    }
    return rates == null ? null : convert(amount, cur, "USD", rates);
  };

  const totalLocal = items.reduce((sum, item) => sum + item.amount, 0);
  const totalUsd = usdOf(totalLocal);
  const totalKrw = rates == null ? null : convert(totalLocal, cur, "KRW", rates);
  const remainingUsd = totalUsd == null ? null : DUTY_FREE_LIMIT_USD - totalUsd;
  const isOver = remainingUsd != null && remainingUsd < 0;

  const fmtLocal = (value: number) => `${sym}${formatAmount(value, cur)}`;
  const fmtUsd = (value: number) => `$${formatAmount(value, "USD")}`;

  const handleAdd = () => {
    if (inputAmount <= 0) {
      return;
    }
    addItem(inputAmount);
    logEvent("dutyfree_add", { country: country.code, amount: inputAmount });
    setInput("");
  };

  const containerStyle: CSSProperties = {
    margin: "0 24px",
    padding: 20,
    borderRadius: 20,
    backgroundColor: adaptive.grey50,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  return (
    <div style={{ marginTop: 8 }}>
      <SectionHeader padding="16px 24px 4px">🛍️ 면세 한도 계산기</SectionHeader>
      <Text
        typography="st12"
        color={adaptive.grey400}
        style={{ display: "block", padding: "0 24px 10px" }}
      >
        한국 입국 기본 면세 한도는 US$800이에요. 술 2병(2L)·담배 200개비·향수
        100mL는 별도 한도예요.
      </Text>

      <div style={containerStyle}>
        {/* 구매 금액 입력 */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <TextField
              variant="box"
              label={`${sym} ${cur} 구매 금액`}
              labelOption="sustain"
              placeholder="구매할 때마다 추가해요"
              value={input}
              inputMode="decimal"
              format={amountInputFormat}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <Button size="small" color="primary" onClick={handleAdd} disabled={inputAmount <= 0}>
            추가
          </Button>
        </div>

        {/* 구매 내역 */}
        {items.length > 0 && (
          <div style={{ borderRadius: 14, backgroundColor: adaptive.background, overflow: "hidden" }}>
            {items.map((item, index) => {
              const usd = usdOf(item.amount);
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px 10px 16px",
                    borderTop: index === 0 ? "none" : `1px solid ${adaptive.grey100}`,
                  }}
                >
                  <Text
                    typography="t7"
                    fontWeight="semibold"
                    color={adaptive.grey800}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {fmtLocal(item.amount)}
                  </Text>
                  {cur !== "USD" && (
                    <Text
                      typography="st12"
                      color={adaptive.grey500}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {usd == null ? "" : `≈ ${fmtUsd(usd)}`}
                    </Text>
                  )}
                  <div style={{ marginLeft: "auto" }}>
                    <Button
                      size="small"
                      variant="weak"
                      color="dark"
                      onClick={() => {
                        removeItem(item.id);
                        logEvent("dutyfree_remove", { country: country.code });
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 한도 요약 */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            backgroundColor: adaptive.background,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text typography="t7" color={adaptive.grey500}>
              사용한 한도
            </Text>
            <Text
              typography="t6"
              fontWeight="bold"
              color={isOver ? adaptive.red500 : adaptive.grey800}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {totalUsd == null ? "—" : fmtUsd(totalUsd)}{" "}
              <Text typography="t7" fontWeight="medium" color={adaptive.grey400}>
                / ${DUTY_FREE_LIMIT_USD}
              </Text>
            </Text>
          </div>

          <ProgressBar
            progress={totalUsd == null ? 0 : Math.min(totalUsd / DUTY_FREE_LIMIT_USD, 1)}
            size="normal"
            color={isOver ? adaptive.red500 : adaptive.blue400}
            animate
          />

          {totalUsd == null ? (
            <Text typography="st12" color={adaptive.grey400} style={{ display: "block" }}>
              환율을 불러오면 한도 계산을 보여드려요
            </Text>
          ) : isOver ? (
            <Text typography="st12" color={adaptive.red500} style={{ display: "block" }}>
              한도를 {fmtUsd(-remainingUsd!)} 초과했어요 · 초과분은 입국 시 세관 신고
              대상이에요
            </Text>
          ) : (
            <Text
              typography="st12"
              color={adaptive.grey400}
              style={{ display: "block", fontVariantNumeric: "tabular-nums" }}
            >
              남은 한도 {fmtUsd(remainingUsd!)}
              {totalKrw != null && totalLocal > 0
                ? ` · 지금까지 ≈ ${formatAmount(Math.round(totalKrw), "KRW")}원`
                : ""}
            </Text>
          )}
        </div>

        {/* 전체 비우기 */}
        {items.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <TextButton
              size="small"
              variant="clear"
              onClick={() => {
                clearAll();
                logEvent("dutyfree_clear", { country: country.code });
              }}
            >
              전체 비우기
            </TextButton>
          </div>
        )}
      </div>
    </div>
  );
}
