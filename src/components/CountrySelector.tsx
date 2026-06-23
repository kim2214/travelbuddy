// 여행지(국가) 선택 트리거 + BottomSheet 선택지.
// 환율/체크리스트 두 화면 상단에서 공통으로 사용해요.

import { BottomSheet, ListRow } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useState } from "react";

import { COUNTRIES } from "../data/countries";
import { useCountry } from "../context/CountryContext";

export function CountrySelector() {
  const { country, countryCode, setCountryCode, detecting } = useCountry();
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
            top={detecting ? "📍 현재 위치로 찾는 중…" : "여행지"}
            bottom={`${country.name} · ${country.currencyName}(${country.currency})`}
          />
        }
      />

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        header={<BottomSheet.Header>여행지를 선택해요</BottomSheet.Header>}
      >
        <BottomSheet.Select
          value={countryCode}
          options={COUNTRIES.map((c) => ({
            name: `${c.flag}  ${c.name} · ${c.currencyName}(${c.currency})`,
            value: c.code,
          }))}
          onChange={(event) => {
            setCountryCode(event.target.value);
            setOpen(false);
          }}
        />
        <div style={{ height: 12, color: adaptive.greyBackground }} />
      </BottomSheet>
    </>
  );
}
