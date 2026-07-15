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

  it("팁 정보가 있는 국가는 유효한 프리셋과 안내 문구를 가진다", () => {
    for (const c of COUNTRIES) {
      if (c.tipping == null) {
        continue;
      }
      expect(c.tipping.presets.length, `${c.code} tipping presets`).toBeGreaterThan(0);
      for (const pct of c.tipping.presets) {
        expect(pct, `${c.code} tipping percent`).toBeGreaterThan(0);
      }
      expect(c.tipping.note.trim(), `${c.code} tipping note`).toBeTruthy();
    }
  });

  it("미국은 팁 계산기 정보를 가진다", () => {
    expect(getCountry("US").tipping).toBeTruthy();
  });

  it("지원 국가 목록에 주요 여행지가 포함된다", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "JP", "TH", "VN", "US", "SG", "TW", "PH",
        "FR", "IT", "ES", "GB", "CN", "HK", "GU", "AU", "MY", "ID",
      ]),
    );
  });

  it("국가 코드에 중복이 없다", () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("모든 국가가 폴백이 아닌 고유 실용정보를 가진다", () => {
    // getPracticalInfo는 미정의 코드를 기본 국가 정보로 폴백하므로,
    // PRACTICAL에 항목이 누락되면 기본 국가와 동일한 객체 참조가 반환돼요.
    const fallback = getPracticalInfo("ZZ");
    for (const c of COUNTRIES) {
      if (c.code === DEFAULT_COUNTRY_CODE) {
        continue;
      }
      expect(getPracticalInfo(c.code), `${c.code} practical`).not.toBe(fallback);
    }
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
