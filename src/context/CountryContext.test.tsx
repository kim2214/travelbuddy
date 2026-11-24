// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountry } from "./CountryContext";
import { COUNTRY_LOAD_TIMEOUT_MS, CountryProvider } from "./CountryProvider";

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

  it("저장값 조회 중에 사용자가 먼저 고르면, 늦게 도착한 저장값이 덮어쓰지 않는다", async () => {
    let resolveLoad: (value: string | null) => void = () => {};
    loadSaved.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );

    const { result } = renderHook(() => useCountry(), { wrapper });

    act(() => result.current.setCountryCode("VN"));
    await act(async () => {
      resolveLoad("TH");
    });

    expect(result.current.countryCode).toBe("VN");
    expect(result.current.ready).toBe(true);
    expect(result.current.needsCountryChoice).toBe(false);
  });

  it("저장값 조회가 끝나야 ready가 되고, 그때 저장된 국가가 이미 반영돼 있다", async () => {
    let resolveLoad: (value: string | null) => void = () => {};
    loadSaved.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );

    const { result } = renderHook(() => useCountry(), { wrapper });

    expect(result.current.ready).toBe(false);

    await act(async () => {
      resolveLoad("TH");
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.countryCode).toBe("TH");
  });

  it("진입 스킴에 국가가 있으면 조회 없이 바로 ready가 된다", async () => {
    fromEntry.mockReturnValue("VN");

    const { result } = renderHook(() => useCountry(), { wrapper });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.countryCode).toBe("VN");
    expect(loadSaved).not.toHaveBeenCalled();
  });
});

describe("CountryContext 저장값 조회 지연", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("조회가 오래 걸리면 기본 국가로 먼저 ready가 되고, 늦게 온 저장값도 반영한다", async () => {
    let resolveLoad: (value: string | null) => void = () => {};
    loadSaved.mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );

    const { result } = renderHook(() => useCountry(), { wrapper });
    expect(result.current.ready).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(COUNTRY_LOAD_TIMEOUT_MS);
    });

    expect(result.current.ready).toBe(true);
    expect(result.current.countryCode).toBe("JP");
    // 조회가 끝나지 않았으니 첫 진입 힌트는 아직 띄우지 않아요.
    expect(result.current.needsCountryChoice).toBe(false);

    await act(async () => {
      resolveLoad("TH");
    });

    expect(result.current.countryCode).toBe("TH");
  });
});
