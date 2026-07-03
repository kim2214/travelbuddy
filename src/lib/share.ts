// 토스 공유 시트로 앱을 공유해요.
// getTossShareLink로 토스 앱에서 열리는 공유 링크를 만든 뒤 share로 네이티브 공유 시트를 띄워요.
// 토스 앱 밖(브라우저 등)이나 사용자가 취소하면 조용히 무시돼요.

import { getTossShareLink, share } from "@apps-in-toss/web-framework";

// granite.config.ts의 appName과 동일해야 해요.
const APP_DEEPLINK = "intoss://travelbuddy";
// 공유 카드 미리보기(OG) 이미지 — granite.config.ts의 앱 아이콘과 동일해요.
const OG_IMAGE_URL =
  "https://static.toss.im/appsintoss/53765/c9fb1bd6-f85b-4725-a2e3-c4aa2a7e759b.png";

/**
 * 여행친구 앱을 공유해요.
 * 받은 사람이 같은 여행지로 바로 진입하도록 `?country=<code>`를 딥링크에 담아요.
 */
export async function shareTravelBuddy(country: { code: string; name: string }): Promise<void> {
  try {
    const link = await getTossShareLink(`${APP_DEEPLINK}?country=${country.code}`, OG_IMAGE_URL);
    await share({
      message: `${country.name} 여행 준비, 여행친구에서 환율·준비물·현지정보를 한 번에! ${link}`,
    });
  } catch {
    // 공유 취소/미지원 환경은 조용히 무시해요.
  }
}
