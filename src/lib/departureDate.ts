// 여행 출발일(국가별)을 Storage에 영속화하고 D-day를 계산해요.
// 날짜는 date input과 호환되는 YYYY-MM-DD 문자열로 다뤄요.

import { Storage } from "@apps-in-toss/web-framework";

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function keyFor(countryCode: string): string {
  return `departure_${countryCode}_v1`;
}

/** YYYY-MM-DD를 로컬 자정 Date로 파싱해요. 형식이 어긋나거나 없는 날짜면 null이에요. */
export function parseDateString(date: string): Date | null {
  if (!DATE_PATTERN.test(date)) {
    return null;
  }
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  // "2025-02-31"처럼 형식만 맞고 존재하지 않는 날짜를 걸러요(월이 넘어가면 다른 날짜가 돼요).
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

/**
 * 오늘(로컬 자정) 기준 출발일까지 남은 일수.
 * 오늘 출발이면 0, 지났으면 음수, 잘못된 날짜면 null이에요.
 */
export function daysUntil(date: string, now: number = Date.now()): number | null {
  const target = parseDateString(date);
  if (target == null) {
    return null;
  }
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  // 서머타임 등으로 하루가 정확히 24시간이 아닐 수 있어 반올림해요.
  return Math.round((target.getTime() - today.getTime()) / DAY_MS);
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** "8월 23일 (토)" 형태로 표시해요. 잘못된 날짜면 원문을 그대로 돌려줘요. */
export function formatDepartureDate(date: string): string {
  const parsed = parseDateString(date);
  if (parsed == null) {
    return date;
  }
  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 (${WEEKDAYS[parsed.getDay()]})`;
}

/** 오늘 날짜를 date input의 min 속성에 쓰는 YYYY-MM-DD로 돌려줘요. */
export function todayDateString(now: number = Date.now()): string {
  const d = new Date(now);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export async function loadDepartureDate(countryCode: string): Promise<string | null> {
  try {
    const raw = await Storage.getItem(keyFor(countryCode));
    if (raw == null || parseDateString(raw) == null) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

export async function saveDepartureDate(countryCode: string, date: string): Promise<void> {
  try {
    await Storage.setItem(keyFor(countryCode), date);
  } catch {
    // 저장 실패는 무시 (다음 변경 시 재시도)
  }
}

export async function clearDepartureDate(countryCode: string): Promise<void> {
  try {
    await Storage.removeItem(keyFor(countryCode));
  } catch {
    // 삭제 실패는 무시
  }
}
