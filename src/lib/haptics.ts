// 햅틱(촉각) 피드백 공용 유틸.
// 앱인토스 네이티브 브릿지(generateHapticFeedback)를 감싸, 토스 앱 밖이나
// 미지원 환경에서는 조용히 no-op이 되도록 해요.

import { generateHapticFeedback } from "@apps-in-toss/web-framework";

/** 진동 타입. 앱인토스 HapticFeedbackType의 부분집합이에요. */
export type HapticType =
  | "tickWeak"
  | "tap"
  | "tickMedium"
  | "softMedium"
  | "basicWeak"
  | "basicMedium"
  | "success"
  | "error";

/** 가벼운 촉각 피드백을 발생시켜요. 실패는 무시해요. */
export function haptic(type: HapticType = "tap"): void {
  try {
    void generateHapticFeedback({ type });
  } catch {
    // 미지원 환경(브라우저 등)은 무시해요.
  }
}
