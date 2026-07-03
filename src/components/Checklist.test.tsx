// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn() },
}));
vi.mock("../lib/countryPreference", () => ({
  loadSelectedCountry: vi.fn(),
  saveSelectedCountry: vi.fn(),
}));
vi.mock("../lib/geo", () => ({ detectCountryByGPS: vi.fn() }));

import { ThemeProvider } from "@toss/tds-mobile";

import { Storage } from "@apps-in-toss/web-framework";
import { loadSelectedCountry, saveSelectedCountry } from "../lib/countryPreference";
import { detectCountryByGPS } from "../lib/geo";
import { CountryProvider } from "../context/CountryContext";
import { Checklist } from "./Checklist";

beforeEach(() => {
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  vi.mocked(loadSelectedCountry).mockResolvedValue(null);
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null); // 기본 국가(JP) 유지
});

function renderChecklist(children: ReactNode = <Checklist />) {
  return render(
    <ThemeProvider>
      <CountryProvider>{children}</CountryProvider>
    </ThemeProvider>,
  );
}

describe("<Checklist />", () => {
  it("카테고리와 프리셋 항목을 렌더한다", async () => {
    renderChecklist();

    // 기본 국가 일본의 프리셋 항목
    expect(await screen.findByText("여권 (유효기간 6개월 이상)")).toBeInTheDocument();
    expect(screen.getByText("Visit Japan Web 사전 등록")).toBeInTheDocument();
    // 카테고리 헤더
    expect(screen.getByText("📄 서류")).toBeInTheDocument();
    expect(screen.getByText("🔌 전자기기")).toBeInTheDocument();
  });

  it("항목을 탭하면 체크 상태가 토글된다", async () => {
    renderChecklist();

    const label = await screen.findByText("여권 (유효기간 6개월 이상)");
    const checkbox = screen.getByRole("checkbox", {
      name: "여권 (유효기간 6개월 이상)",
    });
    expect(checkbox).toHaveAttribute("aria-checked", "false");

    await userEvent.click(label);

    await waitFor(() => expect(checkbox).toHaveAttribute("aria-checked", "true"));
  });
});
