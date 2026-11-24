import { beforeEach, describe, expect, it, vi } from "vitest";

import { DUTY_FREE_LIMIT_USD, loadDutyFree, saveDutyFree } from "./dutyFree";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);

beforeEach(() => {
  vi.clearAllMocks();
  getItem.mockReset();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe("DUTY_FREE_LIMIT_USD", () => {
  it("한국 입국 기본 면세 한도는 US$800이다", () => {
    expect(DUTY_FREE_LIMIT_USD).toBe(800);
  });
});

const KEY = "dutyfree_trip_v2";

/** 키별 저장값을 흉내 내요. 없는 키는 null이에요. */
function mockStorage(values: Record<string, string>) {
  getItem.mockImplementation(async (key: string) => values[key] ?? null);
}

describe("loadDutyFree", () => {
  it("저장된 내역을 복원한다", async () => {
    const state = { items: [{ id: "buy_0", amount: 10000, currency: "JPY" }], nextSeq: 1 };
    mockStorage({ [KEY]: JSON.stringify(state) });

    await expect(loadDutyFree()).resolves.toEqual(state);
    // 새 형식이 있으면 이전 키는 읽지 않아요.
    expect(getItem).toHaveBeenCalledTimes(1);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("손상된 항목(음수·숫자 아님·id 누락·통화 누락)은 걸러낸다", async () => {
    mockStorage({
      [KEY]: JSON.stringify({
        items: [
          { id: "ok", amount: 500, currency: "THB" },
          { id: "neg", amount: -10, currency: "THB" },
          { id: "nan", amount: "abc", currency: "THB" },
          { amount: 100, currency: "THB" },
          { id: "nocur", amount: 100 },
          null,
        ],
        nextSeq: 6,
      }),
    });

    const state = await loadDutyFree();
    expect(state.items).toEqual([{ id: "ok", amount: 500, currency: "THB" }]);
    expect(state.nextSeq).toBe(6);
  });

  it("손상된 JSON은 빈 상태로 처리한다", async () => {
    mockStorage({ [KEY]: "not-json{" });
    await expect(loadDutyFree()).resolves.toEqual({ items: [], nextSeq: 0 });
  });

  it("조회가 실패하면 빈 상태로 처리하고 덮어쓰지 않는다", async () => {
    getItem.mockRejectedValue(new Error("storage down"));
    await expect(loadDutyFree()).resolves.toEqual({ items: [], nextSeq: 0 });
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe("loadDutyFree — 국가별 이전 내역 옮기기", () => {
  it("이전 내역이 없으면 빈 목록을 새 형식으로 저장한다", async () => {
    await expect(loadDutyFree()).resolves.toEqual({ items: [], nextSeq: 0 });
    expect(setItem).toHaveBeenCalledWith(KEY, JSON.stringify({ items: [], nextSeq: 0 }));
  });

  it("여러 나라의 내역을 통화를 붙여 한 목록으로 합친다", async () => {
    mockStorage({
      dutyfree_JP_v1: JSON.stringify({
        items: [
          { id: "buy_JP_0", amount: 10000 },
          { id: "buy_JP_2", amount: 3000 },
        ],
        nextSeq: 3,
      }),
      dutyfree_TH_v1: JSON.stringify({ items: [{ id: "buy_TH_0", amount: 500 }], nextSeq: 1 }),
    });

    const expected = {
      items: [
        { id: "buy_0", amount: 10000, currency: "JPY" },
        { id: "buy_1", amount: 3000, currency: "JPY" },
        { id: "buy_2", amount: 500, currency: "THB" },
      ],
      nextSeq: 3,
    };
    await expect(loadDutyFree()).resolves.toEqual(expected);
    expect(setItem).toHaveBeenCalledWith(KEY, JSON.stringify(expected));
  });

  it("손상된 이전 내역은 건너뛰고 나머지를 옮긴다", async () => {
    mockStorage({
      dutyfree_JP_v1: "not-json{",
      dutyfree_TH_v1: JSON.stringify({
        items: [{ id: "a", amount: 500 }, { id: "b", amount: -1 }, null],
      }),
    });

    const state = await loadDutyFree();
    expect(state.items).toEqual([{ id: "buy_0", amount: 500, currency: "THB" }]);
  });
});

describe("saveDutyFree", () => {
  it("여행 전체 내역을 한 키에 저장한다", async () => {
    const state = { items: [{ id: "buy_0", amount: 300, currency: "THB" }], nextSeq: 1 };
    await saveDutyFree(state);
    expect(setItem).toHaveBeenCalledWith(KEY, JSON.stringify(state));
  });

  it("저장 실패를 무시한다", async () => {
    setItem.mockRejectedValue(new Error("storage down"));
    await expect(saveDutyFree({ items: [], nextSeq: 0 })).resolves.toBeUndefined();
  });
});
