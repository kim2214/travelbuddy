import { describe, expect, it } from "vitest";

import { COUNTRIES } from "./countries";
import { WEATHER_CITY_BY_COUNTRY } from "./weatherCities";

describe("WEATHER_CITY_BY_COUNTRY", () => {
  it("지원하는 모든 국가에 대표 도시가 있다", () => {
    for (const country of COUNTRIES) {
      expect(WEATHER_CITY_BY_COUNTRY[country.code], country.code).toBeDefined();
    }
  });

  it("지원하지 않는 국가 코드는 없다", () => {
    const supported = new Set(COUNTRIES.map((c) => c.code));
    for (const code of Object.keys(WEATHER_CITY_BY_COUNTRY)) {
      expect(supported.has(code), code).toBe(true);
    }
  });

  it("좌표가 유효한 범위에 있다", () => {
    for (const [code, city] of Object.entries(WEATHER_CITY_BY_COUNTRY)) {
      expect(city.label.trim(), code).not.toBe("");
      expect(Math.abs(city.latitude), code).toBeLessThanOrEqual(90);
      expect(Math.abs(city.longitude), code).toBeLessThanOrEqual(180);
    }
  });
});
