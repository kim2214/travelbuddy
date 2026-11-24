import { beforeEach, describe, expect, it, vi } from "vitest";

import { coarsenCoordinate, detectCountryByGPS } from "./geo";

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

describe("coarsenCoordinate", () => {
  it("좌표를 소수 2자리(약 1km)로 반올림한다", () => {
    expect(coarsenCoordinate(37.566535)).toBe(37.57);
    expect(coarsenCoordinate(126.977969)).toBe(126.98);
    expect(coarsenCoordinate(-33.868819)).toBe(-33.87);
    expect(coarsenCoordinate(35.6)).toBe(35.6);
  });
});

describe("detectCountryByGPS", () => {
  it("외부 API에는 정확한 좌표 대신 반올림한 좌표만 보낸다", async () => {
    getLocation.mockResolvedValue({
      coords: { latitude: 35.681236, longitude: 139.767125 },
    } as never);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ countryCode: "JP" }));
    vi.stubGlobal("fetch", fetchMock);

    await detectCountryByGPS();

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("latitude=35.68&");
    expect(url).toContain("longitude=139.77&");
    expect(url).not.toContain("35.681236");
    expect(url).not.toContain("139.767125");
  });

  it("지원 국가면 대문자 코드로 반환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ countryCode: "jp" })));
    expect(await detectCountryByGPS()).toBe("JP");
  });

  it("지원하지 않는 국가면 null을 반환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ countryCode: "DE" })));
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
