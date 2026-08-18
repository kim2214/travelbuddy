import { describe, expect, it } from "vitest";

import { COUNTRIES } from "./countries";
import { SIZE_CATEGORIES, SIZE_REGION_BY_COUNTRY } from "./sizeGuide";

describe("SIZE_CATEGORIES", () => {
  it("카테고리 key가 겹치지 않는다", () => {
    const keys = SIZE_CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("모든 행의 값 개수가 열 개수와 같다", () => {
    for (const category of SIZE_CATEGORIES) {
      for (const row of category.rows) {
        expect(row, `${category.key}의 행: ${row.join(",")}`).toHaveLength(
          category.columns.length,
        );
      }
    }
  });

  it("모든 셀이 비어있지 않다", () => {
    for (const category of SIZE_CATEGORIES) {
      for (const row of category.rows) {
        for (const value of row) {
          expect(value.trim()).not.toBe("");
        }
      }
    }
  });

  it("모든 카테고리에 하이라이트 대상(region) 열이 하나 이상 있다", () => {
    for (const category of SIZE_CATEGORIES) {
      expect(
        category.columns.some((col) => col.region != null),
        category.key,
      ).toBe(true);
    }
  });
});

describe("SIZE_REGION_BY_COUNTRY", () => {
  it("지원하는 국가 코드만 사용한다", () => {
    const supported = new Set(COUNTRIES.map((c) => c.code));
    for (const code of Object.keys(SIZE_REGION_BY_COUNTRY)) {
      expect(supported.has(code), code).toBe(true);
    }
  });

  it("매핑된 표기가 신발 표에는 모두 존재한다", () => {
    const shoeRegions = new Set(
      SIZE_CATEGORIES.find((c) => c.key === "women-shoes")!.columns.map(
        (col) => col.region,
      ),
    );
    for (const region of Object.values(SIZE_REGION_BY_COUNTRY)) {
      expect(shoeRegions.has(region), region).toBe(true);
    }
  });
});
