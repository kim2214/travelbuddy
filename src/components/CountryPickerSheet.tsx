// 여행지(국가) 선택 BottomSheet. 트리거(리스트 행/히어로 카드)와 분리해 공용으로 써요.

import { BottomSheet } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";

import { COUNTRIES } from "../data/countries";
import { useCountry } from "../context/CountryContext";
import { logEvent } from "../lib/analytics";

interface CountryPickerSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CountryPickerSheet({ open, onClose }: CountryPickerSheetProps) {
  const { countryCode, setCountryCode } = useCountry();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={<BottomSheet.Header>여행지를 선택해요</BottomSheet.Header>}
    >
      <BottomSheet.Select
        value={countryCode}
        options={COUNTRIES.map((c) => ({
          name: `${c.flag}  ${c.name} · ${c.currencyName}(${c.currency})`,
          value: c.code,
        }))}
        onChange={(event) => {
          logEvent("country_change", { country: event.target.value });
          setCountryCode(event.target.value);
          onClose();
        }}
      />
      <div style={{ height: 12, backgroundColor: adaptive.greyBackground }} />
    </BottomSheet>
  );
}
