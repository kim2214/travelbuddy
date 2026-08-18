// 사이즈 변환표 (KR ↔ US/EU/UK/JP).
// 카테고리(여성/남성 신발·의류)를 전환해 보고, 현재 여행지가 주로 쓰는
// 표기 열을 파란색으로 하이라이트해요.

import { SegmentedControl, Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useState } from "react";

import { logEvent } from "../lib/analytics";
import {
  SIZE_CATEGORIES,
  SIZE_REGION_BY_COUNTRY,
  type SizeCategory,
} from "../data/sizeGuide";
import { useCountry } from "../context/CountryContext";
import { SectionHeader } from "./SectionHeader";

function SizeTable({
  category,
  highlightRegion,
}: {
  category: SizeCategory;
  highlightRegion: string | null;
}) {
  const { columns, rows } = category;
  const highlightIndex =
    highlightRegion == null
      ? -1
      : columns.findIndex((col) => col.region === highlightRegion);

  const cellBase = {
    padding: "9px 4px",
    textAlign: "center" as const,
  };

  return (
    <div
      style={{
        margin: "0 24px",
        borderRadius: 16,
        border: `1px solid ${adaptive.grey100}`,
        backgroundColor: adaptive.background,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {/* 헤더 */}
        {columns.map((col, colIndex) => {
          const highlighted = colIndex === highlightIndex;
          return (
            <div
              key={col.label}
              style={{
                ...cellBase,
                backgroundColor: highlighted ? adaptive.blue50 : adaptive.grey50,
              }}
            >
              <Text
                typography="st12"
                fontWeight="bold"
                color={highlighted ? adaptive.blue600 : adaptive.grey600}
              >
                {col.label}
              </Text>
            </div>
          );
        })}

        {/* 값 */}
        {rows.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            const highlighted = colIndex === highlightIndex;
            return (
              <div
                key={`${category.key}-${rowIndex}-${colIndex}`}
                style={{
                  ...cellBase,
                  borderTop: `1px solid ${adaptive.grey100}`,
                  backgroundColor: highlighted ? adaptive.blue50 : undefined,
                }}
              >
                <Text
                  typography="st12"
                  // 첫 열(KR)은 기준이라 굵게, 하이라이트 열은 파란색으로 강조해요.
                  fontWeight={colIndex === 0 || highlighted ? "semibold" : "regular"}
                  color={
                    highlighted
                      ? adaptive.blue600
                      : colIndex === 0
                        ? adaptive.grey800
                        : adaptive.grey600
                  }
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {value}
                </Text>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function SizeGuide() {
  const { country } = useCountry();
  const [categoryKey, setCategoryKey] = useState(SIZE_CATEGORIES[0].key);

  const category =
    SIZE_CATEGORIES.find((c) => c.key === categoryKey) ?? SIZE_CATEGORIES[0];
  const region = SIZE_REGION_BY_COUNTRY[country.code] ?? null;
  const hasHighlight =
    region != null && category.columns.some((col) => col.region === region);

  return (
    <div style={{ marginTop: 16 }}>
      <SectionHeader padding="16px 24px 4px">👕 사이즈 변환표</SectionHeader>
      <Text
        typography="st12"
        color={adaptive.grey400}
        style={{ display: "block", padding: "0 24px 10px" }}
      >
        표준 변환표 기준이라 브랜드마다 다를 수 있어요
      </Text>

      <div style={{ padding: "0 24px 12px" }}>
        <SegmentedControl
          value={categoryKey}
          onChange={(value) => {
            setCategoryKey(value);
            logEvent("size_guide_category", { country: country.code, category: value });
          }}
        >
          {SIZE_CATEGORIES.map((c) => (
            <SegmentedControl.Item key={c.key} value={c.key}>
              {c.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>
      </div>

      <SizeTable category={category} highlightRegion={region} />

      {hasHighlight && (
        <Text
          typography="st12"
          color={adaptive.grey400}
          style={{ display: "block", padding: "8px 24px 0" }}
        >
          파란 열이 {country.name}에서 주로 쓰는 표기예요
        </Text>
      )}
    </div>
  );
}
