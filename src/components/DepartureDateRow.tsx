// 출발일 설정 행. 탭하면 OS 네이티브 날짜 피커가 열리고, 설정하면 D-day를 보여줘요.
// 투명한 <input type="date">를 행 위에 겹쳐 어느 플랫폼에서든 네이티브 피커가 뜨게 해요.
// (showPicker()는 일부 WebView에서 지원되지 않아 오버레이 방식을 써요)

import { Button, ListRow, Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import type { ReactElement } from "react";

import { logEvent } from "../lib/analytics";
import { daysUntil, formatDepartureDate, todayDateString } from "../lib/departureDate";
import { useCountry } from "../context/CountryContext";
import { useDepartureDate } from "../hooks/useDepartureDate";

export function DepartureDateRow() {
  const { country } = useCountry();
  const { date, dday, loading, setDate, clear } = useDepartureDate(country.code);

  const handleChange = (value: string) => {
    if (value === "") {
      // 피커에서 '지우기'를 누른 경우예요.
      clear();
      logEvent("departure_clear", { country: country.code });
      return;
    }
    setDate(value);
    logEvent("departure_set", { country: country.code, dday: daysUntil(value) ?? -999 });
  };

  let top: ReactElement | string = "출발일";
  let bottom = loading ? " " : "설정하면 디데이를 알려드려요";
  if (date != null && dday != null) {
    if (dday > 0) {
      top = (
        <Text typography="t6" fontWeight="bold" color={adaptive.blue500}>
          출발까지 D-{dday}
        </Text>
      );
      bottom = `${formatDepartureDate(date)} 출발`;
    } else if (dday === 0) {
      top = (
        <Text typography="t6" fontWeight="bold" color={adaptive.blue500}>
          오늘 출발이에요!
        </Text>
      );
      bottom = formatDepartureDate(date);
    } else {
      top = "지난 출발일이에요";
      bottom = `${formatDepartureDate(date)} · 탭해서 다시 설정해요`;
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <ListRow
        left={<span style={{ fontSize: 28, lineHeight: "32px" }}>✈️</span>}
        contents={<ListRow.Texts type="2RowTypeB" top={top} bottom={bottom} />}
        withArrow={date == null}
        right={
          date != null ? (
            // 날짜 입력 오버레이보다 위에 둬야 버튼이 눌려요.
            <span style={{ position: "relative", zIndex: 2 }}>
              <Button
                size="small"
                variant="weak"
                color="dark"
                onClick={() => {
                  clear();
                  logEvent("departure_clear", { country: country.code });
                }}
              >
                지우기
              </Button>
            </span>
          ) : undefined
        }
      />
      {/* 행 전체를 덮는 투명 날짜 입력. 탭하면 네이티브 피커가 열려요. */}
      <input
        type="date"
        aria-label="출발일 선택"
        value={date ?? ""}
        min={todayDateString()}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          border: "none",
          padding: 0,
          zIndex: 1,
          cursor: "pointer",
        }}
      />
    </div>
  );
}
