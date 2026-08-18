// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import { CountryProvider } from "../context/CountryProvider";
import { SizeGuide } from "./SizeGuide";

beforeEach(() => {
  // jsdom에는 ResizeObserver가 없어요. SegmentedControl이 사용하므로 폴리필해요.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  vi.mocked(loadSelectedCountry).mockResolvedValue(null);
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null); // 기본 국가 JP
});

function renderGuide() {
  return render(
    <ThemeProvider>
      <CountryProvider>
        <SizeGuide />
      </CountryProvider>
    </ThemeProvider>,
  );
}

describe("<SizeGuide />", () => {
  it("기본으로 여성 신발 표를 보여준다", async () => {
    renderGuide();

    expect(await screen.findByText("👕 사이즈 변환표")).toBeInTheDocument();
    // 여성 신발: KR 230 → US 6 → EU 36
    expect(screen.getByText("230")).toBeInTheDocument();
    expect(screen.getByText("36")).toBeInTheDocument();
  });

  it("카테고리를 바꾸면 해당 표로 전환된다", async () => {
    renderGuide();
    await screen.findByText("230");

    await userEvent.click(screen.getByText("남성 의류"));

    // 남성 의류: KR 100 → EU 50, 여성 신발 값은 사라져요.
    expect(await screen.findByText("100")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.queryByText("230")).not.toBeInTheDocument();
  });

  it("표기가 명확한 나라(일본)는 하이라이트 안내를 보여준다", async () => {
    renderGuide();

    expect(
      await screen.findByText("파란 열이 일본에서 주로 쓰는 표기예요"),
    ).toBeInTheDocument();
  });

  it("표기가 혼용되는 나라(태국)는 하이라이트 안내가 없다", async () => {
    vi.mocked(loadSelectedCountry).mockResolvedValue("TH");

    renderGuide();
    await screen.findByText("230");

    expect(screen.queryByText(/파란 열이/)).not.toBeInTheDocument();
  });
});
