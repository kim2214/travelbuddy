import { describe, expect, it } from "vitest";

import { amountInputFormat, fromGroupedAmount, toGroupedAmount } from "./amountFormat";

describe("toGroupedAmount", () => {
  it("정수부에 천 단위 콤마를 찍는다", () => {
    expect(toGroupedAmount("100")).toBe("100");
    expect(toGroupedAmount("1000")).toBe("1,000");
    expect(toGroupedAmount("1000000")).toBe("1,000,000");
  });

  it("소수부는 그룹핑하지 않는다", () => {
    expect(toGroupedAmount("1234.5678")).toBe("1,234.5678");
  });

  it("콤마가 섞인 값이 다시 들어와도 올바르게 포맷한다 (멱등)", () => {
    expect(toGroupedAmount("1,000,000")).toBe("1,000,000");
    // 콤마 누적으로 깨진 값도 복구돼요.
    expect(toGroupedAmount("1,0,0,0,000")).toBe("1,000,000");
  });

  it("숫자/소수점 외 문자는 제거한다", () => {
    expect(toGroupedAmount("₩1000원")).toBe("1,000");
  });
});

describe("fromGroupedAmount", () => {
  it("콤마를 제거해 원본 입력값으로 되돌린다", () => {
    expect(fromGroupedAmount("1,000,000")).toBe("1000000");
    expect(fromGroupedAmount("1,234.5678")).toBe("1234.5678");
  });
});

describe("amountInputFormat", () => {
  it("TextField처럼 연속 입력해도 콤마가 누적되지 않는다", () => {
    // TDS TextField 동작: 표시값 = transform(state), 입력 시 state = reset(표시값 + 입력)
    let state = "";
    for (const digit of "1000000") {
      const display = amountInputFormat.transform(state);
      state = amountInputFormat.reset(display + digit);
    }
    expect(state).toBe("1000000");
    expect(amountInputFormat.transform(state)).toBe("1,000,000");
  });
});
