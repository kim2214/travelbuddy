// 사용자가 직접 고른 여행지(수동 선택)를 영속화해요.
// 수동 선택이 저장돼 있으면 자동 감지보다 우선해요.

import { Storage } from "@apps-in-toss/web-framework";

const KEY = "selected_country_v1";

export async function loadSelectedCountry(): Promise<string | null> {
  try {
    return await Storage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function saveSelectedCountry(code: string): Promise<void> {
  try {
    await Storage.setItem(KEY, code);
  } catch {
    // 저장 실패는 무시
  }
}
