// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChecklist } from "./useChecklist";

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

async function renderChecklist(code = "JP") {
  const view = renderHook(() => useChecklist(code));
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe("useChecklist", () => {
  it("프리셋 항목을 카테고리와 함께 로드한다", async () => {
    const { result } = await renderChecklist();
    const passport = result.current.rows.find((r) => r.id === "passport");
    expect(passport).toBeDefined();
    expect(passport?.category).toBe("서류");
    expect(result.current.totalCount).toBeGreaterThan(0);
    expect(result.current.checkedCount).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it("toggle이 체크 상태를 바꾸고 저장한다", async () => {
    const { result } = await renderChecklist();

    act(() => result.current.toggle("passport"));
    expect(result.current.rows.find((r) => r.id === "passport")?.checked).toBe(true);
    expect(result.current.checkedCount).toBe(1);
    expect(setItem).toHaveBeenCalled();

    act(() => result.current.toggle("passport"));
    expect(result.current.rows.find((r) => r.id === "passport")?.checked).toBe(false);
    expect(result.current.checkedCount).toBe(0);
  });

  it("addCustom이 공백을 제거해 기타 카테고리에 추가한다", async () => {
    const { result } = await renderChecklist();
    const before = result.current.totalCount;

    act(() => result.current.addCustom("  보조배터리  "));

    const added = result.current.rows.find((r) => r.custom);
    expect(added?.label).toBe("보조배터리");
    expect(added?.category).toBe("기타");
    expect(result.current.totalCount).toBe(before + 1);
  });

  it("공백만 입력하면 추가하지 않는다", async () => {
    const { result } = await renderChecklist();
    const before = result.current.totalCount;

    act(() => result.current.addCustom("   "));

    expect(result.current.totalCount).toBe(before);
  });

  it("removeCustom 후 재추가 시 id가 겹치지 않는다", async () => {
    const { result } = await renderChecklist();

    act(() => result.current.addCustom("칫솔"));
    const first = result.current.rows.find((r) => r.custom);
    expect(first).toBeDefined();

    act(() => result.current.toggle(first!.id));
    expect(result.current.rows.find((r) => r.id === first!.id)?.checked).toBe(true);

    act(() => result.current.removeCustom(first!.id));
    expect(result.current.rows.find((r) => r.id === first!.id)).toBeUndefined();
    // 체크 상태도 함께 제거돼요.
    expect(result.current.checkedCount).toBe(0);

    act(() => result.current.addCustom("칫솔"));
    const second = result.current.rows.find((r) => r.custom);
    expect(second!.id).not.toBe(first!.id);
  });

  it("저장된 상태(체크·커스텀)를 복원한다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({
        checkedIds: ["passport", "custom_JP_0"],
        customItems: [{ id: "custom_JP_0", label: "우산" }],
        nextSeq: 1,
      }),
    );
    const { result } = await renderChecklist();

    expect(result.current.rows.find((r) => r.id === "passport")?.checked).toBe(true);
    const custom = result.current.rows.find((r) => r.id === "custom_JP_0");
    expect(custom?.label).toBe("우산");
    expect(custom?.checked).toBe(true);
  });
});
