// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CountryProvider, useCountry } from "./CountryContext";

vi.mock("../lib/countryPreference", () => ({
  loadSelectedCountry: vi.fn(),
  saveSelectedCountry: vi.fn(),
}));
vi.mock("../lib/geo", () => ({
  detectCountryByGPS: vi.fn(),
}));

import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { detectCountryByGPS } from "../lib/geo";

const loadSaved = vi.mocked(loadSelectedCountry);
const saveSaved = vi.mocked(saveSelectedCountry);
const detectGPS = vi.mocked(detectCountryByGPS);

const wrapper = ({ children }: { children: ReactNode }) => (
  <CountryProvider>{children}</CountryProvider>
);

beforeEach(() => {
  loadSaved.mockResolvedValue(null);
  saveSaved.mockResolvedValue(undefined);
  detectGPS.mockResolvedValue(null);
});

describe("CountryContext 국가 결정 규칙", () => {
  it("저장된 수동 선택이 있으면 그것을 쓰고 GPS 감지는 하지 않는다", async () => {
    loadSaved.mockResolvedValue("TH");
    detectGPS.mockResolvedValue("US");

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(result.current.countryCode).toBe("TH"));
    expect(detectGPS).not.toHaveBeenCalled();
  });

  it("저장된 선택이 없으면 GPS로 감지한 국가를 쓴다", async () => {
    loadSaved.mockResolvedValue(null);
    detectGPS.mockResolvedValue("TH");

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(result.current.countryCode).toBe("TH"));
  });

  it("저장도 없고 GPS도 실패하면 기본 국가(JP)를 유지한다", async () => {
    loadSaved.mockResolvedValue(null);
    detectGPS.mockResolvedValue(null);

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(detectGPS).toHaveBeenCalled());
    await waitFor(() => expect(result.current.detecting).toBe(false));
    expect(result.current.countryCode).toBe("JP");
  });

  it("setCountryCode는 선택을 저장하고 즉시 반영한다", async () => {
    const { result } = renderHook(() => useCountry(), { wrapper });
    await waitFor(() => expect(result.current.detecting).toBe(false));

    act(() => result.current.setCountryCode("VN"));

    expect(result.current.countryCode).toBe("VN");
    expect(result.current.country.code).toBe("VN");
    expect(saveSaved).toHaveBeenCalledWith("VN");
  });
});
