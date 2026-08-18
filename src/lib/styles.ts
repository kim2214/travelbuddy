// 여러 컴포넌트에서 공유하는 스타일 상수.

import { adaptive } from "@toss/tds-colors";
import type { CSSProperties } from "react";

/** 기본 배경 + 라운드 + 얇은 테두리 카드 표면 (ProductCard, LocalInfo 주의사항 등 공통) */
export const cardSurface: CSSProperties = {
  borderRadius: 16,
  backgroundColor: adaptive.background,
  border: `1px solid ${adaptive.grey100}`,
};
