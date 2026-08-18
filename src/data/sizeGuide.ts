// 사이즈 변환표 정적 데이터 (KR ↔ US/EU/UK/JP).
// 표준 변환표 기준의 근사값이라 브랜드마다 다를 수 있어요 (화면에 고지).

/** 사이즈 표기 체계. 국가별로 주로 쓰는 표기를 하이라이트하는 데 써요. */
export type SizeRegion = "US" | "EU" | "UK" | "JP";

/** 표의 열. region이 있는 열만 국가 하이라이트 대상이에요. */
export interface SizeColumn {
  /** 헤더 표기 (예: "KR(mm)", "US") */
  label: string;
  /** 하이라이트 매칭용 표기 체계. KR·국제표기(S/M/L) 열은 없어요. */
  region?: SizeRegion;
}

export interface SizeCategory {
  key: string;
  /** 카테고리 선택 UI에 노출되는 이름 */
  label: string;
  columns: SizeColumn[];
  /** 각 행은 columns와 같은 순서·개수의 값이에요. */
  rows: string[][];
}

export const SIZE_CATEGORIES: SizeCategory[] = [
  {
    key: "women-shoes",
    label: "여성 신발",
    columns: [
      { label: "KR(mm)" },
      { label: "US", region: "US" },
      { label: "EU", region: "EU" },
      { label: "UK", region: "UK" },
      { label: "JP(cm)", region: "JP" },
    ],
    rows: [
      ["220", "5", "35", "2.5", "22"],
      ["225", "5.5", "35.5", "3", "22.5"],
      ["230", "6", "36", "3.5", "23"],
      ["235", "6.5", "37", "4", "23.5"],
      ["240", "7", "37.5", "4.5", "24"],
      ["245", "7.5", "38", "5", "24.5"],
      ["250", "8", "38.5", "5.5", "25"],
      ["255", "8.5", "39", "6", "25.5"],
      ["260", "9", "40", "6.5", "26"],
    ],
  },
  {
    key: "men-shoes",
    label: "남성 신발",
    columns: [
      { label: "KR(mm)" },
      { label: "US", region: "US" },
      { label: "EU", region: "EU" },
      { label: "UK", region: "UK" },
      { label: "JP(cm)", region: "JP" },
    ],
    rows: [
      ["250", "7", "40", "6", "25"],
      ["255", "7.5", "40.5", "6.5", "25.5"],
      ["260", "8", "41", "7", "26"],
      ["265", "8.5", "42", "7.5", "26.5"],
      ["270", "9", "42.5", "8", "27"],
      ["275", "9.5", "43", "8.5", "27.5"],
      ["280", "10", "44", "9", "28"],
      ["285", "10.5", "44.5", "9.5", "28.5"],
      ["290", "11", "45", "10", "29"],
    ],
  },
  {
    key: "women-clothes",
    label: "여성 의류",
    columns: [
      { label: "KR" },
      { label: "표기" },
      { label: "US", region: "US" },
      { label: "EU", region: "EU" },
      { label: "UK", region: "UK" },
      { label: "JP(호)", region: "JP" },
    ],
    rows: [
      ["44", "XS", "2", "34", "6", "7"],
      ["55", "S", "4", "36", "8", "9"],
      ["66", "M", "6–8", "38", "10", "11"],
      ["77", "L", "10", "40", "12", "13"],
      ["88", "XL", "12–14", "42", "14", "15"],
    ],
  },
  {
    key: "men-clothes",
    label: "남성 의류",
    columns: [
      { label: "KR" },
      { label: "표기" },
      { label: "US(in)", region: "US" },
      { label: "EU", region: "EU" },
      { label: "JP", region: "JP" },
    ],
    rows: [
      ["90", "S", "36", "46", "S"],
      ["95", "M", "38", "48", "M"],
      ["100", "L", "40–42", "50", "L"],
      ["105", "XL", "44", "52", "LL"],
      ["110", "XXL", "46", "54", "3L"],
    ],
  },
];

/**
 * 국가별로 주로 쓰는 사이즈 표기.
 * 표기가 혼용되는 나라(동남아 등)는 하이라이트하지 않아요.
 */
export const SIZE_REGION_BY_COUNTRY: Record<string, SizeRegion> = {
  US: "US",
  GU: "US",
  JP: "JP",
  FR: "EU",
  IT: "EU",
  ES: "EU",
  GB: "UK",
  AU: "UK",
};
