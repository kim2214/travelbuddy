// 탭1: 1초 환율 계산기 + 현지 물가 감각.

import { Top } from "@toss/tds-mobile";

import { CountryHero } from "../components/CountryHero";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { LocalPricePresets } from "../components/LocalPricePresets";
import { ShareButton } from "../components/ShareButton";
import { TipCalculator } from "../components/TipCalculator";
import { useCountry } from "../context/CountryContext";

export function ExchangeScreen() {
  const { country } = useCountry();

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
      {/* 국가가 바뀌면 리마운트해요. 팁 비율 프리셋이 나라마다 달라서(예: 미국 18% → 태국 10%)
          상태를 이어받으면 선택되지 않은 비율로 계산되는 문제가 있어요. */}
      {country.tipping != null && (
        <TipCalculator key={country.code} tipping={country.tipping} />
      )}
    </div>
  );
}
