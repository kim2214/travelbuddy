// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/analytics", () => ({ logEvent: vi.fn(), logImpression: vi.fn() }));

import { ThemeProvider } from "@toss/tds-mobile";

import { logEvent } from "../lib/analytics";
import { AppErrorBoundary } from "./AppErrorBoundary";

let shouldThrow = true;

function Flaky() {
  if (shouldThrow) {
    throw new Error("boom");
  }
  return <div>정상 화면</div>;
}

function renderWithBoundary() {
  return render(
    <ThemeProvider>
      <AppErrorBoundary>
        <Flaky />
      </AppErrorBoundary>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  shouldThrow = true;
  // React가 에러 바운더리 동작 시 콘솔에 남기는 로그를 조용히 해요.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("<AppErrorBoundary />", () => {
  it("자식이 렌더 중 예외를 던지면 흰 화면 대신 다시 시도 화면을 보여준다", () => {
    renderWithBoundary();

    expect(screen.getByText("화면을 불러오지 못했어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.queryByText("정상 화면")).not.toBeInTheDocument();
  });

  it("에러를 분석 이벤트로 기록한다", () => {
    renderWithBoundary();

    expect(vi.mocked(logEvent)).toHaveBeenCalledWith(
      "app_error",
      expect.objectContaining({ message: "boom" }),
    );
  });

  it("다시 시도를 누르면 자식을 다시 마운트해 복구한다", () => {
    renderWithBoundary();
    shouldThrow = false;

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(screen.getByText("정상 화면")).toBeInTheDocument();
    expect(screen.queryByText("화면을 불러오지 못했어요")).not.toBeInTheDocument();
  });

  it("에러가 없으면 자식을 그대로 렌더한다", () => {
    shouldThrow = false;
    renderWithBoundary();

    expect(screen.getByText("정상 화면")).toBeInTheDocument();
  });
});
