// 면세 한도 계산기의 구매 내역(국가별)을 Storage에 영속화해요.
// 금액은 현지 통화 기준으로 저장하고, 화면에서 환율로 USD/원화 환산해요.

import { Storage } from "@apps-in-toss/web-framework";

/** 한국 입국 시 여행자 휴대품 기본 면세 한도 (미화 기준) */
export const DUTY_FREE_LIMIT_USD = 800;

export interface DutyFreeItem {
  id: string;
  /** 현지 통화 기준 구매 금액 */
  amount: number;
}

export interface DutyFreeState {
  items: DutyFreeItem[];
  /**
   * 항목 id 생성용 단조 증가 시퀀스.
   * 항목을 삭제 후 다시 추가해도 id가 겹치지 않도록 절대 되돌리지 않아요.
   */
  nextSeq: number;
}

export const EMPTY_DUTY_FREE_STATE: DutyFreeState = { items: [], nextSeq: 0 };

function keyFor(countryCode: string): string {
  return `dutyfree_${countryCode}_v1`;
}

export async function loadDutyFree(countryCode: string): Promise<DutyFreeState> {
  try {
    const raw = await Storage.getItem(keyFor(countryCode));
    if (raw == null) {
      return { ...EMPTY_DUTY_FREE_STATE };
    }
    const parsed = JSON.parse(raw) as Partial<DutyFreeState>;
    // 손상된 항목(id 누락, 금액이 양수 아님)은 걸러내요.
    const items = Array.isArray(parsed.items)
      ? parsed.items.filter(
          (item): item is DutyFreeItem =>
            item != null &&
            typeof (item as DutyFreeItem).id === "string" &&
            typeof (item as DutyFreeItem).amount === "number" &&
            Number.isFinite((item as DutyFreeItem).amount) &&
            (item as DutyFreeItem).amount > 0,
        )
      : [];
    return {
      items,
      // 구버전 데이터(nextSeq 없음)는 현재 항목 수 이후부터 시작해 기존 id와 겹치지 않게 해요.
      nextSeq: typeof parsed.nextSeq === "number" ? parsed.nextSeq : items.length,
    };
  } catch {
    return { ...EMPTY_DUTY_FREE_STATE };
  }
}

export async function saveDutyFree(
  countryCode: string,
  state: DutyFreeState,
): Promise<void> {
  try {
    await Storage.setItem(keyFor(countryCode), JSON.stringify(state));
  } catch {
    // 저장 실패는 무시 (다음 변경 시 재시도)
  }
}
