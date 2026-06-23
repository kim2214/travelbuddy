// 국가별 체크리스트 상태(체크 토글 + 커스텀 항목 추가/삭제)를 관리하고 Storage에 동기화하는 훅.

import { useCallback, useEffect, useMemo, useState } from "react";

import { getCountry } from "../data/countries";
import {
  loadChecklist,
  saveChecklist,
  type ChecklistState,
  type CustomChecklistItem,
} from "../lib/checklistStorage";

export interface ChecklistRow {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  custom: boolean;
}

interface UseChecklistResult {
  rows: ChecklistRow[];
  checkedCount: number;
  totalCount: number;
  /** 0~1 진행률 */
  progress: number;
  loading: boolean;
  toggle: (id: string) => void;
  addCustom: (label: string) => void;
  removeCustom: (id: string) => void;
}

const EMPTY_STATE: ChecklistState = { checkedIds: [], customItems: [], nextSeq: 0 };

export function useChecklist(countryCode: string): UseChecklistResult {
  const country = useMemo(() => getCountry(countryCode), [countryCode]);
  const [state, setState] = useState<ChecklistState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);

  // 국가가 바뀌면 해당 국가 상태를 로드해요.
  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadChecklist(countryCode).then((loaded) => {
      if (active) {
        setState(loaded);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [countryCode]);

  // 상태 변경 시 Storage에 반영해요. (로딩 중에는 덮어쓰지 않아요)
  const persist = useCallback(
    (next: ChecklistState) => {
      setState(next);
      void saveChecklist(countryCode, next);
    },
    [countryCode],
  );

  const checkedSet = useMemo(() => new Set(state.checkedIds), [state.checkedIds]);

  const rows = useMemo<ChecklistRow[]>(() => {
    const presetRows: ChecklistRow[] = country.checklistPreset.map((item) => ({
      id: item.id,
      label: item.label,
      hint: item.hint,
      checked: checkedSet.has(item.id),
      custom: false,
    }));
    const customRows: ChecklistRow[] = state.customItems.map((item) => ({
      id: item.id,
      label: item.label,
      checked: checkedSet.has(item.id),
      custom: true,
    }));
    return [...presetRows, ...customRows];
  }, [country.checklistPreset, state.customItems, checkedSet]);

  const checkedCount = rows.filter((r) => r.checked).length;
  const totalCount = rows.length;
  const progress = totalCount === 0 ? 0 : checkedCount / totalCount;

  const toggle = useCallback(
    (id: string) => {
      const nextChecked = checkedSet.has(id)
        ? state.checkedIds.filter((x) => x !== id)
        : [...state.checkedIds, id];
      persist({ ...state, checkedIds: nextChecked });
    },
    [checkedSet, state, persist],
  );

  const addCustom = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (trimmed === "") {
        return;
      }
      const seq = state.nextSeq;
      const item: CustomChecklistItem = {
        id: `custom_${countryCode}_${seq}`,
        label: trimmed,
      };
      persist({
        ...state,
        customItems: [...state.customItems, item],
        nextSeq: seq + 1,
      });
    },
    [countryCode, state, persist],
  );

  const removeCustom = useCallback(
    (id: string) => {
      persist({
        ...state,
        checkedIds: state.checkedIds.filter((x) => x !== id),
        customItems: state.customItems.filter((x) => x.id !== id),
      });
    },
    [state, persist],
  );

  return {
    rows,
    checkedCount,
    totalCount,
    progress,
    loading,
    toggle,
    addCustom,
    removeCustom,
  };
}
