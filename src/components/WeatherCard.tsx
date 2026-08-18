// 현지 날씨 카드. 여행지 대표 도시의 현재 날씨와 7일 예보를 보여줘요.
// 오늘·내일 비 올 확률이 높으면 우산 안내를 함께 띄워요.
// 날씨를 못 받아오면(캐시도 없음) 부가 위젯이라 조용히 숨겨요.

import { Skeleton, Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useEffect, type CSSProperties } from "react";

import { logImpression } from "../lib/analytics";
import { parseDateString } from "../lib/departureDate";
import { weatherInfoFor, type DailyForecast } from "../lib/weather";
import { WEATHER_CITY_BY_COUNTRY } from "../data/weatherCities";
import { useCountry } from "../context/CountryContext";
import { useWeather } from "../hooks/useWeather";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 예보 열의 요일 라벨. 첫 칸은 현지 기준 오늘이에요. */
function dayLabel(date: string, index: number): string {
  if (index === 0) {
    return "오늘";
  }
  const parsed = parseDateString(date);
  return parsed == null ? "" : WEEKDAYS[parsed.getDay()];
}

/** 오늘·내일 강수 확률이 높으면 안내 문구를 만들어요. */
function rainNote(daily: DailyForecast[]): string | null {
  const today = daily[0];
  if (today?.rainProbability != null && today.rainProbability >= 60) {
    return `☔ 오늘 비 올 확률 ${today.rainProbability}%예요 · 우산을 챙기세요`;
  }
  const tomorrow = daily[1];
  if (tomorrow?.rainProbability != null && tomorrow.rainProbability >= 60) {
    return `☔ 내일 비 올 확률 ${tomorrow.rainProbability}%예요`;
  }
  return null;
}

export function WeatherCard() {
  const { country } = useCountry();
  const city = WEATHER_CITY_BY_COUNTRY[country.code];
  const { weather, loading } = useWeather(country.code);

  const hasWeather = weather != null;
  useEffect(() => {
    if (hasWeather) {
      logImpression("weather_view", { country: country.code });
    }
  }, [hasWeather, country.code]);

  const containerStyle: CSSProperties = {
    margin: "0 24px",
    padding: "18px 20px",
    borderRadius: 20,
    backgroundColor: adaptive.grey50,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Skeleton custom={["card"]} />
      </div>
    );
  }

  if (weather == null || city == null) {
    return null;
  }

  const current = weatherInfoFor(weather.currentCode);
  const today = weather.daily[0];
  const note = rainNote(weather.daily);

  return (
    <div style={containerStyle}>
      {/* 현재 날씨 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 32, lineHeight: "36px" }}>{current.emoji}</span>
          <Text
            typography="st3"
            fontWeight="bold"
            color={adaptive.grey800}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {Math.round(weather.currentTemp)}°
          </Text>
        </div>
        <Text
          typography="st12"
          color={adaptive.grey500}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          최고 {Math.round(today.tempMax)}° · 최저 {Math.round(today.tempMin)}°
        </Text>
      </div>
      <Text
        typography="t7"
        color={adaptive.grey600}
        style={{ display: "block", marginTop: 4 }}
      >
        {city.label} · {current.label}
      </Text>

      {/* 우산 안내 */}
      {note != null && (
        <Text
          typography="st12"
          fontWeight="semibold"
          color={adaptive.blue600}
          style={{ display: "block", marginTop: 8 }}
        >
          {note}
        </Text>
      )}

      {/* 7일 예보 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${weather.daily.length}, 1fr)`,
          gap: 2,
          marginTop: 14,
        }}
      >
        {weather.daily.map((day, index) => {
          const info = weatherInfoFor(day.weatherCode);
          return (
            <div key={day.date} style={{ textAlign: "center" }}>
              <Text
                typography="st12"
                fontWeight={index === 0 ? "semibold" : "regular"}
                color={index === 0 ? adaptive.grey700 : adaptive.grey400}
                style={{ display: "block" }}
              >
                {dayLabel(day.date, index)}
              </Text>
              <span
                style={{ display: "block", fontSize: 16, lineHeight: "22px", marginTop: 2 }}
              >
                {info.emoji}
              </span>
              <Text
                typography="st12"
                fontWeight="semibold"
                color={adaptive.grey800}
                style={{ display: "block", marginTop: 2, fontVariantNumeric: "tabular-nums" }}
              >
                {Math.round(day.tempMax)}°
              </Text>
              <Text
                typography="st12"
                color={adaptive.grey400}
                style={{ display: "block", fontVariantNumeric: "tabular-nums" }}
              >
                {Math.round(day.tempMin)}°
              </Text>
            </div>
          );
        })}
      </div>

      <Text
        typography="st12"
        color={adaptive.grey400}
        style={{ display: "block", textAlign: "right", marginTop: 10 }}
      >
        Open-Meteo 제공
      </Text>
    </div>
  );
}
