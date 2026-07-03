import { beforeEach, describe, expect, it, vi } from "vitest";

import { dial } from "./links";

vi.mock("@apps-in-toss/web-framework", () => ({
  openURL: vi.fn(),
}));

import { openURL } from "@apps-in-toss/web-framework";

const openUrlMock = vi.mocked(openURL);

beforeEach(() => {
  openUrlMock.mockResolvedValue(undefined as never);
});

describe("dial", () => {
  it("숫자에서 tel: URI를 만들어 연다", async () => {
    await dial("110");
    expect(openUrlMock).toHaveBeenCalledWith("tel:110");
  });

  it("숫자/＋ 외 문자는 제거한다", async () => {
    await dial("+82-2-3210-0404");
    expect(openUrlMock).toHaveBeenCalledWith("tel:+82232100404");
  });

  it("유효한 번호가 없으면 아무것도 열지 않는다", async () => {
    await dial("---");
    await dial("");
    expect(openUrlMock).not.toHaveBeenCalled();
  });
});
