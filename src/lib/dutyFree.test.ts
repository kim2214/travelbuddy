import { beforeEach, describe, expect, it, vi } from "vitest";

import { DUTY_FREE_LIMIT_USD, loadDutyFree, saveDutyFree } from "./dutyFree";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);

beforeEach(() => {
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe("DUTY_FREE_LIMIT_USD", () => {
  it("한국 입국 기본 면세 한도는 US$800이다", () => {
    expect(DUTY_FREE_LIMIT_USD).toBe(800);
  });
});

describe("loadDutyFree", () => {
  it("저장된 값이 없으면 빈 상태를 반환한다", async () => {
    await expect(loadDutyFree("JP")).resolves.toEqual({ items: [], nextSeq: 0 });
    expect(getItem).toHaveBeenCalledWith("dutyfree_JP_v1");
  });

  it("저장된 내역을 복원한다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({ items: [{ id: "buy_JP_0", amount: 10000 }], nextSeq: 1 }),
    );
    await expect(loadDutyFree("JP")).resolves.toEqual({
      items: [{ id: "buy_JP_0", amount: 10000 }],
      nextSeq: 1,
    });
  });

  it("손상된 항목(음수·숫자 아님·id 누락)은 걸러낸다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        items: [
          { id: "ok", amount: 500 },
          { id: "neg", amount: -10 },
          { id: "nan", amount: "abc" },
          { amount: 100 },
          null,
        ],
        nextSeq: 5,
      }),
    );
    const state = await loadDutyFree("JP");
    expect(state.items).toEqual([{ id: "ok", amount: 500 }]);
    expect(state.nextSeq).toBe(5);
  });

  it("구버전 데이터(nextSeq 없음)는 항목 수부터 시작한다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({ items: [{ id: "a", amount: 1 }, { id: "b", amount: 2 }] }),
    );
    const state = await loadDutyFree("JP");
    expect(state.nextSeq).toBe(2);
  });

  it("손상된 JSON은 빈 상태로 처리한다", async () => {
    getItem.mockResolvedValue("not-json{");
    await expect(loadDutyFree("JP")).resolves.toEqual({ items: [], nextSeq: 0 });
  });
});

describe("saveDutyFree", () => {
  it("국가별 키로 직렬화해 저장한다", async () => {
    const state = { items: [{ id: "buy_TH_0", amount: 300 }], nextSeq: 1 };
    await saveDutyFree("TH", state);
    expect(setItem).toHaveBeenCalledWith("dutyfree_TH_v1", JSON.stringify(state));
  });

  it("저장 실패를 무시한다", async () => {
    setItem.mockRejectedValue(new Error("storage down"));
    await expect(saveDutyFree("TH", { items: [], nextSeq: 0 })).resolves.toBeUndefined();
  });
});
