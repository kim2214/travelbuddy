import { beforeEach, describe, expect, it, vi } from "vitest";

import { shareTravelBuddy } from "./share";

vi.mock("@apps-in-toss/web-framework", () => ({
  getTossShareLink: vi.fn(),
  share: vi.fn(),
}));

import { getTossShareLink, share } from "@apps-in-toss/web-framework";

const getLink = vi.mocked(getTossShareLink);
const shareFn = vi.mocked(share);

beforeEach(() => {
  getLink.mockResolvedValue("https://toss.im/share/abc");
  shareFn.mockResolvedValue(undefined);
});

describe("shareTravelBuddy", () => {
  it("공유 링크를 만들어 국가 이름과 함께 공유 시트를 연다", async () => {
    await shareTravelBuddy("일본");

    expect(getLink).toHaveBeenCalledWith("intoss://travelbuddy");
    const message = shareFn.mock.calls[0][0].message;
    expect(message).toContain("일본");
    expect(message).toContain("https://toss.im/share/abc");
  });

  it("링크 생성이 실패해도 예외를 전파하지 않는다", async () => {
    getLink.mockRejectedValue(new Error("bridge unavailable"));
    await expect(shareTravelBuddy("태국")).resolves.toBeUndefined();
    expect(shareFn).not.toHaveBeenCalled();
  });

  it("공유 취소(share 실패)도 조용히 무시한다", async () => {
    shareFn.mockRejectedValue(new Error("user cancelled"));
    await expect(shareTravelBuddy("미국")).resolves.toBeUndefined();
  });
});
