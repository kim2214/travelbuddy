// 앱 리뷰 요청 공용 유틸.
// 앱인토스 네이티브 브릿지(requestReview)를 감싸, 토스 앱 밖(브라우저 등)이나
// 미지원 환경에서는 조용히 no-op이 되도록 해요.

import { requestReview } from "@apps-in-toss/web-framework";

/** 네이티브 리뷰 요청 UI를 띄워요. 노출 여부는 OS/토스 정책에 따르고, 실패는 무시해요. */
export async function requestAppReview(): Promise<void> {
  try {
    await requestReview();
  } catch {
    // 미지원 환경(브라우저 등)은 무시해요.
  }
}
