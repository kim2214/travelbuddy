import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadSelectedCountry, saveSelectedCountry } from "./countryPreference";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);

beforeEach(() => {
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe("loadSelectedCountry", () => {
  it("저장된 국가 코드를 반환한다", async () => {
    getItem.mockResolvedValue("TH");
    expect(await loadSelectedCountry()).toBe("TH");
    expect(getItem).toHaveBeenCalledWith("selected_country_v1");
  });

  it("저장된 값이 없으면 null을 반환한다", async () => {
    expect(await loadSelectedCountry()).toBeNull();
  });

  it("Storage 오류 시 null을 반환한다", async () => {
    getItem.mockRejectedValue(new Error("boom"));
    expect(await loadSelectedCountry()).toBeNull();
  });
});

describe("saveSelectedCountry", () => {
  it("국가 코드를 저장한다", async () => {
    await saveSelectedCountry("VN");
    expect(setItem).toHaveBeenCalledWith("selected_country_v1", "VN");
  });

  it("저장 실패는 예외를 던지지 않는다", async () => {
    setItem.mockRejectedValue(new Error("boom"));
    await expect(saveSelectedCountry("JP")).resolves.toBeUndefined();
  });
});
