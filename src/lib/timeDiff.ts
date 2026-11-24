// 한국과의 시차를 지금 시각 기준으로 계산해요.
//
// 서머타임이 있는 나라는 시기에 따라 시차가 한 시간씩 달라져서 고정 문구로는
// "7~8시간"처럼 범위로만 안내할 수 있어요. 대표 도시의 IANA 시간대로 현재 시차를
// 계산해 정확한 값을 보여줘요. 한국은 서머타임이 없어 UTC+9로 고정이에요.

const KOREA_OFFSET_MINUTES = 9 * 60;

/** 해당 시간대가 그 시각에 UTC보다 몇 분 앞서는지 구해요. 시간대를 해석할 수 없으면 null이에요. */
function utcOffsetMinutes(timeZone: string, at: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(at);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value);
    // 그 시간대의 벽시계 시각을 UTC로 읽은 값과 실제 시각의 차이가 오프셋이에요.
    const wallClockAsUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    );
    const diff = Math.round((wallClockAsUtc - at.getTime()) / 60000);
    return Number.isFinite(diff) ? diff : null;
  } catch {
    // 시간대 이름을 지원하지 않는 환경
    return null;
  }
}

/** 현지가 한국보다 몇 분 앞서는지(음수면 느림) 구해요. 계산할 수 없으면 null이에요. */
export function minutesAheadOfKorea(timeZone: string, at: Date = new Date()): number | null {
  const offset = utcOffsetMinutes(timeZone, at);
  return offset == null ? null : offset - KOREA_OFFSET_MINUTES;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) {
    return `${m}분`;
  }
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

export interface TimeDiffText {
  /** 현지 정보용 문장 (예: "한국보다 2시간 느려요") */
  long: string;
  /** 히어로 카드용 짧은 표기 (예: "−2시간") */
  short: string;
}

/**
 * 시차 안내 문구를 만들어요.
 * @param label 시간대가 여러 개인 나라에서 기준으로 삼은 도시 이름 (예: "LA")
 */
export function formatTimeDiff(minutesAhead: number, label?: string): TimeDiffText {
  const prefix = label ? `${label} 기준 ` : "";
  if (minutesAhead === 0) {
    return { long: `${prefix}한국과 시차가 없어요`, short: "없음" };
  }
  const duration = formatDuration(Math.abs(minutesAhead));
  return minutesAhead > 0
    ? { long: `${prefix}한국보다 ${duration} 빨라요`, short: `+${duration}` }
    : { long: `${prefix}한국보다 ${duration} 느려요`, short: `−${duration}` };
}

/**
 * 지금 시각 기준 시차 문구를 돌려줘요. 시간대를 계산할 수 없는 환경에서는
 * 미리 적어 둔 고정 문구(fallback)를 그대로 써요.
 */
export function currentTimeDiff(
  source: { timeZone: string; timeZoneLabel?: string },
  fallback: TimeDiffText,
  at: Date = new Date(),
): TimeDiffText {
  const minutes = minutesAheadOfKorea(source.timeZone, at);
  return minutes == null ? fallback : formatTimeDiff(minutes, source.timeZoneLabel);
}
