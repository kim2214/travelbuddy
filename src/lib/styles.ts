// 여러 컴포넌트에서 공유하는 스타일 상수.

import { adaptive, colors } from "@toss/tds-colors";
import type { CSSProperties } from "react";

/** 흰 배경 + 라운드 + 얇은 테두리 카드 표면 (ProductCard, LocalInfo 주의사항 등 공통) */
export const cardSurface: CSSProperties = {
  borderRadius: 16,
  backgroundColor: colors.white,
  border: `1px solid ${adaptive.grey100}`,
};
