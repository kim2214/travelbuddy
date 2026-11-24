// 면세 한도 계산기.
// 구매할 때마다 현지 통화 금액을 추가하면 USD로 환산해 합산하고,
// 한국 입국 기본 면세 한도(US$800) 대비 사용량과 남은 한도를 보여줘요.
// 면세 한도는 입국 한 번에 적용되므로 여러 나라에서 산 금액을 한 목록에 모아 합산해요.
// 내역은 Storage에 영속되고, 여행이 끝나면 전체 비우기로 비워요.

import { Button, ProgressBar, Text, TextButton, TextField, useDialog } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useMemo, useState, type CSSProperties } from "react";

import { amountInputFormat, parseAmount } from "../lib/amountFormat";
import { logEvent } from "../lib/analytics";
import { DUTY_FREE_LIMIT_USD } from "../lib/dutyFree";
import { convert, formatAmount } from "../lib/exchangeRate";
import { useCountry } from "../context/CountryContext";
import { useExchangeRateContext } from "../context/exchangeRateContext";
import { COUNTRIES } from "../data/countries";
import { useDutyFree } from "../hooks/useDutyFree";
import { SectionHeader } from "./SectionHeader";

/** 통화 코드에 맞는 기호를 찾아요. 지원 목록에 없는 통화는 코드를 그대로 써요. */
function symbolOf(currency: string): string {
  return COUNTRIES.find((c) => c.currency === currency)?.currencySymbol ?? `${currency} `;
}

export function DutyFreeCalculator() {
  const { country } = useCountry();
  const { rates } = useExchangeRateContext();
  const { items, addItem, removeItem, clearAll } = useDutyFree();
  const { openConfirm } = useDialog();
  const [input, setInput] = useState("");
  // 여행지를 바꾸면 입력 통화가 달라지므로, 입력 중이던 금액은 비워요. (내역은 그대로 유지)
  const [inputCountryCode, setInputCountryCode] = useState(country.code);
  if (inputCountryCode !== country.code) {
    setInputCountryCode(country.code);
    setInput("");
  }

  const cur = country.currency;
  const sym = country.currencySymbol;

  const inputAmount = useMemo(() => parseAmount(input), [input]);

  /** 금액을 다른 통화로 환산해요. 같은 통화는 그대로, 환율이 없으면 null이에요. */
  const convertTo = (amount: number, from: string, to: string): number | null => {
    if (from === to) {
      return amount;
    }
    return rates == null ? null : convert(amount, from, to, rates);
  };
  /** 통화가 섞인 내역을 한 통화로 합산해요. 하나라도 환산할 수 없으면 null이에요. */
  const totalIn = (to: string): number | null =>
    items.reduce<number | null>((sum, item) => {
      const converted = convertTo(item.amount, item.currency, to);
      return sum == null || converted == null ? null : sum + converted;
    }, 0);

  const totalUsd = totalIn("USD");
  const totalKrw = totalIn("KRW");
  const remainingUsd = totalUsd == null ? null : DUTY_FREE_LIMIT_USD - totalUsd;
  const isOver = remainingUsd != null && remainingUsd < 0;
  // 여러 통화가 섞이면 기호만으로 구분하기 어려워(엔·위안 모두 ¥) 통화 코드를 함께 보여줘요.
  const mixedCurrencies = new Set(items.map((item) => item.currency)).size > 1;

  const fmtItem = (item: { amount: number; currency: string }) =>
    `${symbolOf(item.currency)}${formatAmount(item.amount, item.currency)}`;
  const fmtUsd = (value: number) => `$${formatAmount(value, "USD")}`;

  // 여행 전체 내역이 한 번에 지워지고 되돌릴 수 없어서, 지우기 전에 한 번 확인해요.
  const handleClearAll = async () => {
    const confirmed = await openConfirm({
      title: "구매 내역을 모두 지울까요?",
      description: "지운 내역은 되돌릴 수 없어요.",
      confirmButton: "지우기",
      cancelButton: "취소",
    });
    if (!confirmed) {
      return;
    }
    clearAll();
    logEvent("dutyfree_clear", { country: country.code });
  };

  const handleAdd = () => {
    if (inputAmount <= 0) {
      return;
    }
    addItem(inputAmount, cur);
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
        100mL는 별도 한도예요. 여러 나라에서 산 금액도 함께 합산해요.
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
              const usd = convertTo(item.amount, item.currency, "USD");
              const note = [
                mixedCurrencies ? item.currency : null,
                item.currency !== "USD" && usd != null ? `≈ ${fmtUsd(usd)}` : null,
              ]
                .filter((part) => part != null)
                .join(" · ");
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
                    {fmtItem(item)}
                  </Text>
                  {note !== "" && (
                    <Text
                      typography="st12"
                      color={adaptive.grey500}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {note}
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
              {totalKrw != null && items.length > 0
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
              onClick={() => void handleClearAll()}
            >
              전체 비우기
            </TextButton>
          </div>
        )}
      </div>
    </div>
  );
}
