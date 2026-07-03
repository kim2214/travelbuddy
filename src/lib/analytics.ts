// 사용자 행동 로깅 래퍼.
// 앱인토스 Analytics를 감싸, 토스 앱 밖(브라우저 등)에서는 자동으로 no-op이 되고
// 로깅 실패가 앱 동작에 영향을 주지 않도록 해요.

import { Analytics } from "@apps-in-toss/web-framework";

type LogParams = Record<string, string | number | boolean>;

/** 사용자 클릭/행동 이벤트를 기록해요. */
export function logEvent(name: string, params: LogParams = {}): void {
  try {
    void Analytics.click({ log_name: name, ...params });
  } catch {
    // 분석 로깅 실패는 무시해요.
  }
}
