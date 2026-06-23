import { adaptive, colors } from "@toss/tds-colors";
import { useState } from "react";

import { ChecklistScreen } from "./screens/ChecklistScreen";
import { ExchangeScreen } from "./screens/ExchangeScreen";
import "./App.css";

type TabKey = "exchange" | "checklist";

const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "exchange", label: "환율", emoji: "💱" },
  { key: "checklist", label: "체크리스트", emoji: "🧳" },
];

const TAB_BAR_HEIGHT = 64;

function App() {
  const [tab, setTab] = useState<TabKey>("exchange");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.white }}>
      {/* 탭 컨텐츠 (하단 탭바 높이 + safe area만큼 여백 확보) */}
      <div
        style={{
          paddingBottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        {tab === "exchange" ? <ExchangeScreen /> : <ChecklistScreen />}
      </div>

      {/* 하단 탭바 */}
      <nav
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          height: TAB_BAR_HEIGHT,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          backgroundColor: colors.white,
          borderTop: `1px solid ${adaptive.grey100}`,
          zIndex: 10,
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-label={t.label}
              aria-current={active ? "page" : undefined}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                color: active ? adaptive.blue500 : adaptive.grey400,
              }}
            >
              <span style={{ fontSize: 22, lineHeight: "24px" }}>{t.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default App;
