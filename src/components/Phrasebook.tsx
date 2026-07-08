// 여행 회화. 한국어 뜻 · 현지어 표기 · 한글 발음을 카드로 보여줘요.
// 카드를 탭하면 현지어가 클립보드에 복사돼, 현지에서 화면을 보여주거나 붙여넣어 쓸 수 있어요.

import { Text, useToast } from "@toss/tds-mobile";
import { adaptive, colors } from "@toss/tds-colors";
import { useEffect } from "react";

import type { Phrase } from "../data/countries";
import { logEvent, logImpression } from "../lib/analytics";
import { copyText } from "../lib/clipboard";
import { haptic } from "../lib/haptics";
import { useCountry } from "../context/CountryContext";
import { SectionHeader } from "./SectionHeader";

export function Phrasebook() {
  const { country } = useCountry();
  const toast = useToast();
  const phrases = country.phrases;

  useEffect(() => {
    logImpression("phrasebook_view", { country: country.code });
  }, [country.code]);

  if (phrases.length === 0) {
    return null;
  }

  const handleCopy = async (p: Phrase) => {
    const ok = await copyText(p.local);
    if (ok) {
      haptic("success");
      toast.openToast(`"${p.local}" 복사했어요`, {
        icon: "icon-check",
        iconType: "circle",
      });
      logEvent("phrase_copy", { country: country.code, ko: p.ko });
    } else {
      toast.openToast("복사하지 못했어요");
    }
  };

  return (
    <div>
      <SectionHeader padding="8px 24px 4px">여행 회화</SectionHeader>
      <Text
        typography="st12"
        color={adaptive.grey400}
        style={{ display: "block", padding: "0 24px 10px" }}
      >
        카드를 탭하면 현지어가 복사돼요
      </Text>
      <div style={{ margin: "0 24px", borderRadius: 16, overflow: "hidden" }}>
        {phrases.map((p, index) => (
          <button
            key={p.ko}
            type="button"
            className="tab-bar-item"
            aria-label={`${p.ko} 현지어 복사`}
            onClick={() => void handleCopy(p)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              columnGap: 12,
              rowGap: 4,
              width: "100%",
              padding: "14px 16px",
              border: "none",
              borderTop: index === 0 ? "none" : `1px solid ${adaptive.grey100}`,
              backgroundColor: colors.white,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <Text typography="st11" fontWeight="semibold" color={adaptive.grey800}>
              {p.ko}
            </Text>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Text
                typography="t6"
                fontWeight="semibold"
                color={adaptive.blue500}
                style={{ textAlign: "right" }}
              >
                {p.local}
              </Text>
              <span style={{ fontSize: 13, opacity: 0.5, flexShrink: 0 }} aria-hidden="true">
                📋
              </span>
            </div>
            <Text
              typography="st12"
              color={adaptive.grey500}
              style={{ gridColumn: "1 / -1", display: "block" }}
            >
              {p.pron}
            </Text>
          </button>
        ))}
      </div>
    </div>
  );
}
