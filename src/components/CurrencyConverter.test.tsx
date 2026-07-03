// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));
vi.mock("../lib/countryPreference", () => ({
  loadSelectedCountry: vi.fn(),
  saveSelectedCountry: vi.fn(),
}));
vi.mock("../lib/geo", () => ({ detectCountryByGPS: vi.fn() }));

import { ThemeProvider } from "@toss/tds-mobile";

import { Storage } from "@apps-in-toss/web-framework";
import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { detectCountryByGPS } from "../lib/geo";
import { CountryProvider } from "../context/CountryContext";
import { ExchangeRateProvider } from "../context/ExchangeRateProvider";
import { CurrencyConverter } from "./CurrencyConverter";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  vi.mocked(loadSelectedCountry).mockResolvedValue(null);
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null); // 기본 국가 JP (JPY)
});

function renderConverter() {
  return render(
    <ThemeProvider>
      <CountryProvider>
        <ExchangeRateProvider>
          <CurrencyConverter />
        </ExchangeRateProvider>
      </CountryProvider>
    </ThemeProvider>,
  );
}

describe("<CurrencyConverter />", () => {
  it("환율을 받아 기본 입력(10,000엔)을 원화로 환산해 보여준다", async () => {
    // 1엔 = 10원 (rates.JPY = 0.1 → 1 KRW당 0.1엔)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ result: "success", rates: { JPY: 0.1 } })),
    );

    renderConverter();

    // 10,000엔 → 100,000원
    expect(await screen.findByText("₩ 100,000")).toBeInTheDocument();
  });

  it("방향 바꾸기를 누르면 KRW→JPY로 환산한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ result: "success", rates: { JPY: 0.1 } })),
    );

    renderConverter();
    await screen.findByText("₩ 100,000");

    await userEvent.click(screen.getByText("⇅ 방향 바꾸기"));

    // 10,000원 → 1,000엔
    expect(await screen.findByText("¥ 1,000")).toBeInTheDocument();
  });

  it("환율을 못 받고 캐시도 없으면 재시도 안내를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderConverter();

    expect(await screen.findByText("환율을 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });
});
