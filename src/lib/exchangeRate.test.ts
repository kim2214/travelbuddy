import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  convert,
  fetchRates,
  formatAmount,
  fractionDigitsFor,
  type Rates,
} from "./exchangeRate";

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

beforeEach(() => {
  // 기본값: 캐시 없음, 저장 성공
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
});

describe("convert", () => {
  // rates[X] = 1 KRW당 X. JPY: 0.1 → 1엔 = 10원
  const rates: Rates = { JPY: 0.1, USD: 0.00075 };

  it("같은 통화는 그대로 반환한다", () => {
    expect(convert(1234, "KRW", "KRW", rates)).toBe(1234);
    expect(convert(50, "JPY", "JPY", rates)).toBe(50);
  });

  it("현지통화 → KRW로 환산한다", () => {
    expect(convert(1, "JPY", "KRW", rates)).toBeCloseTo(10);
    expect(convert(100, "JPY", "KRW", rates)).toBeCloseTo(1000);
  });

  it("KRW → 현지통화로 환산한다", () => {
    expect(convert(1000, "KRW", "JPY", rates)).toBeCloseTo(100);
  });

  it("교차 통화(현지 ↔ 현지)를 환산한다", () => {
    // 1 USD = (1/0.00075) KRW ≈ 1333.33원 → JPY로는 ×0.1 ≈ 133.33엔
    expect(convert(1, "USD", "JPY", rates)).toBeCloseTo(133.333, 2);
  });

  it("알 수 없는 통화는 null을 반환한다", () => {
    expect(convert(100, "GBP", "KRW", rates)).toBeNull();
    expect(convert(100, "KRW", "GBP", rates)).toBeNull();
  });

  it("유한하지 않은 금액은 null을 반환한다", () => {
    expect(convert(NaN, "JPY", "KRW", rates)).toBeNull();
    expect(convert(Infinity, "JPY", "KRW", rates)).toBeNull();
  });

  it("환율이 0이면 null을 반환한다(0으로 나누기 방지)", () => {
    expect(convert(100, "JPY", "KRW", { JPY: 0 })).toBeNull();
  });
});

describe("fractionDigitsFor", () => {
  it("소수 없는 통화는 0자리", () => {
    for (const c of ["JPY", "VND", "KRW", "TWD"]) {
      expect(fractionDigitsFor(c)).toBe(0);
    }
  });
  it("그 외 통화는 2자리", () => {
    for (const c of ["USD", "THB", "SGD", "PHP", "EUR"]) {
      expect(fractionDigitsFor(c)).toBe(2);
    }
  });
});

describe("formatAmount", () => {
  it("천 단위 콤마를 넣는다", () => {
    expect(formatAmount(1000, "KRW")).toBe("1,000");
    expect(formatAmount(1234567, "KRW")).toBe("1,234,567");
  });
  it("통화별 소수 자릿수를 적용한다", () => {
    expect(formatAmount(1234.5, "USD")).toBe("1,234.50");
    expect(formatAmount(100, "JPY")).toBe("100");
  });
});

describe("fetchRates", () => {
  it("유효한(TTL 이내) 캐시가 있으면 네트워크를 호출하지 않는다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    getItem.mockResolvedValue(
      JSON.stringify({ rates: { JPY: 0.1 }, fetchedAt: NOW - HOUR }),
    );

    const result = await fetchRates(NOW);

    expect(result).toEqual({ rates: { JPY: 0.1 }, fetchedAt: NOW - HOUR, fromCache: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("캐시가 없으면 API를 호출하고 결과를 캐시에 저장한다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ result: "success", rates: { JPY: 0.1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRates(NOW);

    expect(result).toEqual({ rates: { JPY: 0.1 }, fetchedAt: NOW, fromCache: false });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(setItem).toHaveBeenCalledOnce();
  });

  it("네트워크 실패 시 만료된 캐시로 폴백한다", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    getItem.mockResolvedValue(
      JSON.stringify({ rates: { JPY: 0.09 }, fetchedAt: NOW - 10 * HOUR }),
    );

    const result = await fetchRates(NOW);

    expect(result.fromCache).toBe(true);
    expect(result.rates).toEqual({ JPY: 0.09 });
    expect(result.fetchedAt).toBe(NOW - 10 * HOUR);
  });

  it("캐시도 없고 네트워크도 실패하면 에러를 던진다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    await expect(fetchRates(NOW)).rejects.toThrow();
  });

  it("API가 success가 아니면 실패로 처리한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ result: "error", rates: { JPY: 0.1 } })),
    );
    await expect(fetchRates(NOW)).rejects.toThrow();
  });

  it("환율 값이 숫자가 아니면 실패로 처리한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ result: "success", rates: { JPY: "0.1" } }),
      ),
    );
    await expect(fetchRates(NOW)).rejects.toThrow();
  });

  it("캐시 시각이 미래면(시계 역행) 신선으로 보지 않고 새로 받는다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({ rates: { JPY: 0.09 }, fetchedAt: NOW + HOUR }),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ result: "success", rates: { JPY: 0.1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRates(NOW);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.fromCache).toBe(false);
    expect(result.rates).toEqual({ JPY: 0.1 });
  });

  it("손상된 캐시(숫자 아닌 환율)는 무시하고 새로 가져온다", async () => {
    getItem.mockResolvedValue(
      JSON.stringify({ rates: { JPY: "bad" }, fetchedAt: NOW - HOUR }),
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ result: "success", rates: { JPY: 0.1 } }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRates(NOW);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.fromCache).toBe(false);
  });
});
