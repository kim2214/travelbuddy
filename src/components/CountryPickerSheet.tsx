// 여행지(국가) 선택 BottomSheet. 트리거(리스트 행/히어로 카드)와 분리해 공용으로 써요.
// 위치 권한은 사용자가 "현재 위치로 찾기"를 눌렀을 때만 요청해요.

import { BottomSheet, Button, useToast } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";

import { COUNTRIES, getCountry } from "../data/countries";
import { useCountry } from "../context/CountryContext";
import { logEvent } from "../lib/analytics";

interface CountryPickerSheetProps {
  open: boolean;
  onClose: () => void;
}

export function CountryPickerSheet({ open, onClose }: CountryPickerSheetProps) {
  const { countryCode, setCountryCode, detectByLocation, detecting } = useCountry();
  const toast = useToast();

  const handleDetect = async () => {
    logEvent("country_detect_click");
    const detected = await detectByLocation();
    if (detected != null) {
      logEvent("country_change", { country: detected, source: "location" });
      toast.openToast(`📍 현재 위치 ${getCountry(detected).name} · 여행지를 바꿨어요`);
      onClose();
      return;
    }
    toast.openToast("현재 위치의 여행지를 찾지 못했어요. 직접 선택해 주세요");
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={<BottomSheet.Header>여행지를 선택해요</BottomSheet.Header>}
    >
      <div style={{ padding: "0 24px 12px" }}>
        <Button
          display="full"
          size="medium"
          color="dark"
          variant="weak"
          loading={detecting}
          onClick={() => void handleDetect()}
        >
          📍 현재 위치로 찾기
        </Button>
      </div>
      <BottomSheet.Select
        value={countryCode}
        options={COUNTRIES.map((c) => ({
          name: `${c.flag}  ${c.name} · ${c.currencyName}(${c.currency})`,
          value: c.code,
        }))}
        onChange={(event) => {
          logEvent("country_change", { country: event.target.value, source: "manual" });
          setCountryCode(event.target.value);
          onClose();
        }}
      />
      <div style={{ height: 12, backgroundColor: adaptive.greyBackground }} />
    </BottomSheet>
  );
}
