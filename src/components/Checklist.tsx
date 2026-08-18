// 국가별 준비물 체크리스트.
// 프리셋 + 사용자 커스텀 항목을 체크/추가/삭제하고, 진행률을 보여줘요. 상태는 Storage에 영속돼요.

import { Button, Checkbox, ListRow, ProgressBar, Text, TextField } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useEffect, useRef, useState } from "react";

import type { ChecklistCategory } from "../data/countries";
import { logEvent } from "../lib/analytics";
import { requestAppReview } from "../lib/review";
import { useCountry } from "../context/CountryContext";
import { useChecklist, type ChecklistRow } from "../hooks/useChecklist";

// 카테고리 표시 순서 + 아이콘
const CATEGORY_ORDER: { key: ChecklistCategory; emoji: string }[] = [
  { key: "서류", emoji: "📄" },
  { key: "전자기기", emoji: "🔌" },
  { key: "상비약", emoji: "💊" },
  { key: "기타", emoji: "📦" },
];

export function Checklist() {
  const { country } = useCountry();
  const { rows, checkedCount, totalCount, progress, loading, toggle, addCustom, removeCustom } =
    useChecklist(country.code);
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    const trimmed = newItem.trim();
    if (trimmed === "") {
      return;
    }
    addCustom(trimmed);
    logEvent("checklist_add_custom", { country: country.code });
    setNewItem("");
  };

  // 준비물을 모두 체크하는 순간(로드 후 미완료→완료 전이)에만 반응해요.
  // null은 "아직 기준 없음"이라, 이미 완료된 채 열었을 때(탭 재방문 등) 중복 실행되지 않아요.
  const isComplete = totalCount > 0 && checkedCount === totalCount;
  const wasCompleteRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (loading) {
      wasCompleteRef.current = null;
      return;
    }
    if (wasCompleteRef.current === false && isComplete) {
      logEvent("checklist_complete", { country: country.code });
      // 준비를 마친 직후가 만족도가 가장 높은 순간이라 여기서 리뷰를 요청해요.
      void requestAppReview();
    }
    wasCompleteRef.current = isComplete;
  }, [loading, isComplete, country.code]);

  // 카테고리별로 그룹핑 (항목이 있는 그룹만 노출)
  const groups = CATEGORY_ORDER.map(({ key, emoji }) => ({
    key,
    emoji,
    items: rows.filter((r) => r.category === key),
  })).filter((g) => g.items.length > 0);

  const renderRow = (row: ChecklistRow) => (
    <ListRow
      key={row.id}
      onClick={() => toggle(row.id)}
      withTouchEffect
      left={
        // 토글은 ListRow.onClick이 단일 처리해요.
        // 체크박스에도 핸들러를 두면 체크박스 탭 시 change→click 버블링으로 두 번 실행돼 상태가 상쇄돼요.
        <Checkbox.Circle checked={row.checked} aria-label={row.label} />
      }
      contents={
        row.hint ? (
          <ListRow.Texts type="2RowTypeB" top={row.label} bottom={row.hint} />
        ) : (
          <ListRow.Texts type="1RowTypeA" top={row.label} />
        )
      }
      right={
        row.custom ? (
          <Button
            size="small"
            variant="weak"
            color="dark"
            onClick={(e) => {
              e.stopPropagation();
              removeCustom(row.id);
            }}
          >
            삭제
          </Button>
        ) : undefined
      }
    />
  );

  return (
    <div>
      {/* 진행률 헤더 */}
      <div style={{ padding: "8px 24px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <Text typography="t5" fontWeight="bold" color={adaptive.grey800}>
            {country.flag} {country.name} 준비물
          </Text>
          <Text
            typography="st11"
            color={adaptive.grey500}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {checkedCount}/{totalCount}
          </Text>
        </div>
        <ProgressBar progress={progress} size="normal" animate />
      </div>

      {/* 완료 델라이트 */}
      {totalCount > 0 && checkedCount === totalCount && (
        <div
          style={{
            margin: "0 24px 4px",
            padding: "18px 20px",
            borderRadius: 16,
            backgroundColor: adaptive.green50,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 30 }}>✈️</span>
          <div>
            <Text
              typography="t6"
              fontWeight="bold"
              color={adaptive.green500}
              style={{ display: "block" }}
            >
              모든 준비 완료!
            </Text>
            <Text typography="t7" color={adaptive.grey600} style={{ display: "block", marginTop: 2 }}>
              즐거운 여행 되세요
            </Text>
          </div>
        </div>
      )}

      {/* 카테고리별 항목 리스트 */}
      <div>
        {groups.map((group) => {
          const done = group.items.filter((r) => r.checked).length;
          return (
            <div key={group.key}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "14px 24px 8px",
                }}
              >
                <Text typography="t7" fontWeight="bold" color={adaptive.grey700}>
                  {group.emoji} {group.key}
                </Text>
                <Text
                  typography="t7"
                  fontWeight="semibold"
                  color={adaptive.grey400}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {done}/{group.items.length}
                </Text>
              </div>
              {group.items.map(renderRow)}
            </div>
          );
        })}
      </div>

      {/* 커스텀 항목 추가 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          padding: "16px 24px 8px",
          backgroundColor: adaptive.background,
        }}
      >
        <div style={{ flex: 1 }}>
          <TextField
            variant="line"
            label="직접 추가"
            labelOption="appear"
            placeholder="예) 보조 배터리"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
        </div>
        <Button size="small" color="primary" onClick={handleAdd} disabled={newItem.trim() === ""}>
          추가
        </Button>
      </div>
    </div>
  );
}
