// 외부 URL/전화 연결 공용 유틸.
// 토스 네이티브 브릿지(openURL)를 우선 쓰고, 없는 환경(브라우저 개발 등)에서는 폴백해요.

import { openURL } from "@apps-in-toss/web-framework";

export async function openExternal(url: string): Promise<void> {
  try {
    await openURL(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** 전화 걸기. 숫자/＋ 외 문자는 tel: URI에서 제거해요. */
export async function dial(phoneNumber: string): Promise<void> {
  const sanitized = phoneNumber.replace(/[^0-9+]/g, "");
  await openExternal(`tel:${sanitized}`);
}
