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
import { getCountry } from "../data/countries";
import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { detectCountryByGPS } from "../lib/geo";
import { CountryProvider } from "../context/CountryProvider";
import { ExchangeRateProvider } from "../context/ExchangeRateProvider";
import { TipCalculator } from "./TipCalculator";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  // jsdom에는 ResizeObserver가 없어요. SegmentedControl이 사용하므로 폴리필해요.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  // 저장된 선택을 미국으로 두어 통화(USD)가 미국이 되게 해요.
  vi.mocked(loadSelectedCountry).mockResolvedValue("US");
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null);
});

function renderTipCalculator() {
  const tipping = getCountry("US").tipping!;
  return render(
    <ThemeProvider>
      <CountryProvider>
        <ExchangeRateProvider>
          <TipCalculator tipping={tipping} />
        </ExchangeRateProvider>
      </CountryProvider>
    </ThemeProvider>,
  );
}

describe("<TipCalculator />", () => {
  it("결제 금액에 기본 팁 비율(18%)을 적용해 팁·합계를 계산한다", async () => {
    // 1 USD = 1,400원 (rates.USD = 1/1400)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ result: "success", rates: { USD: 1 / 1400 } })),
    );

    renderTipCalculator();

    const input = await screen.findByPlaceholderText("금액을 입력해요");
    await userEvent.type(input, "100");

    // 팁 18% = $18.00, 합계 = $118.00
    expect(await screen.findByText("$18.00")).toBeInTheDocument();
    expect(screen.getByText("$118.00")).toBeInTheDocument();
    // 합계 원화 환산: 118 × 1,400 = 165,200원
    expect(screen.getByText("합계 ≈ 165,200원")).toBeInTheDocument();
  });

  it("팁 비율을 20%로 바꾸면 팁이 다시 계산된다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ result: "success", rates: { USD: 1 / 1400 } })),
    );

    renderTipCalculator();
    const input = await screen.findByPlaceholderText("금액을 입력해요");
    await userEvent.type(input, "100");

    await userEvent.click(screen.getByText("20%"));

    // 팁 20% = $20.00, 합계 = $120.00
    expect(await screen.findByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText("$120.00")).toBeInTheDocument();
  });
});
