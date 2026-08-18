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
import { useCountry } from "../context/CountryContext";
import { CountryProvider } from "../context/CountryProvider";
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

// 국가 변경 테스트용 트리거. 실제 앱의 CountryPickerSheet 역할을 대신해요.
function CountrySwitcher({ to }: { to: string }) {
  const { setCountryCode } = useCountry();
  return (
    <button type="button" onClick={() => setCountryCode(to)}>
      국가 변경
    </button>
  );
}

function renderConverterWithSwitcher(to: string) {
  return render(
    <ThemeProvider>
      <CountryProvider>
        <ExchangeRateProvider>
          <CountrySwitcher to={to} />
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

  it("금액을 이어서 입력해도 콤마가 누적되지 않는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ result: "success", rates: { JPY: 0.1 } })),
    );

    renderConverter();
    await screen.findByText("₩ 100,000");

    const field = screen.getByPlaceholderText("금액을 입력해요");
    await userEvent.clear(field);
    await userEvent.type(field, "1000000");

    // 이전에는 "1,0,0,0,000"처럼 콤마가 누적됐어요.
    expect(field).toHaveValue("1,000,000");
    // 1,000,000엔 → 10,000,000원
    expect(await screen.findByText("₩ 10,000,000")).toBeInTheDocument();
  });

  it("국가를 바꾸면 입력 금액이 새 통화의 기본값으로 리셋된다", async () => {
    // 1엔 = 10원, 1달러 = 1,250원
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ result: "success", rates: { JPY: 0.1, USD: 0.0008 } }),
        ),
    );

    renderConverterWithSwitcher("US");

    // 기본 국가 일본: ¥10,000 → 100,000원
    expect(await screen.findByText("₩ 100,000")).toBeInTheDocument();

    await userEvent.click(screen.getByText("국가 변경"));

    // 미국 전환 시 입력이 $100으로 리셋: $100 → 125,000원
    // (이전 값이 남으면 $10,000 → 12,500,000원이 돼요)
    expect(await screen.findByText("₩ 125,000")).toBeInTheDocument();
  });

  it("KRW 입력 모드에서는 국가를 바꿔도 입력 금액을 유지한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ result: "success", rates: { JPY: 0.1, USD: 0.0008 } }),
        ),
    );

    renderConverterWithSwitcher("US");
    await screen.findByText("₩ 100,000");

    // KRW 입력 모드로 전환: ₩10,000 → ¥1,000
    await userEvent.click(screen.getByText("⇅ 방향 바꾸기"));
    await screen.findByText("¥ 1,000");

    // 국가를 바꿔도 입력 통화는 여전히 KRW라 값이 유지돼요: ₩10,000 → $8.00
    await userEvent.click(screen.getByText("국가 변경"));
    expect(await screen.findByText("$ 8.00")).toBeInTheDocument();
  });

  it("환율을 못 받고 캐시도 없으면 재시도 안내를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderConverter();

    expect(await screen.findByText("환율을 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
  });
});
