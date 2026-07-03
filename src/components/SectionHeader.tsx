// 섹션 제목 헤더. 여러 화면에서 반복되던 동일 스타일을 하나로 모았어요.
// TDS Text를 써서 "더 큰 텍스트" 접근성 설정에 맞춰 크기가 스케일돼요.

import { Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  children: ReactNode;
  /** 기본 "16px 24px 8px". 화면에 따라 상단 여백만 다를 때 덮어써요. */
  padding?: string;
}

export function SectionHeader({ children, padding = "16px 24px 8px" }: SectionHeaderProps) {
  return (
    <Text
      typography="t5"
      fontWeight="bold"
      color={adaptive.grey800}
      style={{ display: "block", padding }}
    >
      {children}
    </Text>
  );
}
