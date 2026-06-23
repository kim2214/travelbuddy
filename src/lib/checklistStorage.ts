// 국가별 체크리스트 상태(체크된 항목 + 사용자가 추가한 커스텀 항목)를 Storage에 영속화해요.
// Storage는 문자열만 저장하므로 JSON으로 직렬화해요.

import { Storage } from "@apps-in-toss/web-framework";

export interface CustomChecklistItem {
  id: string;
  label: string;
}

export interface ChecklistState {
  /** 체크된 항목 id 목록 (프리셋 + 커스텀 공통) */
  checkedIds: string[];
  /** 사용자가 직접 추가한 항목 */
  customItems: CustomChecklistItem[];
}

const EMPTY_STATE: ChecklistState = { checkedIds: [], customItems: [] };

function keyFor(countryCode: string): string {
  return `checklist_${countryCode}_v1`;
}

export async function loadChecklist(countryCode: string): Promise<ChecklistState> {
  try {
    const raw = await Storage.getItem(keyFor(countryCode));
    if (raw == null) {
      return { ...EMPTY_STATE };
    }
    const parsed = JSON.parse(raw) as Partial<ChecklistState>;
    return {
      checkedIds: Array.isArray(parsed.checkedIds) ? parsed.checkedIds : [],
      customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export async function saveChecklist(
  countryCode: string,
  state: ChecklistState,
): Promise<void> {
  try {
    await Storage.setItem(keyFor(countryCode), JSON.stringify(state));
  } catch {
    // 저장 실패는 무시 (다음 변경 시 재시도)
  }
}
