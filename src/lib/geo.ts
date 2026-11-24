// 현재 GPS 위치 → 역지오코딩으로 체류 국가를 판별해요.
// 무료·무키 클라이언트용 API(BigDataCloud)를 사용하고, 우리가 지원하는 국가일 때만 코드를 반환해요.
// 권한 거부/실패 시에는 null을 반환해 기본 국가를 유지해요.

import { Accuracy, getCurrentLocation } from "@apps-in-toss/web-framework";

import { COUNTRIES } from "../data/countries";
import { fetchWithTimeout } from "./fetchWithTimeout";

const SUPPORTED = new Set(COUNTRIES.map((c) => c.code));

/**
 * 외부 역지오코딩 API로 보내는 좌표의 소수 자릿수.
 * 국가만 알면 되므로 정확한 위치 대신 약 1km 격자(소수 2자리)로 뭉개서 보내요.
 * 더 거칠게(소수 1자리 ≈ 11km) 하면 싱가포르·홍콩처럼 국경이 가까운 곳에서
 * 옆 나라로 잘못 판별될 수 있어 2자리로 둬요.
 */
const COORDINATE_DECIMALS = 2;

/** 좌표를 COORDINATE_DECIMALS 자리로 반올림해요. */
export function coarsenCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS;
  return Math.round(value * factor) / factor;
}

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
    const latitude = coarsenCoordinate(coords.latitude);
    const longitude = coarsenCoordinate(coords.longitude);
    const url =
      "https://api.bigdatacloud.net/data/reverse-geocode-client" +
      `?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`;
    const res = await fetchWithTimeout(url);
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
