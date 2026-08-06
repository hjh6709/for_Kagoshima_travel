# Map Planner iOS 리디자인 — 로드맵

날짜: 2026-07-24
근거 자료: `~/Downloads/design_handoff_map_planner_ios/`(`README.md`, `CLAUDE_CODE_PROMPT.md`, `tokens.css`,
`theme-ios.css`, `Map Planner iOS.dc.html` 프로토타입)

## 확인된 사실

- 핸드오프 문서가 가정하는 파일 경로가 현재 레포 구조와 **정확히 일치**한다
  (`apps/web/src/styles/tokens.css` 존재, `features/trip/components/{sections,cards,tabs,helpers}` 폴더 구조 일치).
- `theme-ios.css`가 대상으로 하는 클래스(`.app-shell`, `.phone-frame`, `.screen`, `.list-card`, `.check-row`,
  `.date-tabs`, `.flight-journey-card`, `.bottom-tabs` 등 43개)는 전부 현재 `apps/web/src/styles/*.css`에
  실제로 존재한다 — grep으로 확인함.
- 정보 구조(5탭 + 마이페이지 + `/manage` 목록 + `/manage/trips/:id/edit` 허브/섹션), 라우팅, 훅
  (`useTripManageController`, `tripViewState`), API 계약은 이번 리디자인에서 **바꾸지 않는다**.
- 아이콘은 기존 `lucide-react`만 쓴다(신규 의존성 금지). 다크모드 지원 대상 아님(`color-scheme: light` 유지).
- `apps/web`에 `*.test.tsx` 테스트가 이미 존재한다(`TripManagePage.test.tsx`,
  `ManageLandingSections.test.tsx`, `MyPageTab.test.tsx`, `ScheduleCard.test.tsx`,
  `NextScheduleCard.test.tsx`, `ChecklistSection.test.tsx` 등). 카피를 바꾸는 화면은 테스트 문구도 같이 고쳐야 한다.

## 단계 구성 (CLAUDE_CODE_PROMPT.md 순서 그대로 채택)

각 단계는 별도 브랜치 + PR로 나눈다. 단계 안에서도 화면 단위로 커밋을 쪼갠다.

| 단계 | 내용 | 마크업 변경 | 상세 플랜 상태 |
| --- | --- | --- | --- |
| 1 | 토큰 교체 + `theme-ios.css` 리스킨 레이어 | 없음 | **완료** → `docs/superpowers/plans/2026-07-24-ios-redesign-stage1-tokens-theme.md` |
| 2 | 오늘 탭 (`TodayTab`/`TodayHeaderSection`/`NextScheduleCard`/`HomeChecklistSection`) | 있음 | 로드맵만, 실행 직전 작성 |
| 3 | 일정 탭 (`ScheduleTab`/`ScheduleCard`/`ChecklistSection`) | 있음 | 로드맵만, 실행 직전 작성 |
| 4 | 항공 탭 + 지도 탭 + 신규 `PlaceDetailSheet` 공용 시트 | 있음(+신규 컴포넌트 1개) | 로드맵만, 실행 직전 작성 |
| 5 | 긴급 탭 + 하단 탭바 | 있음 | 로드맵만, 실행 직전 작성 |
| 6 | 마이페이지 + 여행 목록(`TripManagePage`) + 편집 허브(`TripEditHubPage`) | 있음 | 로드맵만, 실행 직전 작성 |

**왜 전부 지금 상세 플랜으로 안 쓰는가:** `writing-plans`는 매 단계가 실제 코드를 근거로 한 완전한 스텝(플레이스홀더
없이, 실제 prop 이름·시그니처 포함)을 요구한다. 2~6단계 각각 4~6개 컴포넌트를 다루고, 이미 이번 세션에서
2단계 컴포넌트 5개를 읽어본 결과만으로도 스펙과 실제 코드 사이에 무시 못 할 간극(아래 "열린 질문" 참고)이
나왔다. 나머지 단계도 같은 수준으로 실제 코드를 먼저 읽고 간극을 확인해야 플랜이 정확해진다 — 지금 한 번에
다 읽고 쓰면 이 세션 하나로 감당이 안 되고, 품질도 떨어진다. 1단계는 CSS 전용이라 컴포넌트 코드를 읽지
않고도 완전한 플랜을 쓸 수 있어서 지금 끝냈다.

## 2단계(오늘 탭)에서 이미 드러난 열린 질문 — 다음 세션에 확인

1. **스탯 3칸(날씨 · 환율 · 오늘 이동 거리)**: README 스펙엔 있지만 현재 코드베이스에 날씨 API 연동이나
   "오늘 예정 거리" 계산 로직이 전혀 없다. 목업 고정값으로 넣을지, 이 스탯 카드 자체를 빼거나 다른 걸로
   대체할지 결정 필요.
2. **Next hero 카드의 "완료" 버튼**: 스펙은 "길찾기 + 완료 버튼 2개"라고 하는데, 현재 `NextScheduleCard`엔
   완료 토글이 없다(완료 토글은 `ScheduleCard`/일정 탭에만 있음). 오늘 탭에서 일정을 바로 완료 처리할 수
   있게 기능을 추가할지, 스펙을 "길찾기만"으로 조정할지 결정 필요.
3. **테스트 파일 존재**: `NextScheduleCard.test.tsx`가 이미 있다 — 구조를 바꿀 때 이 테스트가 무엇을
   검증하는지 먼저 읽고 카피/구조 변경에 맞춰 함께 고쳐야 한다(핸드오프 문서도 이 점을 명시).

## 실행 순서

1. 1단계(토큰+리스킨) 브랜치 파서 실행 → PR.
2. 머지 확인 후, 2단계 착수 직전에 `TodayTab.test.tsx`/`NextScheduleCard.test.tsx` 등 관련 테스트를 먼저
   읽고, 위 열린 질문을 사용자와 확정한 뒤 2단계 상세 플랜 작성 → 실행.
3. 이하 3~6단계도 동일 패턴(직전 코드 확인 → 플랜 작성 → 실행 → PR) 반복.
