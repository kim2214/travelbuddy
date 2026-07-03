import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchWithTimeout } from "./fetchWithTimeout";

afterEach(() => {
  vi.useRealTimers();
});

describe("fetchWithTimeout", () => {
  it("정상 응답을 그대로 반환하고 signal을 전달한다", async () => {
    const response = { ok: true } as Response;
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithTimeout("https://example.com")).resolves.toBe(response);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
  });

  it("타임아웃이 지나면 요청을 중단한다", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const promise = fetchWithTimeout("https://example.com", 1000);
    const assertion = expect(promise).rejects.toThrow(/abort/i);

    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });
});
