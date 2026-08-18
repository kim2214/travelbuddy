// @vitest-environment jsdom
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@apps-in-toss/web-framework", () => ({
  Storage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
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
import { DepartureDateRow } from "./DepartureDateRow";

/** 오늘 기준 daysOffset일 후의 로컬 날짜 문자열(YYYY-MM-DD)을 만들어요. */
function dateStringFromToday(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

beforeEach(() => {
  vi.mocked(Storage.getItem).mockResolvedValue(null);
  vi.mocked(Storage.setItem).mockResolvedValue(undefined);
  vi.mocked(Storage.removeItem).mockResolvedValue(undefined);
  vi.mocked(loadSelectedCountry).mockResolvedValue(null);
  vi.mocked(saveSelectedCountry).mockResolvedValue(undefined);
  vi.mocked(detectCountryByGPS).mockResolvedValue(null); // 기본 국가 JP
});

function renderRow() {
  return render(
    <ThemeProvider>
      <CountryProvider>
        <DepartureDateRow />
      </CountryProvider>
    </ThemeProvider>,
  );
}

async function findDateInput(): Promise<HTMLInputElement> {
  const input = (await screen.findByLabelText("출발일 선택")) as HTMLInputElement;
  await waitFor(() => expect(input).not.toBeDisabled());
  return input;
}

describe("<DepartureDateRow />", () => {
  it("출발일이 없으면 설정 안내를 보여준다", async () => {
    renderRow();

    expect(await screen.findByText("출발일")).toBeInTheDocument();
    expect(await screen.findByText("설정하면 디데이를 알려드려요")).toBeInTheDocument();
  });

  it("날짜를 고르면 D-day를 보여주고 저장한다", async () => {
    renderRow();
    const input = await findDateInput();

    fireEvent.change(input, { target: { value: dateStringFromToday(5) } });

    expect(await screen.findByText("출발까지 D-5")).toBeInTheDocument();
    expect(Storage.setItem).toHaveBeenCalledWith("departure_JP_v1", dateStringFromToday(5));
  });

  it("오늘 날짜를 고르면 오늘 출발 문구를 보여준다", async () => {
    renderRow();
    const input = await findDateInput();

    fireEvent.change(input, { target: { value: dateStringFromToday(0) } });

    expect(await screen.findByText("오늘 출발이에요!")).toBeInTheDocument();
  });

  it("저장된 출발일이 지났으면 다시 설정을 안내한다", async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(dateStringFromToday(-3));

    renderRow();

    expect(await screen.findByText("지난 출발일이에요")).toBeInTheDocument();
  });

  it("지우기를 누르면 삭제하고 설정 안내로 돌아간다", async () => {
    vi.mocked(Storage.getItem).mockResolvedValue(dateStringFromToday(5));

    renderRow();
    expect(await screen.findByText("출발까지 D-5")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "지우기" }));

    expect(Storage.removeItem).toHaveBeenCalledWith("departure_JP_v1");
    expect(await screen.findByText("설정하면 디데이를 알려드려요")).toBeInTheDocument();
  });
});
