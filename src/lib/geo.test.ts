import { beforeEach, describe, expect, it, vi } from "vitest";

import { detectCountryByGPS } from "./geo";

vi.mock("@apps-in-toss/web-framework", () => ({
  getCurrentLocation: vi.fn(),
  Accuracy: { Balanced: "balanced" },
}));

import { getCurrentLocation } from "@apps-in-toss/web-framework";

const getLocation = vi.mocked(getCurrentLocation);

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  // 서울 좌표 기본값
  getLocation.mockResolvedValue({ coords: { latitude: 35.6, longitude: 139.7 } } as never);
});

describe("detectCountryByGPS", () => {
  it("지원 국가면 대문자 코드로 반환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ countryCode: "jp" })));
    expect(await detectCountryByGPS()).toBe("JP");
  });

  it("지원하지 않는 국가면 null을 반환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ countryCode: "FR" })));
    expect(await detectCountryByGPS()).toBeNull();
  });

  it("역지오코딩 응답이 countryCode를 주지 않으면 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({})));
    expect(await detectCountryByGPS()).toBeNull();
  });

  it("역지오코딩 응답이 실패(ok=false)면 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ countryCode: "JP" }, false)));
    expect(await detectCountryByGPS()).toBeNull();
  });

  it("위치 권한 거부/오류 시 null을 반환한다", async () => {
    getLocation.mockRejectedValue(new Error("permission denied"));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await detectCountryByGPS()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("네트워크 오류 시 null을 반환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await detectCountryByGPS()).toBeNull();
  });
});
