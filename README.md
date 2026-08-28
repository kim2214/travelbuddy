# 여행친구 (TravelBuddy)

토스 미니앱(앱인토스)으로 동작하는 여행 준비 도우미예요. 여행지를 고르면 환율·준비물·현지 정보를 한 번에 볼 수 있어요.

## 주요 기능

| 탭 | 내용 |
| --- | --- |
| 💱 환율 | 1초 환율 계산기, 빠른 금액 프리셋, 현지 물가 감각, 최근 30일 환율 추이, 팁 계산기, 면세 한도 계산기 |
| 🧳 준비물 | 국가별 준비물 체크리스트(커스텀 항목 추가), 출발일 D-day, eSIM·여행자보험·환전 안내 |
| 🧭 가이드 | 현지 날씨·7일 예보, 여행 회화(탭하면 복사), 현지 매너 팁, 실용 정보(전압·시차·긴급 연락처), 사이즈 변환표 |

- 여행지 17개국 지원, 공유 링크·현재 위치로 여행지 선택
- 체크리스트·출발일·면세 내역·선택 국가는 앱인토스 `Storage`에 저장되어 재진입 시 유지돼요
- 환율(open.er-api.com / currency-api), 날씨(Open-Meteo), 역지오코딩(BigDataCloud)은 무료·무키 API를 쓰고 캐시로 폴백해요

## 진입 스킴 (앱 내 기능 · 공유 링크)

`granite.config.ts`의 `appName`이 `travelbuddy`라서 스킴은 `intoss://travelbuddy`예요.

| 스킴 | 동작 |
| --- | --- |
| `intoss://travelbuddy` | 기본(환율 탭) |
| `intoss://travelbuddy?tab=exchange` | 환율 계산기 탭으로 열기 |
| `intoss://travelbuddy?tab=checklist` | 준비물 체크리스트 탭으로 열기 |
| `intoss://travelbuddy?tab=guide` | 현지 가이드 탭으로 열기 |
| `intoss://travelbuddy?country=JP` | 해당 여행지(ISO alpha-2)로 바로 열기 — 공유 링크에 사용 |

`tab`과 `country`는 함께 쓸 수 있어요. 콘솔의 **앱 내 기능**에는 `?tab=...` 스킴을 기능별로 등록하면 돼요.

## 개발

```bash
npm install
npm run dev        # granite dev (vite dev 서버 + 토스 샌드박스 연결)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest
```

## 배포

앱인토스 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키에서 발급받을 수 있어요.

```bash
npm run build
npm run deploy
```

## 출시 검토 체크 포인트

앱인토스 [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame.md)와 [UI/UX 가이드](https://developers-apps-in-toss.toss.im/design/consumer-ux-guide.md) 기준으로 지키고 있는 항목이에요.

- 하단 탭바는 토스 브랜딩 가이드의 **플로팅(캡슐) 형태** (`src/App.tsx`)
- 제스처 확대·축소 비활성화 (`index.html` viewport)
- 위치 권한은 진입 시 자동 요청하지 않고 **"현재 위치로 찾기"를 눌렀을 때만** 요청
- 진입 즉시 바텀시트 자동 오픈 없음, 외부 링크는 정보 확인 톤으로 안내 후 이동
- 렌더 에러 시 흰 화면 대신 다시 시도 화면 (`AppErrorBoundary`)

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
