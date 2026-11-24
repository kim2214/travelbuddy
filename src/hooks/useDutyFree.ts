// 면세 계산기 구매 내역(추가/삭제/비우기)을 관리하고 Storage에 동기화하는 훅.
// 내역은 여행 전체에 하나예요. 여행지를 바꿔도 같은 목록에 이어서 쌓여요.

import { useCallback, useEffect, useState } from "react";

import {
  EMPTY_DUTY_FREE_STATE,
  loadDutyFree,
  saveDutyFree,
  type DutyFreeItem,
  type DutyFreeState,
} from "../lib/dutyFree";

export interface UseDutyFreeResult {
  items: DutyFreeItem[];
  loading: boolean;
  /** 구매 금액을 그 통화(ISO 4217 코드)와 함께 추가해요. */
  addItem: (amount: number, currency: string) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export function useDutyFree(): UseDutyFreeResult {
  const [state, setState] = useState<DutyFreeState>(EMPTY_DUTY_FREE_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadDutyFree().then((loaded) => {
      if (active) {
        setState(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 로드가 끝나기 전의 조작은 무시해요 — 곧 도착할 로드 결과가 덮어써 유실돼요.
  const persist = useCallback(
    (next: DutyFreeState) => {
      if (loading) {
        return;
      }
      setState(next);
      void saveDutyFree(next);
    },
    [loading],
  );

  const addItem = useCallback(
    (amount: number, currency: string) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }
      const seq = state.nextSeq;
      persist({
        items: [...state.items, { id: `buy_${seq}`, amount, currency }],
        nextSeq: seq + 1,
      });
    },
    [state, persist],
  );

  const removeItem = useCallback(
    (id: string) => {
      persist({ ...state, items: state.items.filter((item) => item.id !== id) });
    },
    [state, persist],
  );

  const clearAll = useCallback(() => {
    persist({ ...state, items: [] });
  }, [state, persist]);

  return { items: state.items, loading, addItem, removeItem, clearAll };
}
