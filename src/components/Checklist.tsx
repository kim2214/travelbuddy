// 국가별 준비물 체크리스트.
// 프리셋 + 사용자 커스텀 항목을 체크/추가/삭제하고, 진행률을 보여줘요. 상태는 Storage에 영속돼요.

import { Button, Checkbox, ListRow, ProgressBar, TextField } from "@toss/tds-mobile";
import { adaptive, colors } from "@toss/tds-colors";
import { useState } from "react";

import { useCountry } from "../context/CountryContext";
import { useChecklist } from "../hooks/useChecklist";

export function Checklist() {
  const { country } = useCountry();
  const { rows, checkedCount, totalCount, progress, toggle, addCustom, removeCustom } =
    useChecklist(country.code);
  const [newItem, setNewItem] = useState("");

  const handleAdd = () => {
    addCustom(newItem);
    setNewItem("");
  };

  return (
    <div>
      {/* 진행률 헤더 */}
      <div style={{ padding: "8px 24px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 700, color: adaptive.grey800 }}>
            {country.flag} {country.name} 준비물
          </span>
          <span style={{ fontSize: 14, color: adaptive.grey500 }}>
            {checkedCount}/{totalCount}
          </span>
        </div>
        <ProgressBar progress={progress} size="normal" animate />
      </div>

      {/* 항목 리스트 */}
      <div>
        {rows.map((row) => (
          <ListRow
            key={row.id}
            onClick={() => toggle(row.id)}
            withTouchEffect
            left={
              <Checkbox.Circle
                checked={row.checked}
                onCheckedChange={() => toggle(row.id)}
                aria-label={row.label}
              />
            }
            contents={
              row.hint ? (
                <ListRow.Texts type="2RowTypeB" top={row.label} bottom={row.hint} />
              ) : (
                <ListRow.Texts type="1RowTypeA" top={row.label} />
              )
            }
            right={
              row.custom ? (
                <Button
                  size="small"
                  variant="weak"
                  color="dark"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustom(row.id);
                  }}
                >
                  삭제
                </Button>
              ) : undefined
            }
          />
        ))}
      </div>

      {/* 커스텀 항목 추가 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
          padding: "16px 24px 8px",
          backgroundColor: colors.white,
        }}
      >
        <div style={{ flex: 1 }}>
          <TextField
            variant="line"
            label="직접 추가"
            labelOption="appear"
            placeholder="예) 보조 배터리"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
        </div>
        <Button size="small" color="primary" onClick={handleAdd} disabled={newItem.trim() === ""}>
          추가
        </Button>
      </div>
    </div>
  );
}
