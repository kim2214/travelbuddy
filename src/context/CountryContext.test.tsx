// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCountry } from "./CountryContext";
import { CountryProvider } from "./CountryProvider";

vi.mock("../lib/countryPreference", () => ({
  loadSelectedCountry: vi.fn(),
  saveSelectedCountry: vi.fn(),
}));
vi.mock("../lib/geo", () => ({
  detectCountryByGPS: vi.fn(),
}));
vi.mock("../lib/entry", () => ({
  getCountryFromEntry: vi.fn(),
}));

import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { detectCountryByGPS } from "../lib/geo";
import { getCountryFromEntry } from "../lib/entry";

const loadSaved = vi.mocked(loadSelectedCountry);
const saveSaved = vi.mocked(saveSelectedCountry);
const detectGPS = vi.mocked(detectCountryByGPS);
const fromEntry = vi.mocked(getCountryFromEntry);

const wrapper = ({ children }: { children: ReactNode }) => (
  <CountryProvider>{children}</CountryProvider>
);

beforeEach(() => {
  loadSaved.mockResolvedValue(null);
  saveSaved.mockResolvedValue(undefined);
  detectGPS.mockResolvedValue(null);
  fromEntry.mockReturnValue(null);
});

describe("CountryContext 국가 결정 규칙", () => {
  it("진입 스킴에 국가가 있으면 저장/GPS보다 우선하고 저장한다", async () => {
    fromEntry.mockReturnValue("VN");
    loadSaved.mockResolvedValue("JP"); // 저장된 선택이 있어도
    detectGPS.mockResolvedValue("US");

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(result.current.countryCode).toBe("VN"));
    expect(saveSaved).toHaveBeenCalledWith("VN");
    expect(detectGPS).not.toHaveBeenCalled();
  });

  it("저장된 선택이 있으면 그것을 쓰고, GPS는 자동으로 호출하지 않는다", async () => {
    loadSaved.mockResolvedValue("TH");
    detectGPS.mockResolvedValue("US");

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(result.current.countryCode).toBe("TH"));
    expect(detectGPS).not.toHaveBeenCalled();
  });

  it("저장된 선택이 없으면 GPS를 자동 호출하지 않고 기본 국가(JP)를 유지한다", async () => {
    loadSaved.mockResolvedValue(null);
    detectGPS.mockResolvedValue("TH");

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(loadSaved).toHaveBeenCalled());
    expect(result.current.countryCode).toBe("JP");
    expect(result.current.detecting).toBe(false);
    expect(detectGPS).not.toHaveBeenCalled();
  });

  it("detectByLocation은 사용자가 호출할 때만 GPS로 감지하고, 찾으면 반영·저장한다", async () => {
    detectGPS.mockResolvedValue("TH");

    const { result } = renderHook(() => useCountry(), { wrapper });
    await waitFor(() => expect(loadSaved).toHaveBeenCalled());

    let detected: string | null = null;
    await act(async () => {
      detected = await result.current.detectByLocation();
    });

    expect(detected).toBe("TH");
    expect(result.current.countryCode).toBe("TH");
    expect(result.current.detecting).toBe(false);
    expect(saveSaved).toHaveBeenCalledWith("TH");
  });

  it("detectByLocation이 국가를 못 찾으면 null을 반환하고 기존 국가를 유지한다", async () => {
    detectGPS.mockResolvedValue(null);

    const { result } = renderHook(() => useCountry(), { wrapper });
    await waitFor(() => expect(loadSaved).toHaveBeenCalled());

    let detected: string | null = "unset";
    await act(async () => {
      detected = await result.current.detectByLocation();
    });

    expect(detected).toBeNull();
    expect(result.current.countryCode).toBe("JP");
    expect(result.current.detecting).toBe(false);
  });

  it("진입 스킴이나 저장값이 있으면 첫 진입 힌트(needsCountryChoice)를 보이지 않는다", async () => {
    loadSaved.mockResolvedValue("TH");

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(result.current.countryCode).toBe("TH"));
    expect(result.current.needsCountryChoice).toBe(false);
  });

  it("저장값이 없으면 조회가 끝난 뒤 힌트를 보이고, 직접 고르면 사라진다", async () => {
    loadSaved.mockResolvedValue(null);

    const { result } = renderHook(() => useCountry(), { wrapper });

    // 조회 전에는 깜빡임 방지를 위해 false
    expect(result.current.needsCountryChoice).toBe(false);
    await waitFor(() => expect(result.current.needsCountryChoice).toBe(true));

    act(() => result.current.setCountryCode("VN"));

    expect(result.current.needsCountryChoice).toBe(false);
  });

  it("현재 위치로 찾기에 성공하면 힌트가 사라진다", async () => {
    loadSaved.mockResolvedValue(null);
    detectGPS.mockResolvedValue("TH");

    const { result } = renderHook(() => useCountry(), { wrapper });
    await waitFor(() => expect(result.current.needsCountryChoice).toBe(true));

    await act(async () => {
      await result.current.detectByLocation();
    });

    expect(result.current.needsCountryChoice).toBe(false);
  });

  it("setCountryCode는 선택을 저장하고 즉시 반영한다", async () => {
    const { result } = renderHook(() => useCountry(), { wrapper });
    await waitFor(() => expect(loadSaved).toHaveBeenCalled());

    act(() => result.current.setCountryCode("VN"));

    expect(result.current.countryCode).toBe("VN");
    expect(result.current.country.code).toBe("VN");
    expect(saveSaved).toHaveBeenCalledWith("VN");
  });
});
