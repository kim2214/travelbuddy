// 타임아웃이 있는 fetch 래퍼.
// 연결이 끊기지 않고 멈추면 기본 fetch는 영영 resolve되지 않아 로딩 상태가 고정돼요.
// AbortController로 지정 시간 후 요청을 취소해 실패로 처리되게 해요.

const DEFAULT_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
