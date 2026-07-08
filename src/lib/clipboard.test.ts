// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@apps-in-toss/web-framework", () => ({
  setClipboardText: vi.fn(),
}));

import { setClipboardText } from "@apps-in-toss/web-framework";

import { copyText } from "./clipboard";

const setClipboardMock = vi.mocked(setClipboardText);

beforeEach(() => {
  vi.restoreAllMocks();
  setClipboardMock.mockReset();
});

describe("copyText", () => {
  it("네이티브 브릿지로 복사하고 true를 반환한다", async () => {
    setClipboardMock.mockResolvedValue(undefined as never);

    const ok = await copyText("こんにちは");

    expect(ok).toBe(true);
    expect(setClipboardMock).toHaveBeenCalledWith("こんにちは");
  });

  it("브릿지 실패 시 navigator.clipboard로 폴백해 true를 반환한다", async () => {
    setClipboardMock.mockRejectedValue(new Error("no bridge"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const ok = await copyText("Hello");

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("Hello");
  });

  it("브릿지와 폴백이 모두 없으면 false를 반환한다", async () => {
    setClipboardMock.mockRejectedValue(new Error("no bridge"));
    vi.stubGlobal("navigator", {});

    const ok = await copyText("x");

    expect(ok).toBe(false);
  });
});
