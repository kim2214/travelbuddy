import { Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useState, type ComponentType } from "react";

import { useCountry } from "./context/CountryContext";
import { TabActiveContext } from "./context/tabActiveContext";
import { logEvent } from "./lib/analytics";
import { getTabFromEntry } from "./lib/entry";
import { DEFAULT_TAB, type TabKey } from "./lib/tabs";

import { ChecklistScreen } from "./screens/ChecklistScreen";
import { ExchangeScreen } from "./screens/ExchangeScreen";
import { GuideScreen } from "./screens/GuideScreen";
import "./App.css";

const TABS: { key: TabKey; label: string; emoji: string; Screen: ComponentType }[] = [
  { key: "exchange", label: "환율", emoji: "💱", Screen: ExchangeScreen },
  { key: "checklist", label: "준비물", emoji: "🧳", Screen: ChecklistScreen },
  { key: "guide", label: "가이드", emoji: "🧭", Screen: GuideScreen },
];

const TAB_BAR_HEIGHT = 60;
// 플로팅 탭바가 화면 하단에서 떨어져 있는 간격 (앱인토스 브랜딩 가이드의 플로팅 형태)
const TAB_BAR_BOTTOM_GAP = 16;

function App() {
  // 저장된 여행지 조회가 끝난 뒤에 화면을 그려요. (기본 국가로 그렸다가 바뀌는 깜빡임 방지)
  const { ready } = useCountry();
  // 콘솔 '앱 내 기능' 스킴(?tab=...)으로 진입했다면 그 탭으로 바로 열어요.
  const [tab, setTab] = useState<TabKey>(() => getTabFromEntry() ?? DEFAULT_TAB);
  // 한 번이라도 연 탭은 언마운트하지 않고 숨기기만 해요. 탭을 오가도 입력 중인 금액 같은
  // 화면 상태가 유지되고, 날씨·환율 추이를 다시 불러오느라 스켈레톤이 깜빡이지 않아요.
  // 아직 열지 않은 탭은 마운트하지 않아 진입 시 불필요한 요청·노출 로그가 생기지 않아요.
  const [visited, setVisited] = useState<ReadonlySet<TabKey>>(() => new Set([tab]));

  const selectTab = (next: TabKey) => {
    setTab(next);
    setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: adaptive.background }}>
      {/* 탭 컨텐츠 (상단 노치/상태바 + 하단 플로팅 탭바 높이 + safe area만큼 여백 확보) */}
      <div
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: `calc(${TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP * 2}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {TABS.map(
          (t) =>
            ready &&
            visited.has(t.key) && (
              <div key={t.key} hidden={tab !== t.key}>
                {/* 숨겨진 탭의 컴포넌트가 노출 로그를 남기지 않도록 보이는 탭인지 알려줘요. */}
                <TabActiveContext.Provider value={tab === t.key}>
                  <t.Screen />
                </TabActiveContext.Provider>
              </div>
            ),
        )}
      </div>

      {/* 하단 플로팅 탭바: 토스 탭바 브랜딩 가이드에 따라 화면 가장자리에서 띄운 캡슐 형태로 표시해요. */}
      <nav
        style={{
          position: "fixed",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: `calc(${TAB_BAR_BOTTOM_GAP}px + env(safe-area-inset-bottom, 0px))`,
          display: "flex",
          height: TAB_BAR_HEIGHT,
          padding: "0 8px",
          backgroundColor: adaptive.floatBackground,
          border: `1px solid ${adaptive.greyOpacity50}`,
          borderRadius: TAB_BAR_HEIGHT / 2,
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)",
          zIndex: 10,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className="tab-bar-item"
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              // 탭 시 포커스를 받지 않게 해 WebView 네이티브 포커스 하이라이트(노란 선)를 막아요.
              // onClick은 그대로 실행돼요.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (t.key === tab) {
                  return;
                }
                selectTab(t.key);
                // 이전 탭에서 스크롤한 위치가 새 탭에 남지 않게 최상단으로 이동해요.
                window.scrollTo(0, 0);
                logEvent("tab_change", { tab: t.key });
              }}
              style={{
                width: 76,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                borderRadius: TAB_BAR_HEIGHT / 2,
                color: active ? adaptive.blue500 : adaptive.grey400,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: "24px" }}>{t.emoji}</span>
              <Text
                typography="st13"
                fontWeight={active ? "bold" : "medium"}
                color={active ? adaptive.blue500 : adaptive.grey400}
              >
                {t.label}
              </Text>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
