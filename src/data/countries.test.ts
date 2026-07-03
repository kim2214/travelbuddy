import { describe, expect, it } from "vitest";

import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  getCountry,
  getPracticalInfo,
} from "./countries";

describe("countries 데이터 정합성", () => {
  it("모든 국가가 현지 물가 프리셋을 가진다", () => {
    for (const c of COUNTRIES) {
      expect(c.localPrices.length, `${c.code} localPrices`).toBeGreaterThan(0);
      for (const p of c.localPrices) {
        expect(p.emoji, `${c.code} emoji`).toBeTruthy();
        expect(p.label.trim(), `${c.code} label`).toBeTruthy();
        expect(p.amount, `${c.code} ${p.label} amount`).toBeGreaterThan(0);
      }
    }
  });

  it("모든 국가의 실용정보에 히어로용 짧은 표기가 있다", () => {
    for (const c of COUNTRIES) {
      const info = getPracticalInfo(c.code);
      expect(info.timeDiffShort.trim(), `${c.code} timeDiffShort`).toBeTruthy();
      expect(info.plugShort.trim(), `${c.code} plugShort`).toBeTruthy();
    }
  });

  it("모든 준비물 항목에 카테고리가 지정돼 있다", () => {
    const allowed = new Set(["서류", "전자기기", "상비약", "기타"]);
    for (const c of COUNTRIES) {
      for (const item of c.checklistPreset) {
        expect(allowed.has(item.category), `${c.code} ${item.id} category`).toBe(true);
      }
    }
  });

  it("모든 국가가 여행 회화를 가진다", () => {
    for (const c of COUNTRIES) {
      expect(c.phrases.length, `${c.code} phrases`).toBeGreaterThan(0);
      for (const p of c.phrases) {
        expect(p.ko.trim(), `${c.code} ko`).toBeTruthy();
        expect(p.local.trim(), `${c.code} local`).toBeTruthy();
        expect(p.pron.trim(), `${c.code} pron`).toBeTruthy();
      }
    }
  });

  it("모든 국가의 소수 자릿수가 0 또는 2다", () => {
    for (const c of COUNTRIES) {
      expect([0, 2], `${c.code} fractionDigits`).toContain(c.fractionDigits);
    }
  });

  it("기본 국가(DEFAULT_COUNTRY_CODE)가 목록에 존재한다", () => {
    expect(COUNTRIES.some((c) => c.code === DEFAULT_COUNTRY_CODE)).toBe(true);
  });
});

describe("getCountry", () => {
  it("유효한 코드를 그대로 반환한다", () => {
    expect(getCountry("TH").code).toBe("TH");
  });
  it("알 수 없는 코드는 기본 국가로 폴백한다", () => {
    expect(getCountry("ZZ").code).toBe(DEFAULT_COUNTRY_CODE);
  });
});

describe("getPracticalInfo", () => {
  it("알 수 없는 코드도 널이 아닌 정보를 반환한다(폴백)", () => {
    const info = getPracticalInfo("ZZ");
    expect(info).toBeTruthy();
    expect(info.emergency.length).toBeGreaterThan(0);
  });
});
