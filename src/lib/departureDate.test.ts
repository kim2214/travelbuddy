import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearDepartureDate,
  daysUntil,
  formatDepartureDate,
  loadDepartureDate,
  parseDateString,
  saveDepartureDate,
  todayDateString,
} from "./departureDate";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
}));

import { Storage } from "@apps-in-toss/web-framework";

const getItem = vi.mocked(Storage.getItem);
const setItem = vi.mocked(Storage.setItem);
const removeItem = vi.mocked(Storage.removeItem);

const NOW = 1_700_000_000_000;

/** NOW 기준 daysOffset일 후의 로컬 날짜 문자열(YYYY-MM-DD)을 만들어요. */
function dateStringFromNow(daysOffset: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysOffset);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

beforeEach(() => {
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
  removeItem.mockResolvedValue(undefined);
});

describe("parseDateString", () => {
  it("올바른 YYYY-MM-DD를 파싱한다", () => {
    const parsed = parseDateString("2025-08-23");
    expect(parsed?.getFullYear()).toBe(2025);
    expect(parsed?.getMonth()).toBe(7);
    expect(parsed?.getDate()).toBe(23);
  });

  it("형식이 다르면 null을 반환한다", () => {
    expect(parseDateString("2025/08/23")).toBeNull();
    expect(parseDateString("23-08-2025")).toBeNull();
    expect(parseDateString("abc")).toBeNull();
    expect(parseDateString("")).toBeNull();
  });

  it("존재하지 않는 날짜는 null을 반환한다", () => {
    expect(parseDateString("2025-02-31")).toBeNull();
    expect(parseDateString("2025-13-01")).toBeNull();
  });
});

describe("daysUntil", () => {
  it("오늘 출발은 0이다", () => {
    expect(daysUntil(dateStringFromNow(0), NOW)).toBe(0);
  });

  it("미래는 양수, 과거는 음수다", () => {
    expect(daysUntil(dateStringFromNow(5), NOW)).toBe(5);
    expect(daysUntil(dateStringFromNow(30), NOW)).toBe(30);
    expect(daysUntil(dateStringFromNow(-3), NOW)).toBe(-3);
  });

  it("잘못된 날짜는 null이다", () => {
    expect(daysUntil("not-a-date", NOW)).toBeNull();
  });
});

describe("formatDepartureDate", () => {
  it("월·일·요일로 표시한다", () => {
    // 2025-08-23은 토요일이에요.
    expect(formatDepartureDate("2025-08-23")).toBe("8월 23일 (토)");
  });

  it("잘못된 날짜는 원문을 그대로 돌려준다", () => {
    expect(formatDepartureDate("oops")).toBe("oops");
  });
});

describe("todayDateString", () => {
  it("오늘 날짜를 YYYY-MM-DD로 만든다", () => {
    expect(todayDateString(NOW)).toBe(dateStringFromNow(0));
    expect(todayDateString(NOW)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("load/save/clearDepartureDate", () => {
  it("저장된 날짜를 국가별 키로 읽는다", async () => {
    getItem.mockResolvedValue("2025-08-23");
    await expect(loadDepartureDate("JP")).resolves.toBe("2025-08-23");
    expect(getItem).toHaveBeenCalledWith("departure_JP_v1");
  });

  it("손상된 저장값은 null로 처리한다", async () => {
    getItem.mockResolvedValue("not-a-date");
    await expect(loadDepartureDate("JP")).resolves.toBeNull();
  });

  it("읽기 실패 시 null을 반환한다", async () => {
    getItem.mockRejectedValue(new Error("storage down"));
    await expect(loadDepartureDate("JP")).resolves.toBeNull();
  });

  it("저장·삭제는 국가별 키를 사용한다", async () => {
    await saveDepartureDate("TH", "2025-09-01");
    expect(setItem).toHaveBeenCalledWith("departure_TH_v1", "2025-09-01");

    await clearDepartureDate("TH");
    expect(removeItem).toHaveBeenCalledWith("departure_TH_v1");
  });
});
