import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCountryFromEntry, getTabFromEntry } from "./entry";

vi.mock("@apps-in-toss/web-framework", () => ({
  getSchemeUri: vi.fn(),
}));

import { getSchemeUri } from "@apps-in-toss/web-framework";

const schemeUri = vi.mocked(getSchemeUri);

beforeEach(() => {
  schemeUri.mockReturnValue("");
});

describe("getCountryFromEntry", () => {
  it("country 파라미터의 지원 국가를 대문자로 반환한다", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?country=JP");
    expect(getCountryFromEntry()).toBe("JP");
  });

  it("소문자도 정규화한다", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?country=th");
    expect(getCountryFromEntry()).toBe("TH");
  });

  it("다른 파라미터가 섞여 있어도 country를 찾는다", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?utm=share&country=VN");
    expect(getCountryFromEntry()).toBe("VN");
  });

  it("지원하지 않는 국가는 null", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?country=DE");
    expect(getCountryFromEntry()).toBeNull();
  });

  it("쿼리가 없으면 null", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy");
    expect(getCountryFromEntry()).toBeNull();
  });

  it("빈 문자열이면 null", () => {
    schemeUri.mockReturnValue("");
    expect(getCountryFromEntry()).toBeNull();
  });

  it("스킴을 못 읽으면(throw) null", () => {
    schemeUri.mockImplementation(() => {
      throw new Error("no bridge");
    });
    expect(getCountryFromEntry()).toBeNull();
  });
});

describe("getTabFromEntry", () => {
  it("tab 파라미터의 탭 키를 반환한다", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?tab=checklist");
    expect(getTabFromEntry()).toBe("checklist");
  });

  it("대문자도 정규화한다", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?tab=GUIDE");
    expect(getTabFromEntry()).toBe("guide");
  });

  it("country와 함께 와도 각각 읽는다", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?country=JP&tab=exchange");
    expect(getTabFromEntry()).toBe("exchange");
    expect(getCountryFromEntry()).toBe("JP");
  });

  it("알 수 없는 탭은 null", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?tab=settings");
    expect(getTabFromEntry()).toBeNull();
  });

  it("파라미터가 없으면 null", () => {
    schemeUri.mockReturnValue("intoss://travelbuddy?country=JP");
    expect(getTabFromEntry()).toBeNull();
  });

  it("스킴을 못 읽으면(throw) null", () => {
    schemeUri.mockImplementation(() => {
      throw new Error("no bridge");
    });
    expect(getTabFromEntry()).toBeNull();
  });
});
