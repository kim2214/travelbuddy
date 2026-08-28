// 하단 탭 식별자. App(탭바)과 진입 스킴 파서(entry)가 공유해요.

export const TAB_KEYS = ["exchange", "checklist", "guide"] as const;

export type TabKey = (typeof TAB_KEYS)[number];

export const DEFAULT_TAB: TabKey = "exchange";

export function isTabKey(value: string): value is TabKey {
  return (TAB_KEYS as readonly string[]).includes(value);
}
