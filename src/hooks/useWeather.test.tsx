// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/weather", () => ({ fetchWeather: vi.fn() }));

import { fetchWeather, type Weather } from "../lib/weather";
import { useWeather } from "./useWeather";

const fetchMock = vi.mocked(fetchWeather);

function weatherOf(currentTemp: number): Weather {
  return { currentTemp, currentCode: 0, daily: [], fetchedAt: 0 };
}

/** 원하는 시점에 끝낼 수 있는 Promise예요. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe("useWeather", () => {
  it("국가의 날씨를 불러온다", async () => {
    fetchMock.mockResolvedValue(weatherOf(21));
    const { result } = renderHook(() => useWeather("JP"));

    expect(result.current).toEqual({ weather: null, loading: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.weather?.currentTemp).toBe(21);
    expect(fetchMock).toHaveBeenCalledWith("JP");
  });

  it("불러오기에 실패하면 날씨 없이 로딩을 끝낸다", async () => {
    fetchMock.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useWeather("JP"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.weather).toBeNull();
  });

  it("국가를 바꾸면 이전 날씨를 지우고 다시 불러온다", async () => {
    fetchMock.mockResolvedValueOnce(weatherOf(21));
    const { result, rerender } = renderHook(({ code }) => useWeather(code), {
      initialProps: { code: "JP" },
    });
    await waitFor(() => expect(result.current.weather?.currentTemp).toBe(21));

    const th = deferred<Weather | null>();
    fetchMock.mockReturnValueOnce(th.promise);
    rerender({ code: "TH" });

    // 새 국가를 불러오는 동안 이전 국가의 날씨를 보여주지 않아요.
    expect(result.current).toEqual({ weather: null, loading: true });
    th.resolve(weatherOf(33));
    await waitFor(() => expect(result.current.weather?.currentTemp).toBe(33));
  });

  it("이전 국가의 늦은 응답이 새 국가의 날씨를 덮어쓰지 않는다", async () => {
    const jp = deferred<Weather | null>();
    const th = deferred<Weather | null>();
    fetchMock.mockReturnValueOnce(jp.promise).mockReturnValueOnce(th.promise);

    const { result, rerender } = renderHook(({ code }) => useWeather(code), {
      initialProps: { code: "JP" },
    });
    rerender({ code: "TH" });

    th.resolve(weatherOf(33));
    await waitFor(() => expect(result.current.weather?.currentTemp).toBe(33));

    jp.resolve(weatherOf(21));
    await Promise.resolve();
    await Promise.resolve();
    expect(result.current.weather?.currentTemp).toBe(33);
  });
});
