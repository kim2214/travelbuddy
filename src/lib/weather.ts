// 현지 날씨 조회/캐시 유틸.
// 무료·무키 API(Open-Meteo)에서 현재 날씨와 7일 예보를 받아오고, Storage에 캐시해요.
// 날씨는 자주 변하므로 캐시는 1시간만 신선한 것으로 봐요. 실패 시 오래된 캐시로 폴백해요.

import { Storage } from "@apps-in-toss/web-framework";

import { WEATHER_CITY_BY_COUNTRY } from "../data/weatherCities";
import { fetchWithTimeout } from "./fetchWithTimeout";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

export interface DailyForecast {
  /** 현지 기준 날짜 (YYYY-MM-DD) */
  date: string;
  /** WMO weather code */
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  /** 강수 확률 최대(%). 없으면 null이에요. */
  rainProbability: number | null;
}

export interface Weather {
  currentTemp: number;
  currentCode: number;
  daily: DailyForecast[];
  /** epoch ms */
  fetchedAt: number;
}

function cacheKeyFor(countryCode: string): string {
  return `weather_${countryCode}_v1`;
}

export function weatherUrlFor(latitude: number, longitude: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "7",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

/** WMO weather code를 이모지·한글 설명으로 바꿔요. */
export function weatherInfoFor(code: number): { emoji: string; label: string } {
  if (code === 0) {
    return { emoji: "☀️", label: "맑음" };
  }
  if (code === 1) {
    return { emoji: "🌤️", label: "대체로 맑음" };
  }
  if (code === 2) {
    return { emoji: "⛅", label: "구름 조금" };
  }
  if (code === 3) {
    return { emoji: "☁️", label: "흐림" };
  }
  if (code === 45 || code === 48) {
    return { emoji: "🌫️", label: "안개" };
  }
  if (code >= 51 && code <= 57) {
    return { emoji: "🌦️", label: "이슬비" };
  }
  if (code >= 61 && code <= 67) {
    return { emoji: "🌧️", label: "비" };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { emoji: "🌨️", label: "눈" };
  }
  if (code >= 80 && code <= 82) {
    return { emoji: "🌦️", label: "소나기" };
  }
  if (code >= 95) {
    return { emoji: "⛈️", label: "뇌우" };
  }
  return { emoji: "☁️", label: "흐림" };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** API 응답을 검증하고 우리 형태로 정규화해요. 형태가 어긋나면 null이에요. */
function normalizeResponse(data: unknown, fetchedAt: number): Weather | null {
  if (data == null || typeof data !== "object") {
    return null;
  }
  const { current, daily } = data as {
    current?: { temperature_2m?: unknown; weather_code?: unknown };
    daily?: {
      time?: unknown;
      weather_code?: unknown;
      temperature_2m_max?: unknown;
      temperature_2m_min?: unknown;
      precipitation_probability_max?: unknown;
    };
  };
  if (
    current == null ||
    !isFiniteNumber(current.temperature_2m) ||
    !isFiniteNumber(current.weather_code)
  ) {
    return null;
  }
  const times = daily?.time;
  const codes = daily?.weather_code;
  const maxes = daily?.temperature_2m_max;
  const mins = daily?.temperature_2m_min;
  const rains = daily?.precipitation_probability_max;
  if (
    !Array.isArray(times) ||
    !Array.isArray(codes) ||
    !Array.isArray(maxes) ||
    !Array.isArray(mins) ||
    times.length === 0
  ) {
    return null;
  }

  const forecasts: DailyForecast[] = [];
  for (let i = 0; i < times.length; i += 1) {
    const date = times[i];
    if (
      typeof date !== "string" ||
      !isFiniteNumber(codes[i]) ||
      !isFiniteNumber(maxes[i]) ||
      !isFiniteNumber(mins[i])
    ) {
      // 하루라도 형태가 어긋나면 그 뒤는 버리고 있는 것까지만 써요.
      break;
    }
    const rain = Array.isArray(rains) ? rains[i] : null;
    forecasts.push({
      date,
      weatherCode: codes[i] as number,
      tempMax: maxes[i] as number,
      tempMin: mins[i] as number,
      rainProbability: isFiniteNumber(rain) ? rain : null,
    });
  }
  if (forecasts.length === 0) {
    return null;
  }

  return {
    currentTemp: current.temperature_2m,
    currentCode: current.weather_code,
    daily: forecasts,
    fetchedAt,
  };
}

async function readCache(countryCode: string): Promise<Weather | null> {
  try {
    const raw = await Storage.getItem(cacheKeyFor(countryCode));
    if (raw == null) {
      return null;
    }
    return validateCached(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** 캐시된 Weather 형태를 검증해요. */
function validateCached(value: unknown): Weather | null {
  if (value == null || typeof value !== "object") {
    return null;
  }
  const cached = value as Partial<Weather>;
  if (
    !isFiniteNumber(cached.currentTemp) ||
    !isFiniteNumber(cached.currentCode) ||
    !isFiniteNumber(cached.fetchedAt) ||
    !Array.isArray(cached.daily) ||
    cached.daily.length === 0
  ) {
    return null;
  }
  return cached as Weather;
}

async function writeCache(countryCode: string, weather: Weather): Promise<void> {
  try {
    await Storage.setItem(cacheKeyFor(countryCode), JSON.stringify(weather));
  } catch {
    // 저장 실패는 무시해요.
  }
}

/**
 * 국가 대표 도시의 날씨를 가져와요.
 * 1) 1시간 이내 캐시가 있으면 그대로 사용
 * 2) 없으면 API 호출 → 성공 시 캐시 갱신
 * 3) 실패하면 오래된 캐시라도 폴백, 그것도 없으면 null (위젯 숨김)
 */
export async function fetchWeather(
  countryCode: string,
  now: number = Date.now(),
): Promise<Weather | null> {
  const city = WEATHER_CITY_BY_COUNTRY[countryCode];
  if (city == null) {
    return null;
  }

  const cached = await readCache(countryCode);
  if (cached != null) {
    const age = now - cached.fetchedAt;
    // age가 음수면(기기 시계 역행 등) 신선하다고 오판하지 않고 새로 받아요.
    if (age >= 0 && age < CACHE_TTL_MS) {
      return cached;
    }
  }

  try {
    const res = await fetchWithTimeout(weatherUrlFor(city.latitude, city.longitude));
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const weather = normalizeResponse(await res.json(), now);
    if (weather == null) {
      throw new Error("invalid weather response");
    }
    await writeCache(countryCode, weather);
    return weather;
  } catch {
    // 실패 시 만료된 캐시라도 폴백해요.
    return cached;
  }
}
