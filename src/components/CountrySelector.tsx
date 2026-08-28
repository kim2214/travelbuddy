// 여행지(국가) 선택 트리거(리스트 행). 체크리스트 화면 상단에서 사용해요.
// 실제 선택 UI는 공용 CountryPickerSheet가 담당해요.

import { ListRow } from "@toss/tds-mobile";
import { useState } from "react";

import { useCountry } from "../context/CountryContext";
import { CountryPickerSheet } from "./CountryPickerSheet";

export function CountrySelector() {
  const { country, detecting, needsCountryChoice } = useCountry();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ListRow
        onClick={() => setOpen(true)}
        withArrow
        left={
          <span style={{ fontSize: 28, lineHeight: "32px" }}>{country.flag}</span>
        }
        contents={
          <ListRow.Texts
            type="2RowTypeB"
            top={
              detecting
                ? "📍 현재 위치로 찾는 중…"
                : needsCountryChoice
                  ? "👉 여행지를 골라주세요"
                  : "여행지"
            }
            bottom={`${country.name} · ${country.currencyName}(${country.currency})`}
          />
        }
      />
      <CountryPickerSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
