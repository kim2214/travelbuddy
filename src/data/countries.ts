// 여행지(국가)별 정적 데이터.
// 환율 계산기, 현지 매너 팁, 준비물 체크리스트, 연계 상품(eSIM/보험)을 한 곳에서 정의해요.

export interface MannerTip {
  /** 팁 카테고리 (예: 팁 문화, 주의할 점) */
  title: string;
  /** 상세 설명 */
  description: string;
}

/** 준비물 분류 (화면에서 이 순서로 그룹핑) */
export type ChecklistCategory = "서류" | "전자기기" | "상비약" | "기타";

export interface ChecklistPresetItem {
  /** 국가 내에서 고유한 항목 id */
  id: string;
  /** 화면에 노출되는 항목명 */
  label: string;
  /** 부가 설명 (선택) */
  hint?: string;
  /** 준비물 분류 */
  category: ChecklistCategory;
}

/** 회화 분류 (화면에서 이 순서로 그룹핑) */
export type PhraseCategory = "기본" | "식당" | "쇼핑" | "교통" | "긴급";

export interface Phrase {
  /** 회화 분류 */
  category: PhraseCategory;
  /** 한국어 뜻 */
  ko: string;
  /** 현지어(또는 영어) 표기 */
  local: string;
  /** 한글 발음 */
  pron: string;
}

export interface LocalPrice {
  /** 아이콘 이모지 */
  emoji: string;
  /** 항목명 (예: 커피, 라멘) */
  label: string;
  /** 현지 통화 기준 대략적 금액 (환산 감각용, 정확한 시세 아님) */
  amount: number;
}

export interface TippingInfo {
  /** 자주 쓰는 팁 비율(%) 프리셋 (첫 번째 값이 기본 선택) */
  presets: number[];
  /** 팁 문화 한 줄 안내 */
  note: string;
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
  /** 통화 표시 소수 자릿수 (예: JPY 0, USD 2) */
  fractionDigits: number;
  /** 현지 물가 감각용 프리셋 (환율 화면에서 원화로 환산해 보여줘요) */
  localPrices: LocalPrice[];
  /** 여행 회화 (현지 가이드 화면) */
  phrases: Phrase[];
  mannerTips: MannerTip[];
  checklistPreset: ChecklistPresetItem[];
  /** 팁 문화가 있는 나라의 팁 계산 정보. 있으면 환율 화면에 팁 계산기를 노출해요. */
  tipping?: TippingInfo;
}

// 공통 준비물(모든 국가에 기본 포함). 국가별 preset 앞에 합쳐서 사용해요.
const commonChecklist: ChecklistPresetItem[] = [
  { id: "passport", label: "여권 (유효기간 6개월 이상)", category: "서류" },
  { id: "esim", label: "eSIM / 로밍", hint: "현지 데이터 미리 준비", category: "전자기기" },
  { id: "insurance", label: "여행자보험 가입", category: "서류" },
  { id: "card", label: "해외결제 카드 / 토스 환전", category: "기타" },
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
    fractionDigits: 0,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 500 },
      { emoji: "🍜", label: "라멘", amount: 900 },
      { emoji: "🚉", label: "전철 기본", amount: 200 },
      { emoji: "🚕", label: "택시 기본", amount: 500 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "こんにちは", pron: "곤니치와" },
      { category: "기본", ko: "감사합니다", local: "ありがとうございます", pron: "아리가토 고자이마스" },
      { category: "기본", ko: "실례합니다 / 죄송합니다", local: "すみません", pron: "스미마셍" },
      { category: "식당", ko: "주문할게요", local: "注文お願いします", pron: "츄몬 오네가이시마스" },
      { category: "식당", ko: "계산해 주세요", local: "お会計お願いします", pron: "오카이케이 오네가이시마스" },
      { category: "쇼핑", ko: "얼마예요?", local: "いくらですか", pron: "이쿠라데스카" },
      { category: "쇼핑", ko: "카드 되나요?", local: "カードは使えますか", pron: "카-도와 츠카에마스카" },
      { category: "교통", ko: "여기로 가주세요", local: "ここまでお願いします", pron: "코코마데 오네가이시마스" },
      { category: "교통", ko: "역은 어디예요?", local: "駅はどこですか", pron: "에키와 도코데스카" },
      { category: "긴급", ko: "도와주세요", local: "助けてください", pron: "타스케테 쿠다사이" },
      { category: "긴급", ko: "화장실 어디예요?", local: "トイレはどこですか", pron: "토이레와 도코데스카" },
    ],
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
      { id: "ic-card", label: "교통카드(Suica/ICOCA)", category: "기타" },
      {
        id: "visit-japan",
        label: "Visit Japan Web 사전 등록",
        hint: "입국 심사 QR",
        category: "서류",
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
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 60 },
      { emoji: "🍜", label: "쌀국수 · 팟타이", amount: 60 },
      { emoji: "🚕", label: "택시 기본", amount: 40 },
      { emoji: "🍺", label: "맥주", amount: 70 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "สวัสดีครับ / ค่ะ", pron: "사왓디 크랍 / 카" },
      { category: "기본", ko: "감사합니다", local: "ขอบคุณครับ / ค่ะ", pron: "컵쿤 크랍 / 카" },
      { category: "기본", ko: "죄송합니다", local: "ขอโทษครับ / ค่ะ", pron: "커톳 크랍 / 카" },
      { category: "식당", ko: "계산해 주세요", local: "เช็คบิล", pron: "첵빈" },
      { category: "식당", ko: "맵지 않게 해주세요", local: "ไม่เผ็ด", pron: "마이 펫" },
      { category: "쇼핑", ko: "얼마예요?", local: "เท่าไหร่", pron: "타올라이" },
      { category: "쇼핑", ko: "깎아주세요", local: "ลดหน่อยได้ไหม", pron: "롯너이 다이마이" },
      { category: "교통", ko: "여기로 가주세요", local: "ไปที่นี่", pron: "빠이 티니" },
      { category: "교통", ko: "여기서 세워주세요", local: "จอดที่นี่", pron: "쩟 티니" },
      { category: "긴급", ko: "도와주세요", local: "ช่วยด้วย", pron: "추어이 두어이" },
      { category: "긴급", ko: "화장실 어디예요?", local: "ห้องน้ำอยู่ที่ไหน", pron: "헝남 유티나이" },
    ],
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
      { id: "repellent", label: "모기 기피제 / 상비약", category: "상비약" },
      { id: "adapter", label: "멀티 어댑터", hint: "A/C/F 타입 혼용", category: "전자기기" },
    ],
  },
  {
    code: "VN",
    name: "베트남",
    flag: "🇻🇳",
    currency: "VND",
    currencySymbol: "₫",
    currencyName: "동",
    fractionDigits: 0,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "카페쓰어", amount: 25000 },
      { emoji: "🍜", label: "쌀국수", amount: 40000 },
      { emoji: "🏍️", label: "쎄옴(오토바이)", amount: 15000 },
      { emoji: "🍺", label: "맥주", amount: 20000 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Xin chào", pron: "신 짜오" },
      { category: "기본", ko: "감사합니다", local: "Cảm ơn", pron: "깜 언" },
      { category: "기본", ko: "죄송합니다", local: "Xin lỗi", pron: "신 로이" },
      { category: "식당", ko: "계산해 주세요", local: "Tính tiền", pron: "띤 띠엔" },
      { category: "식당", ko: "이거 주세요", local: "Cho tôi cái này", pron: "쩌 또이 까이 나이" },
      { category: "쇼핑", ko: "얼마예요?", local: "Bao nhiêu tiền?", pron: "바오 니에우 띠엔" },
      { category: "쇼핑", ko: "깎아주세요", local: "Giảm giá được không?", pron: "지암 자 드억 콩" },
      { category: "교통", ko: "여기로 가주세요", local: "Cho tôi đến đây", pron: "쩌 또이 덴 더이" },
      { category: "교통", ko: "여기서 세워주세요", local: "Dừng ở đây", pron: "즈응 어 더이" },
      { category: "긴급", ko: "도와주세요", local: "Cứu tôi với", pron: "끄우 또이 버이" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Nhà vệ sinh ở đâu?", pron: "냐 베 신 어 더우" },
    ],
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
        category: "서류",
      },
      { id: "small-cash", label: "소액권 현금 준비", category: "기타" },
    ],
  },
  {
    code: "US",
    name: "미국",
    flag: "🇺🇸",
    currency: "USD",
    currencySymbol: "$",
    currencyName: "달러",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 4 },
      { emoji: "🍔", label: "버거 세트", amount: 12 },
      { emoji: "🚇", label: "지하철", amount: 2.9 },
      { emoji: "🍺", label: "맥주", amount: 7 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Hello", pron: "헬로" },
      { category: "기본", ko: "감사합니다", local: "Thank you", pron: "땡큐" },
      { category: "기본", ko: "실례합니다", local: "Excuse me", pron: "익스큐즈 미" },
      { category: "식당", ko: "주문할게요", local: "I'd like to order", pron: "아이드 라이크 투 오더" },
      { category: "식당", ko: "계산서 주세요", local: "Check, please", pron: "첵 플리즈" },
      { category: "쇼핑", ko: "얼마예요?", local: "How much is it?", pron: "하우 머치 이즈 잇" },
      { category: "쇼핑", ko: "카드 되나요?", local: "Do you take card?", pron: "두 유 테이크 카드" },
      { category: "교통", ko: "여기로 가주세요", local: "Take me here, please", pron: "테이크 미 히어 플리즈" },
      { category: "교통", ko: "여기서 세워주세요", local: "Stop here, please", pron: "스탑 히어 플리즈" },
      { category: "긴급", ko: "도와주세요", local: "Help me, please", pron: "헬프 미 플리즈" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Where's the restroom?", pron: "웨어즈 더 레스트룸" },
    ],
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
      { id: "esta", label: "ESTA 승인", hint: "전자여행허가", category: "서류" },
      { id: "tip-cash", label: "팁용 1달러 지폐", category: "기타" },
    ],
    tipping: {
      presets: [18, 20, 15],
      note: "식당은 보통 세전 금액의 15~20%를 팁으로 줘요.",
    },
  },
  {
    code: "SG",
    name: "싱가포르",
    flag: "🇸🇬",
    currency: "SGD",
    currencySymbol: "S$",
    currencyName: "싱가포르 달러",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "코피(커피)", amount: 1.8 },
      { emoji: "🍚", label: "치킨라이스", amount: 5 },
      { emoji: "🚇", label: "MRT 기본", amount: 1.5 },
      { emoji: "🍺", label: "맥주", amount: 10 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Hello", pron: "헬로" },
      { category: "기본", ko: "감사합니다", local: "Thank you", pron: "땡큐" },
      { category: "기본", ko: "실례합니다", local: "Excuse me", pron: "익스큐즈 미" },
      { category: "식당", ko: "주문할게요", local: "I'd like to order", pron: "아이드 라이크 투 오더" },
      { category: "식당", ko: "계산서 주세요", local: "Bill, please", pron: "빌 플리즈" },
      { category: "쇼핑", ko: "얼마예요?", local: "How much?", pron: "하우 머치" },
      { category: "쇼핑", ko: "카드 되나요?", local: "Can I pay by card?", pron: "캔 아이 페이 바이 카드" },
      { category: "교통", ko: "여기로 가주세요", local: "Take me here, please", pron: "테이크 미 히어 플리즈" },
      { category: "교통", ko: "여기서 세워주세요", local: "Stop here, please", pron: "스탑 히어 플리즈" },
      { category: "긴급", ko: "도와주세요", local: "Help, please", pron: "헬프 플리즈" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Where is the toilet?", pron: "웨어 이즈 더 토일렛" },
    ],
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
        category: "서류",
      },
      { id: "umbrella", label: "우산 (스콜 대비)", category: "기타" },
    ],
  },
  {
    code: "TW",
    name: "대만",
    flag: "🇹🇼",
    currency: "TWD",
    currencySymbol: "NT$",
    currencyName: "대만 달러",
    fractionDigits: 0,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 60 },
      { emoji: "🧋", label: "버블티", amount: 55 },
      { emoji: "🍜", label: "우육면", amount: 130 },
      { emoji: "🚇", label: "MRT 기본", amount: 20 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "你好", pron: "니하오" },
      { category: "기본", ko: "감사합니다", local: "謝謝", pron: "셰셰" },
      { category: "기본", ko: "실례합니다", local: "不好意思", pron: "뿌하오이쓰" },
      { category: "식당", ko: "주문할게요", local: "我要點餐", pron: "워 야오 디엔찬" },
      { category: "식당", ko: "계산해 주세요", local: "買單", pron: "마이단" },
      { category: "쇼핑", ko: "얼마예요?", local: "多少錢", pron: "뚸사오 첸" },
      { category: "쇼핑", ko: "카드 되나요?", local: "可以刷卡嗎", pron: "커이 슈아카 마" },
      { category: "교통", ko: "여기로 가주세요", local: "到這裡", pron: "따오 저리" },
      { category: "교통", ko: "여기서 세워주세요", local: "停這裡", pron: "팅 저리" },
      { category: "긴급", ko: "도와주세요", local: "幫幫我", pron: "빵빵 워" },
      { category: "긴급", ko: "화장실 어디예요?", local: "廁所在哪裡", pron: "처쒀 짜이 나리" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "팁 문화가 거의 없어요. 일부 식당은 봉사료(10%)가 계산서에 포함돼요.",
      },
      {
        title: "교통카드",
        description:
          "이지카드(EasyCard)로 MRT·버스·편의점까지 편하게 쓸 수 있어요.",
      },
      {
        title: "주의할 점",
        description: "MRT 역·차량 안에서는 음식물 섭취가 금지되어 있어요(벌금).",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "easycard", label: "이지카드(EasyCard)", category: "기타" },
      {
        id: "tw-arrival",
        label: "입국신고서 온라인 작성",
        hint: "TW Arrival Card",
        category: "서류",
      },
    ],
  },
  {
    code: "PH",
    name: "필리핀",
    flag: "🇵🇭",
    currency: "PHP",
    currencySymbol: "₱",
    currencyName: "페소",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 120 },
      { emoji: "🍚", label: "현지 식사", amount: 150 },
      { emoji: "🍺", label: "맥주", amount: 80 },
      { emoji: "🚕", label: "택시 기본", amount: 45 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Kumusta", pron: "쿠무스타" },
      { category: "기본", ko: "감사합니다", local: "Salamat", pron: "살라맛" },
      { category: "기본", ko: "실례합니다", local: "Excuse me", pron: "익스큐즈 미" },
      { category: "식당", ko: "주문할게요", local: "Order po", pron: "오더 뽀" },
      { category: "식당", ko: "계산서 주세요", local: "Bill po", pron: "빌 뽀" },
      { category: "쇼핑", ko: "얼마예요?", local: "Magkano?", pron: "막카노" },
      { category: "쇼핑", ko: "깎아주세요", local: "Pwede tawad?", pron: "뿌웨데 따와드" },
      { category: "교통", ko: "여기로 가주세요", local: "Dito po", pron: "디또 뽀" },
      { category: "교통", ko: "여기서 세워주세요", local: "Para po", pron: "빠라 뽀" },
      { category: "긴급", ko: "도와주세요", local: "Tulong!", pron: "뚤롱" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Nasaan ang banyo?", pron: "나사안 앙 반요" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description: "팁 문화가 있어요. 식당·호텔에서 10% 안팎을 주는 게 일반적이에요.",
      },
      {
        title: "영어 소통",
        description: "영어가 널리 통해서 의사소통이 어렵지 않아요.",
      },
      {
        title: "주의할 점",
        description:
          "우기(6~11월) 스콜·태풍에 대비하고, 밤길 이동은 그랩(Grab)을 권장해요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      {
        id: "etravel",
        label: "eTravel 등록",
        hint: "입국 전 온라인 신고",
        category: "서류",
      },
      { id: "sunscreen-ph", label: "모기 기피제 / 자외선 차단제", category: "상비약" },
    ],
  },
  {
    code: "FR",
    name: "프랑스",
    flag: "🇫🇷",
    currency: "EUR",
    currencySymbol: "€",
    currencyName: "유로",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "에스프레소", amount: 2 },
      { emoji: "🥐", label: "크루아상", amount: 1.5 },
      { emoji: "🚇", label: "지하철", amount: 2.15 },
      { emoji: "🍺", label: "맥주", amount: 7 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Bonjour", pron: "봉주르" },
      { category: "기본", ko: "감사합니다", local: "Merci", pron: "메르시" },
      { category: "기본", ko: "실례합니다", local: "Excusez-moi", pron: "엑스퀴제무아" },
      { category: "식당", ko: "주문할게요", local: "Je voudrais commander", pron: "즈 부드레 코망데" },
      { category: "식당", ko: "계산서 주세요", local: "L'addition, s'il vous plaît", pron: "라디시옹 실 부 플레" },
      { category: "쇼핑", ko: "얼마예요?", local: "C'est combien ?", pron: "세 콩비앙" },
      { category: "쇼핑", ko: "카드 되나요?", local: "Je peux payer par carte ?", pron: "즈 푀 페이에 파르 카르트" },
      { category: "교통", ko: "여기로 가주세요", local: "Amenez-moi ici, s'il vous plaît", pron: "아므네무아 이시 실 부 플레" },
      { category: "교통", ko: "여기서 세워주세요", local: "Arrêtez-vous ici", pron: "아레테부 이시" },
      { category: "긴급", ko: "도와주세요", local: "Au secours !", pron: "오 스쿠르" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Où sont les toilettes ?", pron: "우 송 레 투알렛" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "봉사료가 요금에 포함돼요. 만족했다면 잔돈 정도만 남기면 충분해요.",
      },
      {
        title: "인사 예절",
        description:
          "상점에 들어가고 나올 때 Bonjour·Au revoir 인사가 기본 예의예요.",
      },
      {
        title: "소매치기",
        description: "관광지·지하철에 소매치기가 많아요. 가방은 앞으로 메세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "adapter-c", label: "C타입 멀티 어댑터", category: "전자기기" },
      { id: "anti-theft", label: "소매치기 대비 크로스백", category: "기타" },
    ],
  },
  {
    code: "IT",
    name: "이탈리아",
    flag: "🇮🇹",
    currency: "EUR",
    currencySymbol: "€",
    currencyName: "유로",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "에스프레소", amount: 1.2 },
      { emoji: "🍕", label: "피자 마르게리타", amount: 8 },
      { emoji: "🚇", label: "버스·지하철", amount: 1.5 },
      { emoji: "🍨", label: "젤라토", amount: 3 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Buongiorno", pron: "부온조르노" },
      { category: "기본", ko: "감사합니다", local: "Grazie", pron: "그라찌에" },
      { category: "기본", ko: "실례합니다", local: "Scusi", pron: "스쿠지" },
      { category: "식당", ko: "주문할게요", local: "Vorrei ordinare", pron: "보레이 오르디나레" },
      { category: "식당", ko: "계산서 주세요", local: "Il conto, per favore", pron: "일 콘토 페르 파보레" },
      { category: "쇼핑", ko: "얼마예요?", local: "Quanto costa?", pron: "콴토 코스타" },
      { category: "쇼핑", ko: "카드 되나요?", local: "Posso pagare con carta?", pron: "포소 파가레 콘 카르타" },
      { category: "교통", ko: "여기로 가주세요", local: "Mi porti qui, per favore", pron: "미 포르티 퀴 페르 파보레" },
      { category: "교통", ko: "여기서 세워주세요", local: "Si fermi qui", pron: "시 페르미 퀴" },
      { category: "긴급", ko: "도와주세요", local: "Aiuto!", pron: "아이우토" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Dov'è il bagno?", pron: "도베 일 바뇨" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "자릿세(코페르토)가 계산서에 포함돼요. 별도 팁 관습은 약한 편이에요.",
      },
      {
        title: "카페 이용",
        description: "바에 서서 마시면 저렴하고, 앉으면 자릿세가 붙어요.",
      },
      {
        title: "소매치기",
        description: "로마·나폴리 등 관광지에서 소매치기를 조심하세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "adapter-c", label: "C타입 멀티 어댑터", category: "전자기기" },
      {
        id: "attraction-booking",
        label: "주요 명소 사전 예약",
        hint: "콜로세오 등",
        category: "기타",
      },
    ],
  },
  {
    code: "ES",
    name: "스페인",
    flag: "🇪🇸",
    currency: "EUR",
    currencySymbol: "€",
    currencyName: "유로",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 1.5 },
      { emoji: "🥘", label: "타파스", amount: 3 },
      { emoji: "🚇", label: "지하철", amount: 1.5 },
      { emoji: "🍺", label: "맥주(카냐)", amount: 2.5 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Hola", pron: "올라" },
      { category: "기본", ko: "감사합니다", local: "Gracias", pron: "그라시아스" },
      { category: "기본", ko: "실례합니다", local: "Perdón", pron: "페르돈" },
      { category: "식당", ko: "주문할게요", local: "Quiero pedir", pron: "키에로 페디르" },
      { category: "식당", ko: "계산서 주세요", local: "La cuenta, por favor", pron: "라 쿠엔타 포르 파보르" },
      { category: "쇼핑", ko: "얼마예요?", local: "¿Cuánto cuesta?", pron: "콴토 쿠에스타" },
      { category: "쇼핑", ko: "카드 되나요?", local: "¿Puedo pagar con tarjeta?", pron: "푸에도 파가르 콘 타르헤타" },
      { category: "교통", ko: "여기로 가주세요", local: "Lléveme aquí, por favor", pron: "예베메 아키 포르 파보르" },
      { category: "교통", ko: "여기서 세워주세요", local: "Pare aquí", pron: "파레 아키" },
      { category: "긴급", ko: "도와주세요", local: "¡Ayuda!", pron: "아유다" },
      { category: "긴급", ko: "화장실 어디예요?", local: "¿Dónde está el baño?", pron: "돈데 에스타 엘 바뇨" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description: "의무가 아니에요. 만족하면 잔돈~5% 정도만 남겨요.",
      },
      {
        title: "생활 리듬",
        description:
          "낮에 시에스타로 문을 닫는 상점이 있고, 저녁 식사는 21시 이후가 흔해요.",
      },
      {
        title: "소매치기",
        description: "바르셀로나 람블라스 거리 등에서 소매치기를 조심하세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "adapter-c", label: "C타입 멀티 어댑터", category: "전자기기" },
      { id: "anti-theft", label: "소매치기 대비 크로스백", category: "기타" },
    ],
  },
  {
    code: "GB",
    name: "영국",
    flag: "🇬🇧",
    currency: "GBP",
    currencySymbol: "£",
    currencyName: "파운드",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 3 },
      { emoji: "🍔", label: "버거 세트", amount: 8 },
      { emoji: "🚇", label: "튜브 기본", amount: 2.8 },
      { emoji: "🍺", label: "맥주(파인트)", amount: 6 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Hello", pron: "헬로" },
      { category: "기본", ko: "감사합니다", local: "Thank you", pron: "땡큐" },
      { category: "기본", ko: "실례합니다", local: "Excuse me", pron: "익스큐즈 미" },
      { category: "식당", ko: "주문할게요", local: "I'd like to order", pron: "아이드 라이크 투 오더" },
      { category: "식당", ko: "계산서 주세요", local: "Could I get the bill?", pron: "쿠드 아이 겟 더 빌" },
      { category: "쇼핑", ko: "얼마예요?", local: "How much is it?", pron: "하우 머치 이즈 잇" },
      { category: "쇼핑", ko: "카드 되나요?", local: "Do you take card?", pron: "두 유 테이크 카드" },
      { category: "교통", ko: "여기로 가주세요", local: "Take me here, please", pron: "테이크 미 히어 플리즈" },
      { category: "교통", ko: "여기서 세워주세요", local: "Stop here, please", pron: "스탑 히어 플리즈" },
      { category: "긴급", ko: "도와주세요", local: "Help, please", pron: "헬프 플리즈" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Where's the toilet?", pron: "웨어즈 더 토일렛" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "식당은 10~12.5%가 일반적이에요. 서비스 차지 포함 여부를 확인하고, 펍에서 카운터 주문 시엔 팁이 없어요.",
      },
      {
        title: "교통 예절",
        description: "좌측통행이고, 에스컬레이터는 오른쪽에 서요.",
      },
      {
        title: "결제",
        description: "컨택리스(카드·폰) 탭 결제가 어디서나 통해요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "adapter-g", label: "G타입(영국식) 어댑터", category: "전자기기" },
      { id: "contactless", label: "컨택리스 결제 카드", category: "기타" },
    ],
  },
  {
    code: "CN",
    name: "중국",
    flag: "🇨🇳",
    currency: "CNY",
    currencySymbol: "¥",
    currencyName: "위안",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 25 },
      { emoji: "🍜", label: "면 요리", amount: 25 },
      { emoji: "🚇", label: "지하철 기본", amount: 3 },
      { emoji: "🍺", label: "맥주", amount: 10 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "你好", pron: "니하오" },
      { category: "기본", ko: "감사합니다", local: "谢谢", pron: "셰셰" },
      { category: "기본", ko: "실례합니다", local: "不好意思", pron: "뿌하오이쓰" },
      { category: "식당", ko: "주문할게요", local: "我要点菜", pron: "워 야오 디엔차이" },
      { category: "식당", ko: "계산해 주세요", local: "买单", pron: "마이단" },
      { category: "쇼핑", ko: "얼마예요?", local: "多少钱", pron: "뚸사오 첸" },
      { category: "쇼핑", ko: "카드 되나요?", local: "可以刷卡吗", pron: "커이 슈아카 마" },
      { category: "교통", ko: "여기로 가주세요", local: "到这里", pron: "따오 저리" },
      { category: "교통", ko: "여기서 세워주세요", local: "停这里", pron: "팅 저리" },
      { category: "긴급", ko: "도와주세요", local: "救命", pron: "지우밍" },
      { category: "긴급", ko: "화장실 어디예요?", local: "厕所在哪里", pron: "처쒀 짜이 나리" },
    ],
    mannerTips: [
      { title: "팁 문화", description: "팁 문화가 없어요." },
      {
        title: "결제",
        description:
          "알리페이·위챗페이 중심이에요. 현금·해외카드가 제한적이니 미리 준비하세요.",
      },
      {
        title: "인터넷",
        description: "구글·카카오톡 등이 차단돼요. 로밍이나 VPN을 고려하세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      {
        id: "cn-visa",
        label: "비자·무비자 조건 확인",
        hint: "체류 목적·기간별로 달라요",
        category: "서류",
      },
      { id: "cn-pay", label: "알리페이·위챗페이 설정", category: "기타" },
    ],
  },
  {
    code: "HK",
    name: "홍콩",
    flag: "🇭🇰",
    currency: "HKD",
    currencySymbol: "HK$",
    currencyName: "홍콩 달러",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 35 },
      { emoji: "🍜", label: "완탕면", amount: 45 },
      { emoji: "🚇", label: "MTR 기본", amount: 5 },
      { emoji: "🥟", label: "딤섬", amount: 40 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "你好", pron: "네이호우" },
      { category: "기본", ko: "감사합니다", local: "唔該", pron: "음꼬이" },
      { category: "기본", ko: "죄송합니다", local: "對唔住", pron: "도이음쥐" },
      { category: "식당", ko: "계산해 주세요", local: "埋單", pron: "마이단" },
      { category: "식당", ko: "이거 주세요", local: "要呢個", pron: "유 니고" },
      { category: "쇼핑", ko: "얼마예요?", local: "幾多錢", pron: "께이도친" },
      { category: "쇼핑", ko: "카드 되나요?", local: "可唔可以碌卡", pron: "호음호이 룩카" },
      { category: "교통", ko: "여기로 가주세요", local: "去呢度", pron: "회이 니도" },
      { category: "교통", ko: "여기서 세워주세요", local: "呢度落車", pron: "니도 록체" },
      { category: "긴급", ko: "도와주세요", local: "救命", pron: "까우멩" },
      { category: "긴급", ko: "화장실 어디예요?", local: "洗手間喺邊度", pron: "사이사우간 하이빈도" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "식당은 보통 봉사료 10%가 포함돼요. 잔돈 정도만 추가로 남겨요.",
      },
      {
        title: "교통카드",
        description: "옥토퍼스(Octopus) 카드로 MTR·버스·편의점까지 편하게 써요.",
      },
      {
        title: "교통",
        description: "좌측통행이에요. 길 건널 때 오는 방향에 유의하세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "octopus", label: "옥토퍼스 카드", category: "기타" },
      { id: "adapter-g", label: "G타입(영국식) 어댑터", category: "전자기기" },
    ],
  },
  {
    code: "GU",
    name: "괌",
    flag: "🇬🇺",
    currency: "USD",
    currencySymbol: "$",
    currencyName: "달러",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 4 },
      { emoji: "🍔", label: "버거 세트", amount: 12 },
      { emoji: "🚕", label: "택시 기본", amount: 4 },
      { emoji: "🍺", label: "맥주", amount: 6 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Hello / Håfa adai", pron: "헬로 / 하파다이" },
      { category: "기본", ko: "감사합니다", local: "Thank you", pron: "땡큐" },
      { category: "기본", ko: "실례합니다", local: "Excuse me", pron: "익스큐즈 미" },
      { category: "식당", ko: "주문할게요", local: "I'd like to order", pron: "아이드 라이크 투 오더" },
      { category: "식당", ko: "계산서 주세요", local: "Check, please", pron: "첵 플리즈" },
      { category: "쇼핑", ko: "얼마예요?", local: "How much is it?", pron: "하우 머치 이즈 잇" },
      { category: "쇼핑", ko: "카드 되나요?", local: "Do you take card?", pron: "두 유 테이크 카드" },
      { category: "교통", ko: "여기로 가주세요", local: "Take me here, please", pron: "테이크 미 히어 플리즈" },
      { category: "교통", ko: "여기서 세워주세요", local: "Stop here, please", pron: "스탑 히어 플리즈" },
      { category: "긴급", ko: "도와주세요", local: "Help me, please", pron: "헬프 미 플리즈" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Where's the restroom?", pron: "웨어즈 더 레스트룸" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description: "미국식 팁 문화예요. 식당은 15~20% 정도 팁을 줘요.",
      },
      {
        title: "세금",
        description: "표시 가격에 세금이 빠져 있어 결제 시 금액이 올라가요.",
      },
      {
        title: "입국",
        description: "ESTA 또는 괌·CNMI 전용 무비자(G-visa) 자격을 확인하세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      {
        id: "gu-entry",
        label: "ESTA 또는 무비자 서류 확인",
        hint: "괌 G-visa waiver",
        category: "서류",
      },
      { id: "sunscreen-gu", label: "자외선 차단제 / 물놀이 용품", category: "상비약" },
    ],
    tipping: {
      presets: [18, 20, 15],
      note: "식당은 보통 세전 금액의 15~20%를 팁으로 줘요.",
    },
  },
  {
    code: "AU",
    name: "호주",
    flag: "🇦🇺",
    currency: "AUD",
    currencySymbol: "A$",
    currencyName: "호주 달러",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "플랫화이트", amount: 4.5 },
      { emoji: "🍔", label: "버거", amount: 15 },
      { emoji: "🚆", label: "대중교통 기본", amount: 4 },
      { emoji: "🍺", label: "맥주(스쿠너)", amount: 9 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Hello", pron: "헬로" },
      { category: "기본", ko: "감사합니다", local: "Thank you", pron: "땡큐" },
      { category: "기본", ko: "실례합니다", local: "Excuse me", pron: "익스큐즈 미" },
      { category: "식당", ko: "주문할게요", local: "I'd like to order", pron: "아이드 라이크 투 오더" },
      { category: "식당", ko: "계산서 주세요", local: "Can I get the bill?", pron: "캔 아이 겟 더 빌" },
      { category: "쇼핑", ko: "얼마예요?", local: "How much is it?", pron: "하우 머치 이즈 잇" },
      { category: "쇼핑", ko: "카드 되나요?", local: "Do you take card?", pron: "두 유 테이크 카드" },
      { category: "교통", ko: "여기로 가주세요", local: "Take me here, please", pron: "테이크 미 히어 플리즈" },
      { category: "교통", ko: "여기서 세워주세요", local: "Stop here, please", pron: "스탑 히어 플리즈" },
      { category: "긴급", ko: "도와주세요", local: "Help, please", pron: "헬프 플리즈" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Where's the toilet?", pron: "웨어즈 더 토일렛" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "팁 문화가 약해요. 의무가 아니라 특별히 만족했을 때만 줘요.",
      },
      {
        title: "입국·검역",
        description:
          "ETA(전자여행허가)가 필요하고, 음식물 검역이 매우 엄격해요. 반입품을 반드시 신고하세요.",
      },
      {
        title: "자외선",
        description: "자외선이 매우 강해요. 선크림과 모자를 꼭 챙기세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      { id: "au-eta", label: "ETA 전자여행허가", category: "서류" },
      { id: "adapter-i", label: "I타입 어댑터", category: "전자기기" },
      { id: "sunscreen-au", label: "자외선 차단제", category: "상비약" },
    ],
  },
  {
    code: "MY",
    name: "말레이시아",
    flag: "🇲🇾",
    currency: "MYR",
    currencySymbol: "RM",
    currencyName: "링깃",
    fractionDigits: 2,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피(코피)", amount: 3 },
      { emoji: "🍚", label: "나시르막", amount: 8 },
      { emoji: "🚆", label: "LRT 기본", amount: 2 },
      { emoji: "🍺", label: "맥주", amount: 15 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Apa khabar", pron: "아파 카바르" },
      { category: "기본", ko: "감사합니다", local: "Terima kasih", pron: "뜨리마 까시" },
      { category: "기본", ko: "실례합니다", local: "Maaf", pron: "마아프" },
      { category: "식당", ko: "주문할게요", local: "Saya nak pesan", pron: "사야 낙 프산" },
      { category: "식당", ko: "계산해 주세요", local: "Boleh kira?", pron: "볼레 끼라" },
      { category: "쇼핑", ko: "얼마예요?", local: "Berapa harga?", pron: "브라파 하르가" },
      { category: "쇼핑", ko: "깎아주세요", local: "Boleh kurang?", pron: "볼레 꾸랑" },
      { category: "교통", ko: "여기로 가주세요", local: "Ke sini", pron: "크 시니" },
      { category: "교통", ko: "여기서 세워주세요", local: "Berhenti di sini", pron: "브르헨티 디 시니" },
      { category: "긴급", ko: "도와주세요", local: "Tolong!", pron: "똘롱" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Di mana tandas?", pron: "디 마나 딴다스" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description: "보통 서비스 차지(10%)가 포함돼 별도 팁은 필요 없어요.",
      },
      {
        title: "종교·예절",
        description:
          "이슬람 문화권이에요. 사원 방문 시 복장을 갖추고, 물건은 오른손으로 건네요.",
      },
      {
        title: "날씨",
        description: "덥고 스콜이 잦아요. 우산과 자외선 차단을 준비하세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      {
        id: "mdac",
        label: "MDAC 온라인 등록",
        hint: "말레이시아 입국카드",
        category: "서류",
      },
      { id: "adapter-g", label: "G타입(영국식) 어댑터", category: "전자기기" },
    ],
  },
  {
    code: "ID",
    name: "인도네시아",
    flag: "🇮🇩",
    currency: "IDR",
    currencySymbol: "Rp",
    currencyName: "루피아",
    fractionDigits: 0,
    // 대략적 현지 물가(환산 감각용)
    localPrices: [
      { emoji: "☕", label: "커피", amount: 25000 },
      { emoji: "🍚", label: "나시고렝", amount: 35000 },
      { emoji: "🏍️", label: "고젝(오토바이)", amount: 15000 },
      { emoji: "🍺", label: "맥주(빈땅)", amount: 35000 },
    ],
    phrases: [
      { category: "기본", ko: "안녕하세요", local: "Halo", pron: "할로" },
      { category: "기본", ko: "감사합니다", local: "Terima kasih", pron: "뜨리마 까시" },
      { category: "기본", ko: "실례합니다", local: "Permisi", pron: "프르미시" },
      { category: "식당", ko: "주문할게요", local: "Saya mau pesan", pron: "사야 마우 프산" },
      { category: "식당", ko: "계산해 주세요", local: "Minta bon", pron: "민따 본" },
      { category: "쇼핑", ko: "얼마예요?", local: "Berapa harganya?", pron: "브라파 하르가냐" },
      { category: "쇼핑", ko: "깎아주세요", local: "Boleh kurang?", pron: "볼레 꾸랑" },
      { category: "교통", ko: "여기로 가주세요", local: "Ke sini", pron: "크 시니" },
      { category: "교통", ko: "여기서 세워주세요", local: "Berhenti di sini", pron: "브르헨띠 디 시니" },
      { category: "긴급", ko: "도와주세요", local: "Tolong!", pron: "똘롱" },
      { category: "긴급", ko: "화장실 어디예요?", local: "Di mana toilet?", pron: "디 마나 토일렛" },
    ],
    mannerTips: [
      {
        title: "팁 문화",
        description:
          "의무는 아니지만 소액 팁이 환영받아요. 일부 호텔·식당은 서비스 차지가 포함돼요.",
      },
      {
        title: "사원 방문",
        description: "발리 사원에서는 사룽(천)을 두르고 노출 있는 복장을 피해요.",
      },
      {
        title: "교통·환전",
        description: "고젝·그랩 이용을 권장하고, 환전은 인가 환전소를 이용하세요.",
      },
    ],
    checklistPreset: [
      ...commonChecklist,
      {
        id: "id-visa",
        label: "도착비자(VOA) 또는 e-VOA 준비",
        hint: "발리 등 입국 시",
        category: "서류",
      },
      { id: "repellent-id", label: "모기 기피제 / 지사제", category: "상비약" },
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
  return (
    COUNTRIES.find((c) => c.code === code) ??
    COUNTRIES.find((c) => c.code === DEFAULT_COUNTRY_CODE) ??
    COUNTRIES[0]
  );
}

// ---- 현지 실용 정보 (#7) ----

export interface EmergencyContact {
  label: string;
  number: string;
}

export interface PracticalInfo {
  /** 한국과의 시차 안내 문구 */
  timeDiff: string;
  /** 히어로 카드용 짧은 시차 표기 (예: "없음", "−2시간") */
  timeDiffShort: string;
  /** 콘센트 플러그 타입 + 전압 */
  plug: string;
  /** 히어로 카드용 짧은 전원 표기 (예: "100V · A") */
  plugShort: string;
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
    timeDiffShort: "없음",
    plug: "A타입 · 100V (한국 어댑터 필요)",
    plugShort: "100V · A",
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
    timeDiffShort: "−2시간",
    plug: "A·C·F타입 혼용 · 220V",
    plugShort: "220V · A·C·F",
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
    timeDiffShort: "−2시간",
    plug: "A·C타입 · 220V",
    plugShort: "220V · A·C",
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
    timeDiffShort: "−13~16시간",
    plug: "A·B타입 · 120V",
    plugShort: "120V · A·B",
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
    timeDiffShort: "−1시간",
    plug: "G타입(영국식) · 230V (전용 어댑터 필요)",
    plugShort: "230V · G",
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
  TW: {
    timeDiff: "한국보다 1시간 느려요",
    timeDiffShort: "−1시간",
    plug: "A·B타입 · 110V",
    plugShort: "110V · A·B",
    tapWater: "수돗물은 마시지 말고 생수를 권장해요",
    emergency: [
      { label: "경찰", number: "110" },
      { label: "구급·소방", number: "119" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "야시장에서 흥정·바가지에 유의하세요.",
      "택시는 미터기 사용 여부를 확인하세요.",
    ],
  },
  PH: {
    timeDiff: "한국보다 1시간 느려요",
    timeDiffShort: "−1시간",
    plug: "A·B·C타입 · 220V",
    plugShort: "220V · A·B·C",
    tapWater: "수돗물은 마시지 말고 생수를 권장해요",
    emergency: [{ label: "통합 긴급(경찰·구급·소방)", number: "911" }],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "택시 미터기 거부·바가지에 유의하고 그랩(Grab)을 권장해요.",
      "환전은 인가 환전소를 이용하고 야간 이동을 조심하세요.",
    ],
  },
  FR: {
    timeDiff: "한국보다 7~8시간 느려요 (서머타임)",
    timeDiffShort: "−7~8시간",
    plug: "C·E타입 · 230V",
    plugShort: "230V · C·E",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [
      { label: "통합 긴급(EU)", number: "112" },
      { label: "경찰", number: "17" },
      { label: "구급(SAMU)", number: "15" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "에펠탑·몽마르트르 주변 팔찌 강매·서명 사기를 조심하세요.",
      "지하철·기차에서 가방을 몸 앞으로 두세요.",
    ],
  },
  IT: {
    timeDiff: "한국보다 7~8시간 느려요 (서머타임)",
    timeDiffShort: "−7~8시간",
    plug: "C·F·L타입 · 230V",
    plugShort: "230V · C·F·L",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [{ label: "통합 긴급(EU)", number: "112" }],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "로마 명소 주변 팔찌 강매·가짜 청원 서명을 조심하세요.",
      "버스·지하철 소매치기가 많으니 소지품에 유의하세요.",
    ],
  },
  ES: {
    timeDiff: "한국보다 7~8시간 느려요 (서머타임)",
    timeDiffShort: "−7~8시간",
    plug: "C·F타입 · 230V",
    plugShort: "230V · C·F",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [{ label: "통합 긴급(EU)", number: "112" }],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "바르셀로나 람블라스 거리 소매치기가 악명 높아요.",
      "도움을 주는 척 시선을 끄는 수법에 주의하세요.",
    ],
  },
  GB: {
    timeDiff: "한국보다 8~9시간 느려요 (서머타임)",
    timeDiffShort: "−8~9시간",
    plug: "G타입(영국식) · 230V (전용 어댑터 필요)",
    plugShort: "230V · G",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [
      { label: "통합 긴급", number: "999" },
      { label: "긴급(대체)", number: "112" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "관광지에서 소매치기와 가짜 자선 모금을 조심하세요.",
      "무허가 택시 대신 블랙캡·우버를 이용하세요.",
    ],
  },
  CN: {
    timeDiff: "한국보다 1시간 느려요",
    timeDiffShort: "−1시간",
    plug: "A·C·I타입 · 220V",
    plugShort: "220V · A·C·I",
    tapWater: "수돗물은 마시지 말고 생수를 권장해요",
    emergency: [
      { label: "경찰", number: "110" },
      { label: "구급", number: "120" },
      { label: "소방", number: "119" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "찻집·미술관 초대 후 바가지를 씌우는 수법을 조심하세요.",
      "무허가 택시·환전을 피하고 공식 앱 결제를 이용하세요.",
    ],
  },
  HK: {
    timeDiff: "한국보다 1시간 느려요",
    timeDiffShort: "−1시간",
    plug: "G타입(영국식) · 220V",
    plugShort: "220V · G",
    tapWater: "수돗물을 마실 수 있지만 생수를 쓰는 경우가 많아요",
    emergency: [{ label: "통합 긴급", number: "999" }],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "관광지 상점의 전자제품 가격 바가지에 유의하세요.",
      "번화가 호객·환전 사기를 조심하세요.",
    ],
  },
  GU: {
    timeDiff: "한국보다 1시간 빨라요",
    timeDiffShort: "+1시간",
    plug: "A·B타입 · 110~120V",
    plugShort: "120V · A·B",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [{ label: "통합 긴급(경찰·구급·소방)", number: "911" }],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "대체로 안전하지만 렌터카·물놀이 시 귀중품 분실에 유의하세요.",
      "야간에 인적 드문 해변은 피하세요.",
    ],
  },
  AU: {
    timeDiff: "한국보다 1~2시간 빨라요 (동부·서머타임)",
    timeDiffShort: "+1~2시간",
    plug: "I타입 · 230V (전용 어댑터 필요)",
    plugShort: "230V · I",
    tapWater: "수돗물을 마실 수 있어요",
    emergency: [
      { label: "통합 긴급", number: "000" },
      { label: "긴급(휴대폰)", number: "112" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "가짜 검역·세금 환급 문자(스미싱)를 조심하세요.",
      "야생동물 접근과 강한 파도·이안류에 유의하세요.",
    ],
  },
  MY: {
    timeDiff: "한국보다 1시간 느려요",
    timeDiffShort: "−1시간",
    plug: "G타입(영국식) · 240V",
    plugShort: "240V · G",
    tapWater: "수돗물은 마시지 말고 생수를 권장해요",
    emergency: [
      { label: "통합 긴급", number: "999" },
      { label: "긴급(휴대폰)", number: "112" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "택시 미터기 거부·바가지에 유의하고 그랩(Grab)을 권장해요.",
      "환전은 인가 환전소를 이용하세요.",
    ],
  },
  ID: {
    timeDiff: "한국보다 1~2시간 느려요 (지역별)",
    timeDiffShort: "−1~2시간",
    plug: "C·F타입 · 230V",
    plugShort: "230V · C·F",
    tapWater: "수돗물은 마시지 말고 생수를 권장해요",
    emergency: [
      { label: "통합 긴급", number: "112" },
      { label: "경찰", number: "110" },
      { label: "구급", number: "118" },
    ],
    embassy: CONSULAR_CALL_CENTER,
    scams: [
      "택시 미터기 거부·환전 사기에 유의하고 그랩·고젝을 권장해요.",
      "오토바이 대여 시 보험·헬멧을 확인하세요.",
    ],
  },
};

export function getPracticalInfo(code: string): PracticalInfo {
  return PRACTICAL[code] ?? PRACTICAL[DEFAULT_COUNTRY_CODE];
}
