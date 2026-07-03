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
  it("국가 코드를 담은 딥링크로 공유 링크를 만들고 이름을 문구에 넣는다", async () => {
    await shareTravelBuddy({ code: "JP", name: "일본" });

    expect(getLink).toHaveBeenCalledWith(
      "intoss://travelbuddy?country=JP",
      expect.stringContaining("http"),
    );
    const message = shareFn.mock.calls[0][0].message;
    expect(message).toContain("일본");
    expect(message).toContain("https://toss.im/share/abc");
  });

  it("링크 생성이 실패해도 예외를 전파하지 않는다", async () => {
    getLink.mockRejectedValue(new Error("bridge unavailable"));
    await expect(shareTravelBuddy({ code: "TH", name: "태국" })).resolves.toBeUndefined();
    expect(shareFn).not.toHaveBeenCalled();
  });

  it("공유 취소(share 실패)도 조용히 무시한다", async () => {
    shareFn.mockRejectedValue(new Error("user cancelled"));
    await expect(shareTravelBuddy({ code: "US", name: "미국" })).resolves.toBeUndefined();
  });
});
