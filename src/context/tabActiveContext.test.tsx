// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));
// 날씨는 이미 받아온 상태로 고정해요(노출 로그 조건만 확인하려는 테스트예요).
vi.mock("../hooks/useWeather", () => ({
  useWeather: () => ({
    loading: false,
    weather: {
      currentTemp: 20,
      currentCode: 0,
      fetchedAt: 0,
      daily: [
        { date: "2024-01-01", weatherCode: 0, tempMax: 22, tempMin: 15, rainProbability: 0 },
      ],
    },
  }),
}));
vi.mock("../lib/countryPreference", () => ({
  loadSelectedCountry: vi.fn(),
  saveSelectedCountry: vi.fn(),
}));
vi.mock("../lib/geo", () => ({ detectCountryByGPS: vi.fn() }));
vi.mock("../lib/analytics", () => ({ logEvent: vi.fn(), logImpression: vi.fn() }));

import { ThemeProvider } from "@toss/tds-mobile";

import { WeatherCard } from "../components/WeatherCard";
import { logImpression } from "../lib/analytics";
import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { CountryProvider } from "./CountryProvider";
import { TabActiveContext } from "./tabActiveContext";

beforeEach(() => {
  vi.mocked(logImpression).mockClear();
  vi.mocked(loadSelectedCountry).mockResolvedValue("JP");
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
});

function tree(active: boolean | null) {
  const card =
    active == null ? (
      <WeatherCard />
    ) : (
      <TabActiveContext.Provider value={active}>
        <WeatherCard />
      </TabActiveContext.Provider>
    );
  return (
    <ThemeProvider>
      <CountryProvider>{card}</CountryProvider>
    </ThemeProvider>
  );
}

describe("TabActiveContext", () => {
  it("Provider가 없으면 보이는 것으로 보고 노출을 기록한다", async () => {
    render(tree(null));
    await waitFor(() => {
      expect(logImpression).toHaveBeenCalledWith("weather_view", { country: "JP" });
    });
  });

  it("숨겨진 탭에서는 노출을 기록하지 않고, 다시 보이면 기록한다", async () => {
    const view = render(tree(false));
    // 저장된 국가 로드가 끝날 때까지 기다려도 숨겨진 동안에는 기록하지 않아요.
    await waitFor(() => {
      expect(loadSelectedCountry).toHaveBeenCalled();
    });
    expect(logImpression).not.toHaveBeenCalled();

    view.rerender(tree(true));
    await waitFor(() => {
      expect(logImpression).toHaveBeenCalledWith("weather_view", { country: "JP" });
    });
    expect(logImpression).toHaveBeenCalledTimes(1);
  });
});
