// 탭3: 현지 가이드 — 여행 회화 + 현지 매너 팁 + 현지 실용 정보.

import { Top } from "@toss/tds-mobile";

import { CountryHero } from "../components/CountryHero";
import { LocalInfo } from "../components/LocalInfo";
import { MannerTips } from "../components/MannerTips";
import { Phrasebook } from "../components/Phrasebook";
import { ShareButton } from "../components/ShareButton";

export function GuideScreen() {
  return (
    <div>
      <Top
        title={<Top.TitleParagraph size={22}>현지 가이드</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            현지에서 바로 꺼내보는 회화와 정보
          </Top.SubtitleParagraph>
        }
        right={<ShareButton />}
      />
      <CountryHero />
      <div style={{ height: 12 }} />
      <Phrasebook />
      <MannerTips />
      <LocalInfo />
    </div>
  );
}
