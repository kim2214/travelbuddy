// 토스 공유 시트로 앱을 공유해요.
// getTossShareLink로 토스 앱에서 열리는 공유 링크를 만든 뒤 share로 네이티브 공유 시트를 띄워요.
// 토스 앱 밖(브라우저 등)이나 사용자가 취소하면 조용히 무시돼요.

import { getTossShareLink, share } from "@apps-in-toss/web-framework";

// granite.config.ts의 appName과 동일해야 해요.
const APP_DEEPLINK = "intoss://travelbuddy";

/** 여행친구 앱을 공유해요. countryName은 공유 문구에 들어가요. */
export async function shareTravelBuddy(countryName: string): Promise<void> {
  try {
    const link = await getTossShareLink(APP_DEEPLINK);
    await share({
      message: `${countryName} 여행 준비, 여행친구에서 환율·준비물·현지정보를 한 번에! ${link}`,
    });
  } catch {
    // 공유 취소/미지원 환경은 조용히 무시해요.
  }
}
