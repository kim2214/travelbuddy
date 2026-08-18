// 환율 추이(최근 30일) 카드.
// 과거 샘플 6개 + 오늘 실시간 환율을 스파크라인으로 그리고,
// 오늘 환율이 30일 평균 대비 어느 수준인지 한 줄 신호로 알려줘요.
// 변동 폭이 작은 시계열이라 막대(0 기준선) 대신 라인으로 표현해요.

import { Skeleton, Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useEffect, type CSSProperties, type ReactNode } from "react";

import { logImpression } from "../lib/analytics";
import { formatAmount, rateDisplayUnitFor } from "../lib/exchangeRate";
import type { TrendPoint } from "../lib/rateTrend";
import { useCountry } from "../context/CountryContext";
import { useRateTrend } from "../hooks/useRateTrend";

// 평균 대비 이 비율(0.3%) 이상 차이날 때만 낮음/높음 신호를 줘요. 그 미만은 "비슷한 수준"이에요.
const SIGNAL_THRESHOLD = 0.003;

const CHART_HEIGHT = 56;

/** "YYYY-MM-DD" → "M/D" */
function shortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function Sparkline({ points, average }: { points: TrendPoint[]; average: number }) {
  const values = points.map((p) => p.krwPerUnit);
  let min = Math.min(...values, average);
  let max = Math.max(...values, average);
  if (min === max) {
    // 완전히 평탄하면 위아래 여유를 만들어 선이 중앙에 오게 해요.
    min -= 1;
    max += 1;
  }
  // 선이 위아래 가장자리에 붙지 않도록 도메인에 여유를 둬요.
  const pad = (max - min) * 0.18;
  min -= pad;
  max += pad;

  const x = (index: number) => (index / (points.length - 1)) * 100;
  const y = (value: number) => CHART_HEIGHT - ((value - min) / (max - min)) * CHART_HEIGHT;

  const path = values
    .map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)},${y(value).toFixed(2)}`)
    .join(" ");
  const lastY = y(values[values.length - 1]);
  const avgY = y(average);

  return (
    <div style={{ position: "relative" }}>
      {/* 수치는 아래 신호 문구가 텍스트로 전달하므로 차트는 장식으로 둬요. */}
      <svg
        width="100%"
        height={CHART_HEIGHT}
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ display: "block", overflow: "visible" }}
      >
        {/* 30일 평균 기준선 */}
        <line
          x1={0}
          x2={100}
          y1={avgY}
          y2={avgY}
          stroke={adaptive.grey300}
          strokeWidth={1}
          strokeDasharray="1.5 2"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
        <path
          d={path}
          fill="none"
          stroke={adaptive.blue500}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ vectorEffect: "non-scaling-stroke" }}
        />
      </svg>
      {/* 오늘 점. preserveAspectRatio="none"인 svg 안의 원은 찌그러져서 HTML로 얹어요.
          (세로는 viewBox와 실제 높이가 같아 y 좌표를 px로 그대로 써요) */}
      <span
        style={{
          position: "absolute",
          left: "100%",
          top: lastY,
          transform: "translate(-50%, -50%)",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: adaptive.blue500,
          boxShadow: `0 0 0 2px ${adaptive.grey50}`,
        }}
      />
    </div>
  );
}

export function RateTrend() {
  const { country } = useCountry();
  const unitAmount = rateDisplayUnitFor(country.currency);
  const { points, summary, loading } = useRateTrend(country.currency, unitAmount);

  const hasSummary = summary != null;
  useEffect(() => {
    if (hasSummary) {
      logImpression("rate_trend_view", { country: country.code });
    }
  }, [hasSummary, country.code]);

  const containerStyle: CSSProperties = {
    margin: "0 24px",
    padding: "18px 20px",
    borderRadius: 20,
    backgroundColor: adaptive.grey50,
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Skeleton custom={["card"]} />
      </div>
    );
  }

  // 점이 부족하면(과거 환율 실패 등) 부가 위젯이라 조용히 숨겨요.
  if (summary == null || points.length < 2) {
    return null;
  }

  const diffPctAbs = Math.abs(summary.diffRatio * 100).toFixed(1);
  const avgLabel = `${formatAmount(Math.round(summary.average), "KRW")}원`;

  let signal: ReactNode;
  if (summary.diffRatio <= -SIGNAL_THRESHOLD) {
    signal = (
      <Text typography="t7" color={adaptive.grey700}>
        지난 30일 평균({avgLabel})보다{" "}
        <Text typography="t7" fontWeight="bold" color={adaptive.blue500}>
          {diffPctAbs}% 낮아요
        </Text>
      </Text>
    );
  } else if (summary.diffRatio >= SIGNAL_THRESHOLD) {
    signal = (
      <Text typography="t7" color={adaptive.grey700}>
        지난 30일 평균({avgLabel})보다{" "}
        <Text typography="t7" fontWeight="bold" color={adaptive.red500}>
          {diffPctAbs}% 높아요
        </Text>
      </Text>
    );
  } else {
    signal = (
      <Text typography="t7" color={adaptive.grey700}>
        지난 30일 평균({avgLabel})과 비슷한 수준이에요
      </Text>
    );
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <Text typography="t7" fontWeight="semibold" color={adaptive.grey600}>
          환율 추이 · 최근 30일
        </Text>
        <Text typography="st12" color={adaptive.grey400}>
          {unitAmount.toLocaleString("ko-KR")}
          {country.currencySymbol} 기준
        </Text>
      </div>

      <Sparkline points={points} average={summary.average} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <Text typography="st12" color={adaptive.grey400}>
          {shortDate(points[0].date)}
        </Text>
        <Text typography="st12" color={adaptive.grey400}>
          오늘
        </Text>
      </div>

      <div style={{ marginTop: 10 }}>{signal}</div>
    </div>
  );
}
