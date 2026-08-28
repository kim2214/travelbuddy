// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
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
import { RateTrend } from "./RateTrend";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 500, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  vi.mocked(loadSelectedCountry).mockResolvedValue(null);
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null); // 기본 국가 JP (JPY)
});

/** 실시간 환율(open.er-api.com)과 과거 환율(jsdelivr)을 URL로 구분해 응답해요. */
function stubRatesFetch({
  currentJpyPerKrw,
  historyJpyPerKrw,
}: {
  currentJpyPerKrw: number;
  historyJpyPerKrw: number | null;
}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("open.er-api.com")) {
        return Promise.resolve(
          jsonResponse({ result: "success", rates: { JPY: currentJpyPerKrw } }),
        );
      }
      if (historyJpyPerKrw == null) {
        return Promise.resolve(jsonResponse({}, false));
      }
      return Promise.resolve(jsonResponse({ krw: { jpy: historyJpyPerKrw } }));
    }),
  );
}

function renderTrend() {
  return render(
    <ThemeProvider>
      <CountryProvider>
        <ExchangeRateProvider>
          <RateTrend />
        </ExchangeRateProvider>
      </CountryProvider>
    </ThemeProvider>,
  );
}

describe("<RateTrend />", () => {
  it("오늘 환율이 30일 평균보다 낮으면 '낮아요' 신호를 보여준다", async () => {
    // 과거 6일: 100엔 = 1,000원 / 오늘: 100엔 ≈ 909원 → 평균 987원보다 7.9% 낮음
    stubRatesFetch({ currentJpyPerKrw: 0.11, historyJpyPerKrw: 0.1 });

    renderTrend();

    expect(await screen.findByText(/% 낮아요/)).toBeInTheDocument();
    expect(screen.getByText(/지난 30일 평균\(987원\)보다/)).toBeInTheDocument();
    expect(screen.getByText("환율 추이 · 최근 30일")).toBeInTheDocument();
  });

  it("오늘 환율이 30일 평균보다 높으면 '높아요' 신호를 보여준다", async () => {
    // 과거 6일: 100엔 = 1,000원 / 오늘: 100엔 ≈ 1,111원
    stubRatesFetch({ currentJpyPerKrw: 0.09, historyJpyPerKrw: 0.1 });

    renderTrend();

    expect(await screen.findByText(/% 높아요/)).toBeInTheDocument();
  });

  it("과거 환율을 모두 못 받으면 아무것도 그리지 않는다", async () => {
    stubRatesFetch({ currentJpyPerKrw: 0.1, historyJpyPerKrw: null });

    const { container } = renderTrend();

    // 비동기 로드(저장된 국가 조회·환율 요청)가 모두 끝난 뒤에도 위젯이 없어요.
    await waitFor(() => {
      expect(vi.mocked(loadSelectedCountry)).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText("환율 추이 · 최근 30일")).not.toBeInTheDocument();
      expect(container.querySelector("svg")).not.toBeInTheDocument();
    });
  });
});
