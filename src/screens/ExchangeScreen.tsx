// 탭1: 1초 환율 계산기 + 현지 물가 감각.

import { Top } from "@toss/tds-mobile";

import { CountryHero } from "../components/CountryHero";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { LocalPricePresets } from "../components/LocalPricePresets";
import { ShareButton } from "../components/ShareButton";

export function ExchangeScreen() {
  return (
    <div>
      <Top
        title={<Top.TitleParagraph size={22}>1초 환율 계산기</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            여행지를 고르고 금액만 입력하세요
          </Top.SubtitleParagraph>
        }
        right={<ShareButton />}
      />
      <CountryHero />
      <div style={{ height: 12 }} />
      <CurrencyConverter />
      <LocalPricePresets />
    </div>
  );
}
