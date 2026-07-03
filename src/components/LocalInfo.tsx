// 현지 실용 정보: 시차/전원/수돗물, 긴급 전화(탭하면 전화 연결), 주의사항.

import { ListRow, TableRow, Text } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";

import { getPracticalInfo } from "../data/countries";
import { useCountry } from "../context/CountryContext";
import { dial } from "../lib/links";
import { cardSurface } from "../lib/styles";
import { SectionHeader } from "./SectionHeader";

export function LocalInfo() {
  const { country } = useCountry();
  const info = getPracticalInfo(country.code);

  return (
    <div style={{ marginTop: 16 }}>
      <SectionHeader>🧭 {country.name} 현지 정보</SectionHeader>

      {/* 기본 정보 */}
      <div
        style={{
          margin: "0 24px",
          padding: "4px 16px",
          borderRadius: 16,
          backgroundColor: adaptive.grey50,
        }}
      >
        <TableRow align="space-between" left="시차" right={info.timeDiff} />
        <TableRow align="space-between" left="전원" right={info.plug} />
        <TableRow align="space-between" left="수돗물" right={info.tapWater} />
      </div>

      {/* 긴급 연락처 (탭하면 전화 연결) */}
      <Text
        typography="st11"
        color={adaptive.grey500}
        style={{ display: "block", marginTop: 8, padding: "8px 24px 0" }}
      >
        긴급 연락처 · 탭하면 전화 연결
      </Text>
      <div>
        {[...info.emergency, info.embassy].map((contact) => (
          <ListRow
            key={`${contact.label}-${contact.number}`}
            onClick={() => void dial(contact.number)}
            withArrow
            contents={
              <ListRow.Texts
                type="2RowTypeB"
                top={contact.label}
                bottom={`📞 ${contact.number}`}
              />
            }
          />
        ))}
      </div>

      {/* 주의사항 */}
      <div style={{ ...cardSurface, margin: "8px 24px 0", padding: 16 }}>
        <Text
          typography="st11"
          fontWeight="bold"
          color={adaptive.grey800}
          style={{ display: "block", marginBottom: 8 }}
        >
          ⚠️ 이런 점은 주의하세요
        </Text>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {info.scams.map((scam) => (
            <Text
              as="li"
              key={scam}
              typography="st11"
              color={adaptive.grey600}
              style={{ marginBottom: 4 }}
            >
              {scam}
            </Text>
          ))}
        </ul>
      </div>
    </div>
  );
}
