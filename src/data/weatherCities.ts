// 날씨 조회용 국가별 대표 도시 좌표.
// 나라마다 도시별 날씨가 다르므로, 한국인 여행 수요가 많은 대표 도시 1곳을 기준으로 해요.
// 화면에 도시 이름을 함께 표기해 어느 도시 기준인지 명확히 알려줘요.

export interface WeatherCity {
  /** 화면에 표기할 도시 이름 */
  label: string;
  latitude: number;
  longitude: number;
}

export const WEATHER_CITY_BY_COUNTRY: Record<string, WeatherCity> = {
  JP: { label: "도쿄", latitude: 35.68, longitude: 139.69 },
  TH: { label: "방콕", latitude: 13.76, longitude: 100.5 },
  VN: { label: "다낭", latitude: 16.05, longitude: 108.2 },
  US: { label: "뉴욕", latitude: 40.71, longitude: -74.01 },
  SG: { label: "싱가포르", latitude: 1.35, longitude: 103.82 },
  TW: { label: "타이베이", latitude: 25.03, longitude: 121.57 },
  PH: { label: "세부", latitude: 10.32, longitude: 123.9 },
  FR: { label: "파리", latitude: 48.86, longitude: 2.35 },
  IT: { label: "로마", latitude: 41.9, longitude: 12.5 },
  ES: { label: "바르셀로나", latitude: 41.39, longitude: 2.17 },
  GB: { label: "런던", latitude: 51.51, longitude: -0.13 },
  CN: { label: "상하이", latitude: 31.23, longitude: 121.47 },
  HK: { label: "홍콩", latitude: 22.32, longitude: 114.17 },
  GU: { label: "괌", latitude: 13.44, longitude: 144.79 },
  AU: { label: "시드니", latitude: -33.87, longitude: 151.21 },
  MY: { label: "쿠알라룸푸르", latitude: 3.14, longitude: 101.69 },
  ID: { label: "발리", latitude: -8.65, longitude: 115.22 },
};
