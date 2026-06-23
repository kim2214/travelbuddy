// 탭2: 국가별 준비물 체크리스트 + 연계 상품(eSIM/보험/환전) 유도.

import { Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";

import { CountrySelector } from "../components/CountrySelector";
import { Checklist } from "../components/Checklist";
import { ProductCard } from "../components/ProductCard";
import {
  ESIM_PRODUCT,
  INSURANCE_PRODUCT,
  TOSS_EXCHANGE_PRODUCT,
} from "../data/countries";

export function ChecklistScreen() {
  const products = [ESIM_PRODUCT, INSURANCE_PRODUCT, TOSS_EXCHANGE_PRODUCT];

  return (
    <div>
      <Top
        title={<Top.TitleParagraph size={22}>여행 준비 체크리스트</Top.TitleParagraph>}
        subtitleBottom={
          <Top.SubtitleParagraph size={15}>
            빠뜨린 준비물, 출발 전에 확인하세요
          </Top.SubtitleParagraph>
        }
      />
      <CountrySelector />
      <Checklist />

      <div style={{ marginTop: 16 }}>
        <div
          style={{
            padding: "8px 24px 12px",
            fontSize: 17,
            fontWeight: 700,
            color: adaptive.grey800,
          }}
        >
          출발 전 한 번에 준비하기
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "0 24px",
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
