// 현재 GPS 위치 → 역지오코딩으로 체류 국가를 판별해요.
// 무료·무키 클라이언트용 API(BigDataCloud)를 사용하고, 우리가 지원하는 국가일 때만 코드를 반환해요.
// 권한 거부/실패 시에는 null을 반환해 기본 국가를 유지해요.

import { Accuracy, getCurrentLocation } from "@apps-in-toss/web-framework";

import { COUNTRIES } from "../data/countries";

const SUPPORTED = new Set(COUNTRIES.map((c) => c.code));

interface ReverseGeocodeResponse {
  countryCode?: string;
}

/**
 * 현재 위치를 한 번 가져와 체류 국가 코드(ISO alpha-2)를 반환해요.
 * 지원하지 않는 국가이거나 권한 거부/오류 시 null.
 */
export async function detectCountryByGPS(): Promise<string | null> {
  try {
    const { coords } = await getCurrentLocation({ accuracy: Accuracy.Balanced });
    const { latitude, longitude } = coords;
    const url =
      "https://api.bigdatacloud.net/data/reverse-geocode-client" +
      `?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`;
    const res = await fetch(url);
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as ReverseGeocodeResponse;
    const code = data.countryCode?.toUpperCase();
    return code != null && SUPPORTED.has(code) ? code : null;
  } catch {
    // 위치 권한 거부, 네트워크 실패 등 → 기본 국가 유지
    return null;
  }
}
