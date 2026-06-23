// eSIM / 여행자보험 / 환전 연계 상품 카드.
// '구매하기'/'환전하러 가기' 클릭 시 안내 BottomSheet를 띄우고, openURL로 유도해요.
//
// NOTE(MVP): 실제 토스페이 결제(checkoutPayment)는 payToken 발급용 백엔드(mTLS)와
//   콘솔 가맹점 설정이 필요하므로 여기서는 유도 흐름만 구현해요.
//   실결제 연동 시 onConfirm 내부를 checkoutPayment({ payToken }) 호출로 교체하면 돼요.

import { Badge, Button, useBottomSheet } from "@toss/tds-mobile";
import { adaptive, colors } from "@toss/tds-colors";

import type { Product, ProductKind } from "../data/countries";
import { openExternal } from "../lib/links";

const KIND_META: Record<
  ProductKind,
  { emoji: string; badge: string; badgeColor: "blue" | "teal" | "green"; cta: string }
> = {
  esim: { emoji: "📶", badge: "eSIM", badgeColor: "blue", cta: "구매하기" },
  insurance: { emoji: "🛡️", badge: "여행자보험", badgeColor: "teal", cta: "구매하기" },
  exchange: { emoji: "💱", badge: "환전", badgeColor: "green", cta: "환전하러 가기" },
};

export function ProductCard({ product }: { product: Product }) {
  const meta = KIND_META[product.kind];
  const { openAsyncTwoButtonSheet } = useBottomSheet();

  const handleClick = () => {
    void openAsyncTwoButtonSheet({
      header: product.name,
      children: (
        <div style={{ margin: "0 24px 8px", color: adaptive.grey600, fontSize: 15 }}>
          {product.description}
          <div style={{ marginTop: 8, color: adaptive.grey800, fontWeight: 600 }}>
            {product.priceLabel}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: adaptive.grey400 }}>
            토스페이/환전 화면으로 이동해요.
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
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
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
        <div style={{ fontSize: 13, color: adaptive.grey500 }}>{product.priceLabel}</div>
      </div>

      <Button size="small" color="primary" variant="weak" onClick={handleClick}>
        {meta.cta}
      </Button>
    </div>
  );
}
