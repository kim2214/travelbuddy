// 섹션 제목 헤더. 여러 화면에서 반복되던 동일 스타일을 하나로 모았어요.

import { adaptive } from "@toss/tds-colors";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  children: ReactNode;
  /** 기본 "16px 24px 8px". 화면에 따라 상단 여백만 다를 때 덮어써요. */
  padding?: string;
}

export function SectionHeader({ children, padding = "16px 24px 8px" }: SectionHeaderProps) {
  return (
    <div
      style={{
        padding,
        fontSize: 17,
        fontWeight: 700,
        color: adaptive.grey800,
      }}
    >
      {children}
    </div>
  );
}
