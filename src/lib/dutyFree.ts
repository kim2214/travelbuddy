// 면세 한도 계산기의 구매 내역을 Storage에 영속화해요.
//
// 면세 한도는 한국 입국 한 번에 적용되므로, 여러 나라에서 산 금액을 한 목록에 모아요.
// 금액은 구매한 통화 그대로 저장하고(통화 코드 포함), 화면에서 환율로 USD/원화 환산해요.
// 여행이 끝나면 사용자가 전체 비우기로 목록을 비워요.

import { Storage } from "@apps-in-toss/web-framework";

import { COUNTRIES } from "../data/countries";

/** 한국 입국 시 여행자 휴대품 기본 면세 한도 (미화 기준) */
export const DUTY_FREE_LIMIT_USD = 800;

export interface DutyFreeItem {
  id: string;
  /** 구매한 통화 기준 금액 */
  amount: number;
  /** 구매한 통화의 ISO 4217 코드 (예: JPY) */
  currency: string;
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

const STORAGE_KEY = "dutyfree_trip_v2";

/** 국가별로 따로 저장하던 이전 버전의 키예요. 처음 한 번만 읽어서 한 목록으로 옮겨요. */
function legacyKeyFor(countryCode: string): string {
  return `dutyfree_${countryCode}_v1`;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function parseState(raw: string): DutyFreeState {
  const parsed = JSON.parse(raw) as Partial<DutyFreeState>;
  // 손상된 항목(id·통화 누락, 금액이 양수 아님)은 걸러내요.
  const items = Array.isArray(parsed.items)
    ? parsed.items.filter(
        (item): item is DutyFreeItem =>
          item != null &&
          typeof (item as DutyFreeItem).id === "string" &&
          typeof (item as DutyFreeItem).currency === "string" &&
          (item as DutyFreeItem).currency !== "" &&
          isPositiveNumber((item as DutyFreeItem).amount),
      )
    : [];
  return {
    items,
    nextSeq: typeof parsed.nextSeq === "number" ? parsed.nextSeq : items.length,
  };
}

/** 국가별 이전 내역을 모아 한 목록으로 만들어요. 금액에는 그 나라의 통화를 붙여요. */
async function loadLegacyItems(): Promise<DutyFreeState> {
  const perCountry = await Promise.all(
    COUNTRIES.map(async (country) => {
      const raw = await Storage.getItem(legacyKeyFor(country.code));
      if (raw == null) {
        return [];
      }
      try {
        const parsed = JSON.parse(raw) as { items?: unknown };
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        return items
          .map((item) => (item as { amount?: unknown } | null)?.amount)
          .filter(isPositiveNumber)
          .map((amount) => ({ amount, currency: country.currency }));
      } catch {
        // 손상된 JSON은 건너뛰어요.
        return [];
      }
    }),
  );
  const items = perCountry.flat().map((item, index) => ({ id: `buy_${index}`, ...item }));
  return { items, nextSeq: items.length };
}

export async function loadDutyFree(): Promise<DutyFreeState> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (raw != null) {
      return parseState(raw);
    }
    // 새 형식으로 저장된 적이 없으면 이전 내역을 옮겨요. 옮긴 결과를 바로 저장해
    // 다음부터는 이전 키를 다시 읽지 않아요. (이전 키는 지우지 않고 남겨 둬요)
    const migrated = await loadLegacyItems();
    await saveDutyFree(migrated);
    return migrated;
  } catch {
    return { ...EMPTY_DUTY_FREE_STATE };
  }
}

export async function saveDutyFree(state: DutyFreeState): Promise<void> {
  try {
    await Storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패는 무시 (다음 변경 시 재시도)
  }
}
