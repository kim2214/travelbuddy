// eSIM / 여행자보험 / 환전 연계 상품 카드.
// 카드 클릭 → 안내 BottomSheet → 종류별 안내 문구 + CTA로 외부 서비스(openExternal)로 이동해요.
// CTA는 eSIM·보험은 '확인하기'(외부 비교/정보), 환전은 '환전하러 가기'예요.

import { Badge, Button, useBottomSheet } from "@toss/tds-mobile";
import { adaptive, colors } from "@toss/tds-colors";

import type { Product, ProductKind } from "../data/countries";
import { openExternal } from "../lib/links";

const KIND_META: Record<
  ProductKind,
  {
    emoji: string;
    badge: string;
    badgeColor: "blue" | "teal" | "green";
    cta: string;
    /** 안내 BottomSheet 하단에 표시할 이동 안내 문구 */
    guide: string;
  }
> = {
  esim: {
    emoji: "📶",
    badge: "eSIM",
    badgeColor: "blue",
    cta: "확인하기",
    guide: "여행 eSIM 비교 사이트(로밍도깨비)로 이동합니다.",
  },
  insurance: {
    emoji: "🛡️",
    badge: "여행자보험",
    badgeColor: "teal",
    cta: "확인하기",
    guide: "보험 비교 사이트(투어모즈)로 이동합니다.",
  },
  exchange: {
    emoji: "💱",
    badge: "환전",
    badgeColor: "green",
    cta: "환전하러 가기",
    guide: "토스뱅크 외화통장(환전) 화면으로 이동합니다.",
  },
};

export function ProductCard({ product }: { product: Product }) {
  const meta = KIND_META[product.kind];
  const { openAsyncTwoButtonSheet } = useBottomSheet();

  const handleClick = () => {
    void openAsyncTwoButtonSheet({
      header: product.name,
      children: (
        <div
          style={{
            margin: "0 24px 8px",
            color: adaptive.grey600,
            fontSize: 15,
          }}
        >
          {product.description}
          <div
            style={{ marginTop: 8, color: adaptive.grey800, fontWeight: 600 }}
          >
            {product.priceLabel}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: adaptive.grey400 }}>
            {meta.guide}
          </div>
        </div>
      ),
      leftButton: "닫기",
      rightButton: meta.cta,
      onRightButtonClick: () => openExternal(product.deeplink),
    });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.white,
        border: `1px solid ${adaptive.grey100}`,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: adaptive.grey50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        {meta.emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 2,
          }}
        >
          <Badge size="xsmall" variant="weak" color={meta.badgeColor}>
            {meta.badge}
          </Badge>
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: adaptive.grey800,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {product.name}
        </div>
        <div style={{ fontSize: 13, color: adaptive.grey500 }}>
          {product.priceLabel}
        </div>
      </div>

      <Button size="small" color="primary" variant="weak" onClick={handleClick}>
        {meta.cta}
      </Button>
    </div>
  );
}
