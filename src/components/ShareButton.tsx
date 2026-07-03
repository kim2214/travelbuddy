// 상단(Top)의 오른쪽에 놓는 공유 버튼. 현재 여행지 이름을 담아 공유해요.

import { Top } from "@toss/tds-mobile";

import { useCountry } from "../context/CountryContext";
import { logEvent } from "../lib/analytics";
import { shareTravelBuddy } from "../lib/share";

export function ShareButton() {
  const { country } = useCountry();

  return (
    <Top.RightButton
      color="dark"
      variant="weak"
      onClick={() => {
        logEvent("share_click", { country: country.code });
        void shareTravelBuddy(country.name);
      }}
    >
      공유
    </Top.RightButton>
  );
}
