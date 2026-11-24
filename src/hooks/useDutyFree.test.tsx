// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

import { useDutyFree } from "./useDutyFree";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);
const KEY = "dutyfree_trip_v2";

beforeEach(() => {
  vi.clearAllMocks();
  getItem.mockReset();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

async function renderLoaded() {
  const view = renderHook(() => useDutyFree());
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe("useDutyFree", () => {
  it("통화가 다른 구매를 한 목록에 이어서 쌓고 저장한다", async () => {
    const { result } = await renderLoaded();

    act(() => result.current.addItem(10000, "JPY"));
    act(() => result.current.addItem(500, "THB"));

    const items = [
      { id: "buy_0", amount: 10000, currency: "JPY" },
      { id: "buy_1", amount: 500, currency: "THB" },
    ];
    expect(result.current.items).toEqual(items);
    expect(setItem).toHaveBeenLastCalledWith(KEY, JSON.stringify({ items, nextSeq: 2 }));
  });

  it("0 이하이거나 숫자가 아닌 금액은 추가하지 않는다", async () => {
    const { result } = await renderLoaded();
    setItem.mockClear();

    act(() => result.current.addItem(0, "JPY"));
    act(() => result.current.addItem(-5, "JPY"));
    act(() => result.current.addItem(Number.NaN, "JPY"));

    expect(result.current.items).toEqual([]);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("삭제한 뒤 다시 추가해도 id가 겹치지 않는다", async () => {
    const { result } = await renderLoaded();
    act(() => result.current.addItem(100, "USD"));
    act(() => result.current.addItem(200, "USD"));

    act(() => result.current.removeItem("buy_1"));
    act(() => result.current.addItem(300, "USD"));

    expect(result.current.items.map((item) => item.id)).toEqual(["buy_0", "buy_2"]);
  });

  it("전체 비우기는 목록만 비우고 id 순번은 이어간다", async () => {
    const { result } = await renderLoaded();
    act(() => result.current.addItem(100, "USD"));

    act(() => result.current.clearAll());
    expect(result.current.items).toEqual([]);
    expect(setItem).toHaveBeenLastCalledWith(KEY, JSON.stringify({ items: [], nextSeq: 1 }));

    act(() => result.current.addItem(200, "USD"));
    expect(result.current.items[0].id).toBe("buy_1");
  });

  it("불러오는 중의 조작은 무시해 저장된 내역을 덮어쓰지 않는다", async () => {
    let resolveLoad!: (value: string | null) => void;
    getItem.mockReturnValue(
      new Promise<string | null>((res) => {
        resolveLoad = res;
      }),
    );
    const { result } = renderHook(() => useDutyFree());

    act(() => result.current.addItem(999, "USD"));
    act(() => result.current.clearAll());
    expect(setItem).not.toHaveBeenCalled();

    const saved = { items: [{ id: "buy_0", amount: 10000, currency: "JPY" }], nextSeq: 1 };
    resolveLoad(JSON.stringify(saved));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toEqual(saved.items);
  });
});
