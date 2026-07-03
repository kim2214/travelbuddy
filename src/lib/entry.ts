// 진입 스킴에서 여행지(국가)를 읽어요.
// 공유 링크(intoss://travelbuddy?country=JP)로 진입하면 그 국가로 바로 열 수 있게 해줘요.

import { getSchemeUri } from "@apps-in-toss/web-framework";

import { COUNTRIES } from "../data/countries";

const SUPPORTED = new Set(COUNTRIES.map((c) => c.code));

/**
 * 처음 진입한 스킴의 `country` 파라미터를 읽어 지원하는 국가 코드를 반환해요.
 * 파라미터가 없거나 미지원 국가이거나 토스 앱 밖(브라우저 등)이면 null.
 */
export function getCountryFromEntry(): string | null {
  try {
    const uri = getSchemeUri();
    if (uri == null || uri === "") {
      return null;
    }
    const queryIndex = uri.indexOf("?");
    if (queryIndex < 0) {
      return null;
    }
    const code = new URLSearchParams(uri.slice(queryIndex + 1)).get("country")?.toUpperCase();
    return code != null && SUPPORTED.has(code) ? code : null;
  } catch {
    // 진입 스킴을 못 읽는 환경(브라우저 등)에서는 무시해요.
    return null;
  }
}
