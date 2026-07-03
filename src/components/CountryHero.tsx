// 여행지 히어로 카드. 국기·통화·시차·전원을 한 장으로 요약하고, 탭하면 여행지를 바꿀 수 있어요.
// 국가별 테마 그라디언트로 "여행지 가이드" 인상을 줘요.

import { Text } from "@toss/tds-mobile";
import { useState } from "react";

import { getPracticalInfo } from "../data/countries";
import { useCountry } from "../context/CountryContext";
import { CountryPickerSheet } from "./CountryPickerSheet";

// 국가별 히어로 그라디언트 (시각 테마, 데이터와 분리)
const GRADIENTS: Record<string, [string, string]> = {
  JP: ["#FF7A85", "#E84855"],
  TH: ["#FF9F45", "#F0663F"],
  VN: ["#F5525E", "#C81E27"],
  US: ["#4C7DF0", "#2748B0"],
  SG: ["#FF6478", "#E23144"],
};
const DEFAULT_GRADIENT: [string, string] = ["#4C7DF0", "#2748B0"];

export function CountryHero() {
  const { country, detecting } = useCountry();
  const [open, setOpen] = useState(false);
  const info = getPracticalInfo(country.code);
  const [from, to] = GRADIENTS[country.code] ?? DEFAULT_GRADIENT;

  const stats: { k: string; v: string }[] = [
    { k: "통화", v: `${country.currencySymbol} ${country.currency}` },
    { k: "시차", v: info.timeDiffShort },
    { k: "전원", v: info.plugShort },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="여행지 변경"
        className="tab-bar-item"
        style={{
          display: "block",
          width: "calc(100% - 40px)",
          margin: "0 20px",
          padding: "18px 20px 20px",
          border: "none",
          borderRadius: 20,
          textAlign: "left",
          cursor: "pointer",
          color: "#fff",
          background: `radial-gradient(120% 120% at 85% -20%, rgba(255,255,255,0.28), transparent 55%), linear-gradient(150deg, ${from}, ${to})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              flexShrink: 0,
            }}
          >
            {country.flag}
          </span>
          <div style={{ minWidth: 0 }}>
            <Text
              typography="t3"
              fontWeight="bold"
              color="#fff"
              style={{ display: "block", letterSpacing: "-0.01em" }}
            >
              {country.name}
            </Text>
            <Text typography="t7" color="#fff" style={{ display: "block", opacity: 0.9, marginTop: 1 }}>
              {detecting
                ? "📍 현재 위치로 찾는 중…"
                : `${country.currencyName} · ${country.currency}`}
            </Text>
          </div>
          <Text
            typography="t7"
            fontWeight="semibold"
            color="#fff"
            style={{ marginLeft: "auto", opacity: 0.9, whiteSpace: "nowrap" }}
          >
            바꾸기 ▾
          </Text>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 8,
            marginTop: 18,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.k}
              style={{
                backgroundColor: "rgba(255,255,255,0.16)",
                borderRadius: 13,
                padding: "11px 12px",
              }}
            >
              <Text
                typography="st13"
                fontWeight="semibold"
                color="#fff"
                style={{ display: "block", opacity: 0.85 }}
              >
                {s.k}
              </Text>
              <Text
                typography="t6"
                fontWeight="bold"
                color="#fff"
                style={{ display: "block", marginTop: 3, fontVariantNumeric: "tabular-nums" }}
              >
                {s.v}
              </Text>
            </div>
          ))}
        </div>
      </button>

      <CountryPickerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
