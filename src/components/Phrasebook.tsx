// 여행 회화. 한국어 뜻 · 현지어 표기 · 한글 발음을 카드로 보여줘요.
// 카드를 탭하면 현지어가 클립보드에 복사돼, 현지에서 화면을 보여주거나 붙여넣어 쓸 수 있어요.

import { Text, useToast } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useEffect } from "react";

import type { Phrase, PhraseCategory } from "../data/countries";
import { logEvent, logImpression } from "../lib/analytics";
import { copyText } from "../lib/clipboard";
import { haptic } from "../lib/haptics";
import { useCountry } from "../context/CountryContext";
import { SectionHeader } from "./SectionHeader";

// 카테고리 표시 순서 + 아이콘 (항목이 있는 그룹만 노출)
const CATEGORY_ORDER: { key: PhraseCategory; emoji: string }[] = [
  { key: "기본", emoji: "💬" },
  { key: "식당", emoji: "🍽️" },
  { key: "쇼핑", emoji: "🛍️" },
  { key: "교통", emoji: "🚕" },
  { key: "긴급", emoji: "🆘" },
];

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
      logEvent("phrase_copy", { country: country.code, category: p.category, ko: p.ko });
    } else {
      toast.openToast("복사하지 못했어요");
    }
  };

  // 카테고리별로 그룹핑 (항목이 있는 그룹만, 정의된 순서대로)
  const groups = CATEGORY_ORDER.map(({ key, emoji }) => ({
    key,
    emoji,
    items: phrases.filter((p) => p.category === key),
  })).filter((g) => g.items.length > 0);

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

      {groups.map((group) => (
        <div key={group.key} style={{ marginBottom: 14 }}>
          <Text
            typography="t7"
            fontWeight="bold"
            color={adaptive.grey700}
            style={{ display: "block", padding: "0 24px 8px" }}
          >
            {group.emoji} {group.key}
          </Text>
          <div style={{ margin: "0 24px", borderRadius: 16, overflow: "hidden" }}>
            {group.items.map((p, index) => (
              <button
                key={`${group.key}-${p.ko}`}
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
                  backgroundColor: adaptive.background,
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
      ))}
    </div>
  );
}
