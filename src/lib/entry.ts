// 진입 스킴(intoss://travelbuddy?...)의 파라미터를 읽어요.
//
// - `country`: 공유 링크(intoss://travelbuddy?country=JP)로 진입하면 그 국가로 바로 열어요.
// - `tab`: 콘솔 '앱 내 기능'에 등록한 스킴(intoss://travelbuddy?tab=checklist)으로 진입하면
//   해당 탭으로 바로 열어요. (exchange | checklist | guide)

import { getSchemeUri } from "@apps-in-toss/web-framework";

import { COUNTRIES } from "../data/countries";
import { isTabKey, type TabKey } from "./tabs";

const SUPPORTED = new Set(COUNTRIES.map((c) => c.code));

/**
 * 처음 진입한 스킴의 쿼리 파라미터 값을 읽어요.
 * 파라미터가 없거나 토스 앱 밖(브라우저 등)이라 스킴을 못 읽으면 null.
 */
function getEntryParam(name: string): string | null {
  try {
    const uri = getSchemeUri();
    if (uri == null || uri === "") {
      return null;
    }
    const queryIndex = uri.indexOf("?");
    if (queryIndex < 0) {
      return null;
    }
    return new URLSearchParams(uri.slice(queryIndex + 1)).get(name);
  } catch {
    // 진입 스킴을 못 읽는 환경(브라우저 등)에서는 무시해요.
    return null;
  }
}

/**
 * 진입 스킴의 `country` 파라미터를 읽어 지원하는 국가 코드를 반환해요.
 * 파라미터가 없거나 미지원 국가이거나 토스 앱 밖(브라우저 등)이면 null.
 */
export function getCountryFromEntry(): string | null {
  const code = getEntryParam("country")?.toUpperCase();
  return code != null && SUPPORTED.has(code) ? code : null;
}

/**
 * 진입 스킴의 `tab` 파라미터를 읽어 처음 보여줄 탭을 반환해요.
 * 파라미터가 없거나 알 수 없는 값이거나 토스 앱 밖(브라우저 등)이면 null.
 */
export function getTabFromEntry(): TabKey | null {
  const tab = getEntryParam("tab")?.toLowerCase();
  return tab != null && isTabKey(tab) ? tab : null;
}
