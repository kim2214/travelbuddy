// 현지 실용 정보: 시차/전원/수돗물, 긴급 전화(탭하면 전화 연결), 주의사항.

import { ListRow, TableRow } from "@toss/tds-mobile";
import { adaptive, colors } from "@toss/tds-colors";

import { getPracticalInfo } from "../data/countries";
import { useCountry } from "../context/CountryContext";
import { dial } from "../lib/links";

export function LocalInfo() {
  const { country } = useCountry();
  const info = getPracticalInfo(country.code);

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          padding: "16px 24px 8px",
          fontSize: 17,
          fontWeight: 700,
          color: adaptive.grey800,
        }}
      >
        🧭 {country.name} 현지 정보
      </div>

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
      <div style={{ marginTop: 8, padding: "8px 24px 0", fontSize: 14, color: adaptive.grey500 }}>
        긴급 연락처 · 탭하면 전화 연결
      </div>
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
      <div
        style={{
          margin: "8px 24px 0",
          padding: 16,
          borderRadius: 16,
          backgroundColor: colors.white,
          border: `1px solid ${adaptive.grey100}`,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: adaptive.grey800, marginBottom: 8 }}>
          ⚠️ 이런 점은 주의하세요
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: adaptive.grey600, fontSize: 14, lineHeight: 1.6 }}>
          {info.scams.map((scam, index) => (
            <li key={index}>{scam}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
