// 여행지(국가)별 정적 데이터.
// 환율 계산기, 현지 매너 팁, 준비물 체크리스트, 연계 상품(eSIM/보험)을 한 곳에서 정의해요.

export interface MannerTip {
  /** 팁 카테고리 (예: 팁 문화, 주의할 점) */
  title: string;
  /** 상세 설명 */
  description: string;
}

export interface ChecklistPresetItem {
  /** 국가 내에서 고유한 항목 id */
  id: string;
  /** 화면에 노출되는 항목명 */
  label: string;
  /** 부가 설명 (선택) */
  hint?: string;
}

export type ProductKind = "esim" | "insurance" | "exchange";

export interface Product {
  id: string;
  kind: ProductKind;
  /** 상품명 */
  name: string;
  /** 한 줄 설명 */
  description: string;
  /** 노출 가격 문구 (예: "9,900원~") */
  priceLabel: string;
  /**
   * '구매하기'/'환전하기' 클릭 시 유도할 딥링크 또는 외부 URL.
   * MVP에서는 안내 후 openURL로 유도만 해요. (실결제 미구현)
   */
  deeplink: string;
}

export interface Country {
  /** ISO 3166-1 alpha-2 코드 (예: JP) */
  code: string;
  /** 한글 국가명 */
  name: string;
  /** 국기 이모지 */
  flag: string;
  /** ISO 4217 통화 코드 (예: JPY) */
  currency: string;
  /** 통화 기호 (예: ¥) */
  currencySymbol: string;
  /** 통화 한글명 (예: 엔) */
  currencyName: string;
  mannerTips: MannerTip[];
  checklistPreset: ChecklistPresetItem[];
}

// 공통 준비물(모든 국가에 기본 포함). 국가별 preset 앞에 합쳐서 사용해요.
const commonChecklist: ChecklistPresetItem[] = [
  { id: "passport", label: "여권 (유효기간 6개월 이상)" },
  { id: "esim", label: "eSIM / 로밍", hint: "현지 데이터 미리 준비" },
  { id: "insurance", label: "여행자보험 가입" },
  { id: "card", label: "해외결제 카드 / 토스 환전" },
];

const TOSS_EXCHANGE_DEEPLINK =
  "https://www.tossbank.com/product-service/fx/account";
// 투어모즈(위비즈엔㈜) 여행자보험 비교·가입 — 삼성·메리츠·한화 등 여러 보험사 비교
const TRAVEL_INSURANCE_LINK = "https://www.tourmoz.com/v2/find";
// 로밍도깨비(유엔젤㈜) 여행 eSIM 스토어
const ROKEBI_ESIM_LINK = "https://www.rokebi.com/store?tab=best";

export const COUNTRIES: Country[] = [
  {
    code: "JP",
    name: "일본",
    flag: "🇯🇵",
    currency: "JPY",
    currencySymbol: "¥",
    currencyName: "엔",
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "팁 문화가 없어요. 식당·택시에서 팁을 주면 오히려 당황스러워해요.",
      },
      {
        title: "현금",
        description:
          "소도시·식당은 아직 현금만 받는 곳이 많아요. 동전 지갑을 챙기면 편해요.",
      },
      {
        title: "주의할 점",
        description:
          "길거리 흡연·통화는 눈총을 받아요. 대중교통에서는 통화를 자제해요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "ic-card", label: "교통카드(Suica/ICOCA)" },
      {
        id: "visit-japan",
        label: "Visit Japan Web 사전 등록",
        hint: "입국 심사 QR",
      },
    ],
  },
  {
    code: "TH",
    name: "태국",
    flag: "🇹🇭",
    currency: "THB",
    currencySymbol: "฿",
    currencyName: "바트",
    mannerTips: [
      {
        title: "팁 문화",
        description: "마사지·호텔에서 20~100바트 정도 팁이 일반적이에요.",
      },
      {
        title: "왕실 예절",
        description:
          "국왕·왕실에 대한 비하는 법으로 엄격히 금지돼요. 발언에 주의해요.",
      },
      {
        title: "사원 방문",
        description:
          "사원에서는 어깨·무릎을 가리는 복장이 필요하고 신발은 벗어요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "repellent", label: "모기 기피제 / 상비약" },
      { id: "adapter", label: "멀티 어댑터", hint: "A/C/F 타입 혼용" },
    ],
  },
  {
    code: "VN",
    name: "베트남",
    flag: "🇻🇳",
    currency: "VND",
    currencySymbol: "₫",
    currencyName: "동",
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "의무는 아니지만 고급 식당·스파에서는 소액 팁이 환영받아요.",
      },
      {
        title: "환전·계산",
        description:
          "0이 많아 헷갈리기 쉬워요. 받은 거스름돈 단위를 꼭 확인해요.",
      },
      {
        title: "교통",
        description: "오토바이가 많아 길 건널 때는 천천히 일정 속도로 걸어요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      {
        id: "evisa",
        label: "전자비자(E-visa) 발급",
        hint: "입국 전 필수 확인",
      },
      { id: "small-cash", label: "소액권 현금 준비" },
    ],
  },
  {
    code: "US",
    name: "미국",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    currencyName: "달러",
    mannerTips: [
      {
        title: "팁 문화",
        description: "식당 15~20%, 택시·호텔 등에서도 팁이 사실상 필수예요.",
      },
      {
        title: "세금",
        description: "표시 가격에 세금이 빠져 있어요. 결제 시 금액이 올라가요.",
      },
      {
        title: "입국",
        description:
          "ESTA 사전 승인이 필요해요. 출발 최소 72시간 전 신청 권장.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "esta", label: "ESTA 승인", hint: "전자여행허가" },
      { id: "tip-cash", label: "팁용 1달러 지폐" },
    ],
  },
  {
    code: "SG",
    name: "싱가포르",
    flag: "🇸🇬",
    currency: "SGD",
    currencySymbol: "S$",
    currencyName: "싱가포르 달러",
    mannerTips: [
      {
        title: "팁 문화",
        description: "보통 서비스 차지(10%)가 포함돼 별도 팁은 필요 없어요.",
      },
      {
        title: "벌금의 나라",
        description:
          "껌 반입, 무단 횡단, 흡연 구역 외 흡연은 높은 벌금이 부과돼요.",
      },
      {
        title: "음식물",
        description: "지하철(MRT) 내 음식·음료 섭취는 금지돼 있어요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      {
        id: "sg-arrival",
        label: "SG Arrival Card 작성",
        hint: "입국 3일 전부터",
      },
      { id: "umbrella", label: "우산 (스콜 대비)" },
    ],
  },
];

/** 모든 국가에 공통으로 노출하는 여행 eSIM 연계 상품 (로밍도깨비) */
export const ESIM_PRODUCT: Product = {
  id: "esim-rokebi",
  kind: "esim",
  name: "여행 eSIM",
  description: "여행지 데이터, QR 한 번으로 도착 즉시 연결",
  priceLabel: "베스트 요금제 보기",
  deeplink: ROKEBI_ESIM_LINK,
};

/** 모든 국가에 공통으로 노출하는 여행자보험 비교·가입 상품 (투어모즈) */
export const INSURANCE_PRODUCT: Product = {
  id: "insurance-tourmoz",
  kind: "insurance",
  name: "여행자보험 비교·가입",
  description: "여러 보험사를 비교하고 바로 가입해요",
  priceLabel: "보험료 비교",
  deeplink: TRAVEL_INSURANCE_LINK,
};

/** 모든 국가에 공통으로 노출하는 토스 환전 유도 상품 */
export const TOSS_EXCHANGE_PRODUCT: Product = {
  id: "toss-exchange",
  kind: "exchange",
  name: "토스로 환전하기",
  description: "수수료 우대로 미리 환전하고 공항에서 받아요",
  priceLabel: "수수료 우대",
  deeplink: TOSS_EXCHANGE_DEEPLINK,
};

export const DEFAULT_COUNTRY_CODE = "JP";

export function getCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

// ---- 현지 실용 정보 (#7) ----

export interface EmergencyContact {
  label: string;
  number: string;
}

export interface PracticalInfo {
  /** 한국과의 시차 안내 문구 */
  timeDiff: string;
  /** 콘센트 플러그 타입 + 전압 */
  plug: string;
  /** 수돗물 음용 가능 여부 안내 */
  tapWater: string;
  /** 현지 긴급 전화번호 (경찰/구급 등) */
  emergency: EmergencyContact[];
  /** 해외에서 한국 영사 지원을 받는 연락처 */
  embassy: EmergencyContact;
  /** 흔한 사기/주의 사항 */
  scams: string[];
}

// 외교부 영사콜센터(24시간) — 해외 어디서나 한국어 영사 지원
const CONSULAR_CALL_CENTER: EmergencyContact = {
  label: "외교부 영사콜센터 (24시간)",
  number: "+82-2-3210-0404",
};

const PRACTICAL: Record<string, PracticalInfo> = {
  JP: {
    timeDiff: "한국과 시차가 없어요",
    plug: "A타입 · 100V (한국 어댑터 필요)",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [
      { label: "경찰", number: "110" },
      { label: "구급·소방", number: "119" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "번화가 호객 술집(보타쿠리)의 바가지 요금을 조심하세요.",
      "대부분 안전하지만 현금 위주라 분실에 유의하세요.",
    ],
  },
  TH: {
    timeDiff: "한국보다 2시간 느려요",
    plug: "A·C·F타입 혼용 · 220V",
    tapWater: "수돗물은 마시지 말고 생수를 권장해요",
    emergency: [
      { label: "관광경찰", number: "1155" },
      { label: "긴급(경찰)", number: "191" },
      { label: "구급", number: "1669" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "택시 미터기 거부·뚝뚝 바가지: 그랩(Grab) 사용을 권장해요.",
      "보석·맞춤정장 호객, 젯스키 손상 클레임을 조심하세요.",
    ],
  },
  VN: {
    timeDiff: "한국보다 2시간 느려요",
    plug: "A·C타입 · 220V",
    tapWater: "수돗물은 마시지 말고 생수를 권장해요",
    emergency: [
      { label: "경찰", number: "113" },
      { label: "구급", number: "115" },
      { label: "소방", number: "114" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "택시 미터기 조작·거스름돈 적게 주기: 그랩(Grab)을 권장해요.",
      "0이 많아 지폐 단위를 혼동하기 쉬우니 확인하세요.",
    ],
  },
  US: {
    timeDiff: "지역별로 13~16시간 느려요",
    plug: "A·B타입 · 120V",
    tapWater: "대체로 수돗물을 마실 수 있어요",
    emergency: [{ label: "통합 긴급(경찰·구급·소방)", number: "911" }],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "길거리 CD·팔찌 강매, 가짜 공연 티켓을 조심하세요.",
      "ATM 스키밍 위험이 있으니 실내 ATM을 이용하세요.",
    ],
  },
  SG: {
    timeDiff: "한국보다 1시간 느려요",
    plug: "G타입(영국식) · 230V (전용 어댑터 필요)",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [
      { label: "경찰", number: "999" },
      { label: "구급·소방", number: "995" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "비교적 안전하지만 무허가 환전소·길거리 도박 사기를 조심하세요.",
      "벌금 규정(껌·흡연·무단횡단)이 엄격하니 유의하세요.",
    ],
  },
};

export function getPracticalInfo(code: string): PracticalInfo {
  return PRACTICAL[code] ?? PRACTICAL[DEFAULT_COUNTRY_CODE];
}
