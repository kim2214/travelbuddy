// 현지 매너/주의 팁을 아코디언(BoardRow)으로 보여줘요.

import { BoardRow } from "@toss/tds-mobile";

import { useCountry } from "../context/CountryContext";
import { SectionHeader } from "./SectionHeader";

export function MannerTips() {
  const { country } = useCountry();

  return (
    <div style={{ marginTop: 8 }}>
      <SectionHeader>
        {country.flag} {country.name} 현지 매너 팁
      </SectionHeader>
      <div style={{ padding: "0 12px" }}>
        {country.mannerTips.map((tip, index) => (
          <BoardRow
            key={`${country.code}-${index}`}
            initialOpened={index === 0}
            title={tip.title}
            prefix={<BoardRow.Prefix>{index + 1}</BoardRow.Prefix>}
            icon={<BoardRow.ArrowIcon />}
          >
            <BoardRow.Text>{tip.description}</BoardRow.Text>
          </BoardRow>
        ))}
      </div>
    </div>
  );
}
