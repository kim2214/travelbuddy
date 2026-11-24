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
import { CountryProvider } from "../context/CountryProvider";
import { ExchangeRateProvider } from "../context/ExchangeRateProvider";
import { DutyFreeCalculator } from "./DutyFreeCalculator";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: 200, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  vi.mocked(loadSelectedCountry).mockResolvedValue(null);
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null); // 기본 국가 JP (JPY)
  // 1엔 = 10원, 1달러 = 1,333.33원 → 10,000엔 = 100,000원 = $75
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ result: "success", rates: { JPY: 0.1, USD: 0.00075 } }),
      ),
  );
});

function renderCalculator() {
  return render(
    <ThemeProvider>
      <CountryProvider>
        <ExchangeRateProvider>
          <DutyFreeCalculator />
        </ExchangeRateProvider>
      </CountryProvider>
    </ThemeProvider>,
  );
}

async function addAmount(amount: string) {
  const input = screen.getByPlaceholderText("구매할 때마다 추가해요");
  await userEvent.type(input, amount);
  await userEvent.click(screen.getByRole("button", { name: "추가" }));
}

describe("<DutyFreeCalculator />", () => {
  it("금액을 추가하면 USD로 환산해 합산하고 저장한다", async () => {
    renderCalculator();

    await addAmount("10000");

    // 10,000엔 ≈ $75 → 남은 한도 $725
    expect(await screen.findByText("≈ $75.00")).toBeInTheDocument();
    expect(screen.getByText(/남은 한도 \$725\.00/)).toBeInTheDocument();
    expect(Storage.setItem).toHaveBeenLastCalledWith(
      "dutyfree_trip_v2",
      JSON.stringify({ items: [{ id: "buy_0", amount: 10000, currency: "JPY" }], nextSeq: 1 }),
    );

    // 입력은 초기화돼요.
    expect(screen.getByPlaceholderText("구매할 때마다 추가해요")).toHaveValue("");
  });

  it("한도를 넘으면 초과 안내를 보여준다", async () => {
    renderCalculator();

    // 120,000엔 = $900 → $100 초과
    await addAmount("120000");

    expect(await screen.findByText(/한도를 \$100\.00 초과했어요/)).toBeInTheDocument();
  });

  it("저장된 내역을 복원한다", async () => {
    vi.mocked(Storage.getItem).mockImplementation(async (key: string) =>
      key === "dutyfree_trip_v2"
        ? JSON.stringify({
            items: [{ id: "buy_0", amount: 10000, currency: "JPY" }],
            nextSeq: 1,
          })
        : null,
    );

    renderCalculator();

    expect(await screen.findByText("¥10,000")).toBeInTheDocument();
    expect(await screen.findByText(/남은 한도 \$725\.00/)).toBeInTheDocument();
  });

  it("다른 나라에서 산 금액도 함께 합산한다", async () => {
    // 10,000엔 = $75, 100달러 = $100 → 합계 $175, 남은 한도 $625
    vi.mocked(Storage.getItem).mockImplementation(async (key: string) =>
      key === "dutyfree_trip_v2"
        ? JSON.stringify({
            items: [
              { id: "buy_0", amount: 10000, currency: "JPY" },
              { id: "buy_1", amount: 100, currency: "USD" },
            ],
            nextSeq: 2,
          })
        : null,
    );

    renderCalculator();

    expect(await screen.findByText("¥10,000")).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    // 통화가 섞이면 통화 코드를 함께 보여줘요.
    expect(await screen.findByText("JPY · ≈ $75.00")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
    expect(await screen.findByText(/남은 한도 \$625\.00/)).toBeInTheDocument();
  });

  it("국가별로 저장돼 있던 이전 내역을 옮겨 보여준다", async () => {
    vi.mocked(Storage.getItem).mockImplementation(async (key: string) =>
      key === "dutyfree_JP_v1"
        ? JSON.stringify({ items: [{ id: "buy_JP_0", amount: 10000 }], nextSeq: 1 })
        : null,
    );

    renderCalculator();

    expect(await screen.findByText("¥10,000")).toBeInTheDocument();
    expect(await screen.findByText(/남은 한도 \$725\.00/)).toBeInTheDocument();
  });

  it("삭제하면 합계에서 빠진다", async () => {
    renderCalculator();
    await addAmount("10000");
    await screen.findByText("≈ $75.00");

    await userEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(screen.queryByText("≈ $75.00")).not.toBeInTheDocument();
    expect(await screen.findByText(/남은 한도 \$800\.00/)).toBeInTheDocument();
  });

  it("전체 비우기로 내역을 초기화한다", async () => {
    renderCalculator();
    await addAmount("10000");
    await addAmount("5000");
    await screen.findByText("¥5,000");

    await userEvent.click(screen.getByText("전체 비우기"));

    expect(screen.queryByText("¥10,000")).not.toBeInTheDocument();
    expect(screen.queryByText("¥5,000")).not.toBeInTheDocument();
    expect(await screen.findByText(/남은 한도 \$800\.00/)).toBeInTheDocument();
  });
});
