// 여행 회화. 한국어 뜻 · 현지어 표기 · 한글 발음을 카드로 보여줘요.

import { adaptive, colors } from "@toss/tds-colors";

import { useCountry } from "../context/CountryContext";
import { SectionHeader } from "./SectionHeader";

export function Phrasebook() {
  const { country } = useCountry();
  const phrases = country.phrases;

  if (phrases.length === 0) {
    return null;
  }

  return (
    <div>
      <SectionHeader padding="8px 24px 10px">여행 회화</SectionHeader>
      <div style={{ margin: "0 24px", borderRadius: 16, overflow: "hidden" }}>
        {phrases.map((p, index) => (
          <div
            key={p.ko}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              columnGap: 12,
              rowGap: 4,
              padding: "14px 16px",
              backgroundColor: colors.white,
              borderTop: index === 0 ? "none" : `1px solid ${adaptive.grey100}`,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: adaptive.grey800 }}>
              {p.ko}
            </span>
            <span style={{ fontSize: 15, fontWeight: 700, color: adaptive.blue500, textAlign: "right" }}>
              {p.local}
            </span>
            <span style={{ gridColumn: "1 / -1", fontSize: 12, color: adaptive.grey500 }}>
              {p.pron}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
