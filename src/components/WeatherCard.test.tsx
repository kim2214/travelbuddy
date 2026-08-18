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
import { WeatherCard } from "./WeatherCard";

function jsonResponse(body: unknown, ok = true): Response {
  return { ok, status: 200, json: async () => body } as unknown as Response;
}

function apiBody(rainToday: number, rainTomorrow: number) {
  return {
    // 현재 기온은 예보 열의 값들과 겹치지 않게 골라요 (getByText 중복 방지).
    current: { temperature_2m: 27.6, weather_code: 2 },
    daily: {
      time: ["2026-08-18", "2026-08-19", "2026-08-20"],
      weather_code: [2, 61, 0],
      temperature_2m_max: [30.8, 30.6, 29.1],
      temperature_2m_min: [22.6, 22.9, 21.4],
      precipitation_probability_max: [rainToday, rainTomorrow, 10],
    },
  };
}

beforeEach(() => {
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  vi.mocked(loadSelectedCountry).mockResolvedValue(null);
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null); // 기본 국가 JP (도쿄)
});

function renderCard() {
  return render(
    <ThemeProvider>
      <CountryProvider>
        <WeatherCard />
      </CountryProvider>
    </ThemeProvider>,
  );
}

describe("<WeatherCard />", () => {
  it("현재 날씨와 7일 예보를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(apiBody(6, 20))));

    renderCard();

    expect(await screen.findByText("28°")).toBeInTheDocument();
    expect(screen.getByText("도쿄 · 구름 조금")).toBeInTheDocument();
    expect(screen.getByText("최고 31° · 최저 23°")).toBeInTheDocument();
    expect(screen.getByText("오늘")).toBeInTheDocument();
    // 확률이 낮으면 우산 안내가 없어요.
    expect(screen.queryByText(/우산/)).not.toBeInTheDocument();
  });

  it("오늘 비 올 확률이 높으면 우산 안내를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(apiBody(90, 20))));

    renderCard();

    expect(
      await screen.findByText("☔ 오늘 비 올 확률 90%예요 · 우산을 챙기세요"),
    ).toBeInTheDocument();
  });

  it("내일 비 올 확률이 높으면 내일 안내를 보여준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(apiBody(10, 80))));

    renderCard();

    expect(await screen.findByText("☔ 내일 비 올 확률 80%예요")).toBeInTheDocument();
  });

  it("날씨를 못 받아오면(캐시도 없음) 아무것도 그리지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    renderCard();

    await waitFor(() => {
      expect(vi.mocked(detectCountryByGPS)).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.queryByText("Open-Meteo 제공")).not.toBeInTheDocument();
    });
  });
});
