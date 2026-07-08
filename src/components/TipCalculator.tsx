// 팁 계산기 (미국 등 팁 문화권).
// 결제 금액 · 팁 비율 · 인원을 입력하면 팁/합계/1인당 금액을 즉시 계산하고,
// 합계는 원화로도 환산해 감을 잡을 수 있어요. tipping 정보가 있는 나라에서만 노출돼요.

import { NumericSpinner, SegmentedControl, Text, TextField } from "@toss/tds-mobile";
import { adaptive, colors } from "@toss/tds-colors";
import { useMemo, useState, type CSSProperties } from "react";

import type { TippingInfo } from "../data/countries";
import { logEvent } from "../lib/analytics";
import { useCountry } from "../context/CountryContext";
import { useExchangeRateContext } from "../context/exchangeRateContext";
import {
  convert,
  fractionDigitsFor,
  formatAmount,
} from "../lib/exchangeRate";
import { SectionHeader } from "./SectionHeader";

export function TipCalculator({ tipping }: { tipping: TippingInfo }) {
  const { country } = useCountry();
  const { rates } = useExchangeRateContext();
  const [bill, setBill] = useState("");
  const [tipPct, setTipPct] = useState(tipping.presets[0] ?? 15);
  const [people, setPeople] = useState(1);

  const cur = country.currency;
  const sym = country.currencySymbol;

  const billAmount = useMemo(() => {
    const cleaned = bill.replace(/[^0-9.]/g, "");
    const v = Number(cleaned);
    return Number.isFinite(v) ? v : 0;
  }, [bill]);

  const tip = billAmount * (tipPct / 100);
  const total = billAmount + tip;
  const perPerson = people > 0 ? total / people : total;
  const totalKrw = rates == null ? null : convert(total, cur, "KRW", rates);

  const fmt = (v: number) =>
    `${sym}${formatAmount(Number(v.toFixed(fractionDigitsFor(cur))), cur)}`;

  const containerStyle: CSSProperties = {
    margin: "0 24px",
    padding: 20,
    borderRadius: 20,
    backgroundColor: adaptive.grey50 ?? adaptive.greyBackground,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  };

  const rows: { label: string; value: string; strong?: boolean }[] = [
    { label: `팁 (${tipPct}%)`, value: fmt(tip) },
    { label: "합계", value: fmt(total), strong: true },
  ];
  if (people > 1) {
    rows.push({ label: `1인당 (${people}명)`, value: fmt(perPerson), strong: true });
  }

  return (
    <div style={{ marginTop: 8 }}>
      <SectionHeader padding="16px 24px 4px">💵 팁 계산기</SectionHeader>
      <Text
        typography="st12"
        color={adaptive.grey400}
        style={{ display: "block", padding: "0 24px 10px" }}
      >
        {tipping.note}
      </Text>

      <div style={containerStyle}>
        {/* 결제 금액 입력 */}
        <TextField
          variant="box"
          label={`${sym} ${cur} 결제 금액`}
          labelOption="sustain"
          placeholder="금액을 입력해요"
          value={bill}
          inputMode="decimal"
          format={{
            transform: (v) => {
              const [int, ...frac] = String(v).split(".");
              const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              return frac.length > 0 ? `${grouped}.${frac.join(".")}` : grouped;
            },
          }}
          onChange={(e) => setBill(e.target.value)}
        />

        {/* 팁 비율 선택 */}
        <div>
          <Text
            typography="t7"
            fontWeight="semibold"
            color={adaptive.grey600}
            style={{ display: "block", marginBottom: 8 }}
          >
            팁 비율
          </Text>
          <SegmentedControl
            value={String(tipPct)}
            onChange={(v) => {
              const next = Number(v);
              setTipPct(next);
              logEvent("tip_calc_percent", { country: country.code, percent: next });
            }}
          >
            {tipping.presets.map((pct) => (
              <SegmentedControl.Item key={pct} value={String(pct)}>
                {pct}%
              </SegmentedControl.Item>
            ))}
          </SegmentedControl>
        </div>

        {/* 인원 나누기 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text typography="t7" fontWeight="semibold" color={adaptive.grey600}>
            인원 나누기
          </Text>
          <NumericSpinner
            size="small"
            number={people}
            minNumber={1}
            maxNumber={20}
            onNumberChange={setPeople}
            a11yProps={{
              minusButtonAriaLabel: "인원 줄이기",
              plusButtonAriaLabel: "인원 늘리기",
            }}
          />
        </div>

        {/* 결과 */}
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 14,
            backgroundColor: colors.white,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {rows.map((r) => (
            <div
              key={r.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <Text
                typography={r.strong ? "t6" : "t7"}
                color={r.strong ? adaptive.grey700 : adaptive.grey500}
              >
                {r.label}
              </Text>
              <Text
                typography={r.strong ? "st10" : "t6"}
                fontWeight="bold"
                color={r.strong ? adaptive.grey800 : adaptive.grey600}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {r.value}
              </Text>
            </div>
          ))}
          {totalKrw != null && (
            <Text
              typography="st12"
              color={adaptive.grey400}
              style={{
                display: "block",
                textAlign: "right",
                marginTop: 2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              합계 ≈ {formatAmount(Math.round(totalKrw), "KRW")}원
            </Text>
          )}
        </div>
      </div>
    </div>
  );
}
