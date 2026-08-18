// 국가별 면세 계산기 구매 내역(추가/삭제/비우기)을 관리하고 Storage에 동기화하는 훅.

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
  addItem: (amount: number) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export function useDutyFree(countryCode: string): UseDutyFreeResult {
  const [state, setState] = useState<DutyFreeState>(EMPTY_DUTY_FREE_STATE);
  const [loading, setLoading] = useState(true);

  // 국가가 바뀌면 해당 국가 내역을 로드해요.
  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadDutyFree(countryCode).then((loaded) => {
      if (active) {
        setState(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [countryCode]);

  // 로드가 끝나기 전의 조작은 무시해요 — 곧 도착할 로드 결과가 덮어써 유실돼요.
  const persist = useCallback(
    (next: DutyFreeState) => {
      if (loading) {
        return;
      }
      setState(next);
      void saveDutyFree(countryCode, next);
    },
    [countryCode, loading],
  );

  const addItem = useCallback(
    (amount: number) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }
      const seq = state.nextSeq;
      persist({
        items: [...state.items, { id: `buy_${countryCode}_${seq}`, amount }],
        nextSeq: seq + 1,
      });
    },
    [countryCode, state, persist],
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
