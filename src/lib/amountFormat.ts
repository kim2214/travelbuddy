// 금액 입력 필드(TDS TextField의 format prop)용 천 단위 콤마 포맷.
//
// TextField는 표시값 = transform(value)로 그리고, 입력이 바뀌면 reset(표시값)을
// onChange의 값으로 돌려줘요. reset이 없으면 콤마 찍힌 표시값이 그대로 state에
// 저장되고, 다음 렌더에서 그 위에 transform이 또 적용돼 "1,0,0,0,000"처럼 콤마가
// 누적돼요. 그래서 reset을 반드시 함께 쓰고, transform도 콤마 섞인 값이 다시
// 들어와도 안전하도록 멱등하게 만들어요.

/** 숫자/소수점만 남기고 정수부에 천 단위 콤마를 찍어요. (소수부는 그룹핑하지 않아요) */
export function toGroupedAmount(value: string | number): string {
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const [int, ...frac] = cleaned.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac.length > 0 ? `${grouped}.${frac.join(".")}` : grouped;
}

/** 콤마 찍힌 표시값을 원본 입력값(숫자/소수점만)으로 되돌려요. */
export function fromGroupedAmount(formatted: string | number): string {
  return String(formatted).replace(/[^0-9.]/g, "");
}

/** TDS TextField의 `format` prop에 그대로 전달하는 금액 콤마 포맷터예요. */
export const amountInputFormat = {
  transform: toGroupedAmount,
  reset: fromGroupedAmount,
};
