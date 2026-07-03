import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadChecklist, saveChecklist } from "./checklistStorage";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);

const EMPTY = { checkedIds: [], customItems: [], nextSeq: 0 };

beforeEach(() => {
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe("loadChecklist", () => {
  it("저장된 데이터가 없으면 빈 상태를 반환한다", async () => {
    expect(await loadChecklist("JP")).toEqual(EMPTY);
  });

  it("정상 데이터를 그대로 복원한다", async () => {
    const state = {
      checkedIds: ["preset-1", "custom-0"],
      customItems: [{ id: "custom-0", label: "보조배터리" }],
      nextSeq: 1,
    };
    getItem.mockResolvedValue(JSON.stringify(state));
    expect(await loadChecklist("JP")).toEqual(state);
  });

  it("JSON 파싱 실패 시 빈 상태를 반환한다", async () => {
    getItem.mockResolvedValue("{ not valid json");
    expect(await loadChecklist("JP")).toEqual(EMPTY);
  });

  it("손상된 customItems(문자열 아님/필드 누락)를 걸러낸다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        checkedIds: [],
        customItems: [
          { id: "custom-0", label: "정상" },
          { id: "custom-1" }, // label 없음
          { label: "id 없음" }, // id 없음
          null,
          "string-item",
          { id: 3, label: 5 }, // 숫자
        ],
        nextSeq: 5,
      }),
    );
    const result = await loadChecklist("JP");
    expect(result.customItems).toEqual([{ id: "custom-0", label: "정상" }]);
  });

  it("손상된 checkedIds(문자열 아님)를 걸러낸다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({ checkedIds: ["ok", 1, null, { a: 1 }], customItems: [], nextSeq: 0 }),
    );
    const result = await loadChecklist("JP");
    expect(result.checkedIds).toEqual(["ok"]);
  });

  it("구버전 데이터(nextSeq 없음)는 customItems 개수로 시퀀스를 초기화한다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        checkedIds: [],
        customItems: [
          { id: "custom-0", label: "a" },
          { id: "custom-1", label: "b" },
        ],
      }),
    );
    const result = await loadChecklist("JP");
    expect(result.nextSeq).toBe(2);
  });
});

describe("saveChecklist", () => {
  it("국가별 키로 직렬화해 저장한다", async () => {
    const state = { checkedIds: ["x"], customItems: [], nextSeq: 0 };
    await saveChecklist("TH", state);
    expect(setItem).toHaveBeenCalledWith("checklist_TH_v1", JSON.stringify(state));
  });

  it("저장 실패는 예외를 던지지 않고 무시한다", async () => {
    setItem.mockRejectedValue(new Error("quota exceeded"));
    await expect(
      saveChecklist("JP", { checkedIds: [], customItems: [], nextSeq: 0 }),
    ).resolves.toBeUndefined();
  });
});
