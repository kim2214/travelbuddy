import { describe, expect, it } from "vitest";

import { currentTimeDiff, formatTimeDiff, minutesAheadOfKorea } from "./timeDiff";

const WINTER = new Date("2026-01-15T03:00:00Z");
const SUMMER = new Date("2026-07-15T03:00:00Z");

describe("minutesAheadOfKorea", () => {
  it("서머타임이 없는 곳은 계절과 무관하게 같다", () => {
    expect(minutesAheadOfKorea("Asia/Tokyo", WINTER)).toBe(0);
    expect(minutesAheadOfKorea("Asia/Tokyo", SUMMER)).toBe(0);
    expect(minutesAheadOfKorea("Asia/Bangkok", SUMMER)).toBe(-120);
    expect(minutesAheadOfKorea("Pacific/Guam", WINTER)).toBe(60);
  });

  it("서머타임에 따라 시차가 달라진다", () => {
    expect(minutesAheadOfKorea("Europe/Paris", WINTER)).toBe(-8 * 60);
    expect(minutesAheadOfKorea("Europe/Paris", SUMMER)).toBe(-7 * 60);
    expect(minutesAheadOfKorea("America/Los_Angeles", WINTER)).toBe(-17 * 60);
    expect(minutesAheadOfKorea("America/Los_Angeles", SUMMER)).toBe(-16 * 60);
    // 남반구는 한국의 겨울이 서머타임이에요.
    expect(minutesAheadOfKorea("Australia/Sydney", WINTER)).toBe(2 * 60);
    expect(minutesAheadOfKorea("Australia/Sydney", SUMMER)).toBe(1 * 60);
  });

  it("해석할 수 없는 시간대는 null이다", () => {
    expect(minutesAheadOfKorea("Not/AZone", WINTER)).toBeNull();
  });
});

describe("formatTimeDiff", () => {
  it("시차가 없으면 없다고 안내한다", () => {
    expect(formatTimeDiff(0)).toEqual({ long: "한국과 시차가 없어요", short: "없음" });
  });

  it("느리면 −, 빠르면 +로 표기한다", () => {
    expect(formatTimeDiff(-120)).toEqual({ long: "한국보다 2시간 느려요", short: "−2시간" });
    expect(formatTimeDiff(60)).toEqual({ long: "한국보다 1시간 빨라요", short: "+1시간" });
  });

  it("30분 단위 시차도 표기한다", () => {
    expect(formatTimeDiff(-210).short).toBe("−3시간 30분");
  });

  it("기준 도시가 있으면 문장에만 붙인다", () => {
    expect(formatTimeDiff(-960, "LA")).toEqual({
      long: "LA 기준 한국보다 16시간 느려요",
      short: "−16시간",
    });
  });
});

describe("currentTimeDiff", () => {
  const fallback = { long: "고정 문구", short: "고정" };

  it("지금 시각 기준으로 계산한다", () => {
    expect(currentTimeDiff({ timeZone: "Europe/London" }, fallback, SUMMER).short).toBe("−8시간");
    expect(currentTimeDiff({ timeZone: "Europe/London" }, fallback, WINTER).short).toBe("−9시간");
  });

  it("계산할 수 없으면 고정 문구를 쓴다", () => {
    expect(currentTimeDiff({ timeZone: "Not/AZone" }, fallback, SUMMER)).toEqual(fallback);
  });
});
