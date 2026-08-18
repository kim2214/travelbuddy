import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchWeather, weatherInfoFor, weatherUrlFor, type Weather } from "./weather";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

const NOW = 1_700_000_000_000;
const HOUR = 60 * 60 * 1000;

const API_BODY = {
  current: { temperature_2m: 29.2, weather_code: 2 },
  daily: {
    time: ["2026-08-18", "2026-08-19"],
    weather_code: [2, 61],
    temperature_2m_max: [30.8, 30.6],
    temperature_2m_min: [22.6, 22.9],
    precipitation_probability_max: [6, 80],
  },
};

beforeEach(() => {
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe("weatherUrlFor", () => {
  it("Open-Meteo 요청 URL을 만든다", () => {
    const url = weatherUrlFor(35.68, 139.69);
    expect(url).toContain("https://api.open-meteo.com/v1/forecast?");
    expect(url).toContain("latitude=35.68");
    expect(url).toContain("longitude=139.69");
    expect(url).toContain("timezone=auto");
    expect(url).toContain("forecast_days=7");
  });
});

describe("weatherInfoFor", () => {
  it("WMO 코드를 이모지·한글로 바꾼다", () => {
    expect(weatherInfoFor(0)).toEqual({ emoji: "☀️", label: "맑음" });
    expect(weatherInfoFor(2)).toEqual({ emoji: "⛅", label: "구름 조금" });
    expect(weatherInfoFor(3)).toEqual({ emoji: "☁️", label: "흐림" });
    expect(weatherInfoFor(61).label).toBe("비");
    expect(weatherInfoFor(71).label).toBe("눈");
    expect(weatherInfoFor(95).label).toBe("뇌우");
  });

  it("알 수 없는 코드는 흐림으로 처리한다", () => {
    expect(weatherInfoFor(42).label).toBe("흐림");
  });
});

describe("fetchWeather", () => {
  it("지원하지 않는 국가는 요청 없이 null을 반환한다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWeather("XX", NOW)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("응답을 정규화하고 캐시에 저장한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(API_BODY)));

    const weather = await fetchWeather("JP", NOW);

    expect(weather).not.toBeNull();
    expect(weather!.currentTemp).toBe(29.2);
    expect(weather!.currentCode).toBe(2);
    expect(weather!.daily).toHaveLength(2);
    expect(weather!.daily[1]).toEqual({
      date: "2026-08-19",
      weatherCode: 61,
      tempMax: 30.6,
      tempMin: 22.9,
      rainProbability: 80,
    });
    expect(weather!.fetchedAt).toBe(NOW);
    expect(setItem).toHaveBeenCalledWith("weather_JP_v1", expect.any(String));
  });

  it("1시간 이내 캐시가 있으면 요청하지 않는다", async () => {
    const cached: Weather = {
      currentTemp: 20,
      currentCode: 0,
      daily: [
        { date: "2026-08-18", weatherCode: 0, tempMax: 25, tempMin: 18, rainProbability: 0 },
      ],
      fetchedAt: NOW - HOUR / 2,
    };
    getItem.mockResolvedValue(JSON.stringify(cached));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWeather("JP", NOW)).resolves.toEqual(cached);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("요청이 실패하면 만료된 캐시로 폴백한다", async () => {
    const stale: Weather = {
      currentTemp: 20,
      currentCode: 0,
      daily: [
        { date: "2026-08-17", weatherCode: 0, tempMax: 25, tempMin: 18, rainProbability: 0 },
      ],
      fetchedAt: NOW - 3 * HOUR,
    };
    getItem.mockResolvedValue(JSON.stringify(stale));
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(fetchWeather("JP", NOW)).resolves.toEqual(stale);
  });

  it("요청 실패에 캐시도 없으면 null을 반환한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(fetchWeather("JP", NOW)).resolves.toBeNull();
  });

  it("형태가 어긋난 응답은 실패로 처리한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ current: { temperature_2m: "hot" } })),
    );

    await expect(fetchWeather("JP", NOW)).resolves.toBeNull();
    expect(setItem).not.toHaveBeenCalled();
  });
});
