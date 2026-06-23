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
  /**
   * 커스텀 항목 id 생성용 단조 증가 시퀀스.
   * 항목을 삭제 후 다시 추가해도 id가 겹치지 않도록 절대 되돌리지 않아요.
   */
  nextSeq: number;
}

const EMPTY_STATE: ChecklistState = { checkedIds: [], customItems: [], nextSeq: 0 };

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
    const customItems = Array.isArray(parsed.customItems) ? parsed.customItems : [];
    return {
      checkedIds: Array.isArray(parsed.checkedIds) ? parsed.checkedIds : [],
      customItems,
      // 구버전 저장 데이터(nextSeq 없음)는 현재 항목 수 이후부터 시작해 기존 id와 겹치지 않게 해요.
      nextSeq: typeof parsed.nextSeq === "number" ? parsed.nextSeq : customItems.length,
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
