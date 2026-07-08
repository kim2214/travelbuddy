// 클립보드 복사 공용 유틸.
// 토스 네이티브 브릿지(setClipboardText)를 우선 쓰고, 없는 환경(브라우저 개발 등)에서는
// navigator.clipboard로 폴백해요. 어느 쪽도 안 되면 false를 반환해요.

import { setClipboardText } from "@apps-in-toss/web-framework";

/** 텍스트를 클립보드에 복사해요. 성공 시 true, 실패 시 false를 반환해요. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await setClipboardText(text);
    return true;
  } catch {
    // 토스 앱 밖(브라우저 등) 브릿지 미지원 환경 폴백
    try {
      if (navigator.clipboard?.writeText != null) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // 폴백도 실패
    }
    return false;
  }
}
