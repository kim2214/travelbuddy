import { beforeEach, describe, expect, it, vi } from "vitest";

import { logEvent } from "./analytics";

vi.mock("@apps-in-toss/web-framework", () => ({
  Analytics: { click: vi.fn(), impression: vi.fn(), screen: vi.fn() },
}));

import { Analytics } from "@apps-in-toss/web-framework";

const click = vi.mocked(Analytics.click);

beforeEach(() => {
  click.mockReturnValue(undefined);
});

describe("logEvent", () => {
  it("log_name과 파라미터를 담아 Analytics.click을 호출한다", () => {
    logEvent("product_open", { product: "esim-jp", kind: "esim" });
    expect(click).toHaveBeenCalledWith({
      log_name: "product_open",
      product: "esim-jp",
      kind: "esim",
    });
  });

  it("파라미터가 없어도 log_name만으로 호출한다", () => {
    logEvent("tab_change");
    expect(click).toHaveBeenCalledWith({ log_name: "tab_change" });
  });

  it("Analytics가 던져도 예외를 전파하지 않는다", () => {
    click.mockImplementation(() => {
      throw new Error("bridge unavailable");
    });
    expect(() => logEvent("country_change", { country: "JP" })).not.toThrow();
  });
});
