// 탭1: 1초 환율 계산기 + 현지 매너 팁.

import { Top } from "@toss/tds-mobile";

import { CountryHero } from "../components/CountryHero";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { LocalInfo } from "../components/LocalInfo";
import { LocalPricePresets } from "../components/LocalPricePresets";
import { MannerTips } from "../components/MannerTips";

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
      />
      <CountryHero />
      <div style={{ height: 12 }} />
      <CurrencyConverter />
      <LocalPricePresets />
      <MannerTips />
      <LocalInfo />
    </div>
  );
}
