// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/exchangeRate", () => ({ fetchRates: vi.fn() }));

import { fetchRates, type RatesResult } from "../lib/exchangeRate";
import { useExchangeRate } from "./useExchangeRate";

const fetchMock = vi.mocked(fetchRates);

function resultOf(overrides: Partial<RatesResult> = {}): RatesResult {
  return {
    rates: { JPY: 0.1 },
    fetchedAt: 2000,
    updatedAt: 1000,
    fromCache: false,
    stale: false,
    ...overrides,
  };
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("useExchangeRate", () => {
  it("환율과 제공처 갱신 시각을 불러온다", async () => {
    fetchMock.mockResolvedValue(resultOf());
    const { result } = renderHook(() => useExchangeRate());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rates).toEqual({ JPY: 0.1 });
    expect(result.current.updatedAt).toBe(1000);
    expect(result.current.stale).toBe(false);
    expect(result.current.error).toBe(false);
  });

  it("만료된 환율로 폴백했으면 stale로 알린다", async () => {
    fetchMock.mockResolvedValue(resultOf({ fromCache: true, stale: true }));
    const { result } = renderHook(() => useExchangeRate());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stale).toBe(true);
    expect(result.current.rates).not.toBeNull();
  });

  it("환율을 전혀 구하지 못하면 error가 된다", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useExchangeRate());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(true);
    expect(result.current.rates).toBeNull();
  });

  it("reload로 다시 시도해 성공하면 error가 풀린다", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useExchangeRate());
    await waitFor(() => expect(result.current.error).toBe(true));

    fetchMock.mockResolvedValueOnce(resultOf({ rates: { JPY: 0.11 } }));
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.rates).toEqual({ JPY: 0.11 }));
    expect(result.current.error).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("다시 시도가 실패해도 이전에 받은 환율은 유지한다", async () => {
    fetchMock.mockResolvedValueOnce(resultOf());
    const { result } = renderHook(() => useExchangeRate());
    await waitFor(() => expect(result.current.rates).not.toBeNull());

    fetchMock.mockRejectedValueOnce(new Error("network"));
    act(() => result.current.reload());

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.rates).toEqual({ JPY: 0.1 });
  });
});
