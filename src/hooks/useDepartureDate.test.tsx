// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

import { todayDateString } from "../lib/departureDate";
import { useDepartureDate } from "./useDepartureDate";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);
const removeItem = vi.mocked(Storage.removeItem);

beforeEach(() => {
  vi.clearAllMocks();
  getItem.mockReset();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
  removeItem.mockResolvedValue(undefined);
});

async function renderLoaded(code = "JP") {
  const view = renderHook(({ c }) => useDepartureDate(c), { initialProps: { c: code } });
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe("useDepartureDate", () => {
  it("저장된 출발일이 없으면 미설정이다", async () => {
    const { result } = await renderLoaded();
    expect(result.current.date).toBeNull();
    expect(result.current.dday).toBeNull();
    expect(getItem).toHaveBeenCalledWith("departure_JP_v1");
  });

  it("저장된 출발일을 복원하고 남은 일수를 계산한다", async () => {
    getItem.mockResolvedValue(todayDateString());
    const { result } = await renderLoaded();
    expect(result.current.date).toBe(todayDateString());
    expect(result.current.dday).toBe(0);
  });

  it("출발일을 정하면 저장한다", async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setDate("2030-01-15"));

    expect(result.current.date).toBe("2030-01-15");
    expect(setItem).toHaveBeenCalledWith("departure_JP_v1", "2030-01-15");
  });

  it("없는 날짜나 형식이 틀린 값은 무시한다", async () => {
    const { result } = await renderLoaded();
    act(() => result.current.setDate("2030-02-31"));
    act(() => result.current.setDate("내일"));

    expect(result.current.date).toBeNull();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("지우면 미설정으로 돌아가고 저장값도 지운다", async () => {
    getItem.mockResolvedValue("2030-01-15");
    const { result } = await renderLoaded();
    act(() => result.current.clear());

    expect(result.current.date).toBeNull();
    expect(removeItem).toHaveBeenCalledWith("departure_JP_v1");
  });

  it("불러오는 중의 조작은 무시한다", async () => {
    let resolveLoad!: (value: string | null) => void;
    getItem.mockReturnValue(
      new Promise<string | null>((res) => {
        resolveLoad = res;
      }),
    );
    const { result } = renderHook(() => useDepartureDate("JP"));

    act(() => result.current.setDate("2030-01-15"));
    act(() => result.current.clear());
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();

    resolveLoad("2031-05-05");
    await waitFor(() => expect(result.current.date).toBe("2031-05-05"));
  });

  it("국가를 바꾸면 그 국가의 출발일을 불러오고, 그 국가 키에 저장한다", async () => {
    getItem.mockImplementation(async (key: string) =>
      key === "departure_TH_v1" ? "2030-03-03" : "2030-01-15",
    );
    const { result, rerender } = await renderLoaded("JP");
    expect(result.current.date).toBe("2030-01-15");

    rerender({ c: "TH" });
    await waitFor(() => expect(result.current.date).toBe("2030-03-03"));

    act(() => result.current.setDate("2030-04-04"));
    expect(setItem).toHaveBeenCalledWith("departure_TH_v1", "2030-04-04");
  });
});
