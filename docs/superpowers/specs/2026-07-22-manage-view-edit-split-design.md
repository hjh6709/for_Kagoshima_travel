# 여행 관리 화면 개편: 보기/편집 분리 설계

날짜: 2026-07-22
작성 배경: 현재 `/manage`에서 "관리하기"를 누르면 기본정보 편집, 장소/항공/일정 생성 폼, 체크리스트,
공유 링크, 여행 목록, 새 여행 생성 폼이 한 페이지에 전부 세로로 나열되어 사용자가 혼란스러워함.
`/demo`의 탭형 UI(오늘/전체 일정/항공/지도/긴급/마이페이지)는 보기 좋지만 정적 샘플 데이터에만
연결되어 있고 실제 소유자 여행 데이터와는 연결되어 있지 않음.

## 목표

- "여행 관리" = 목록/생성만 하는 허브로 축소.
- 목록에서 여행을 고르면 `/demo`와 같은 스타일의 **보기 화면**(실제 데이터)으로 진입.
- 보기 화면에서는 편집하지 않고, 편집이 필요하면 **편집 허브**로 이동해 카테고리별
  **개별 편집 페이지**에서 하나씩 처리.
- 기존 CRUD 폼/리스트 컴포넌트(장소/항공/일정/체크리스트/공유/기본정보)는 재사용하고
  배치만 재구성한다. 새로 작성하는 것은 "보기 화면"과 "편집 허브" 뿐이다.

## 라우트 구조

```
/manage                          여행 목록 + 새 여행 만들기 (TripListSection + TripCreateSection만)
/manage/trips/:id                보기 화면 (탭형 UI, 실제 데이터)
/manage/trips/:id/edit           편집 허브 (카테고리 카드 목록)
/manage/trips/:id/edit/basic     기본정보 편집 (TripBasicInfoForm)
/manage/trips/:id/edit/places    장소 관리 (ManagePlaceCreateForm + ManagePlaceList)
/manage/trips/:id/edit/flights   항공편 관리 (ManageFlightCreateForm + ManageFlightList)
/manage/trips/:id/edit/schedules 일정 관리 (ManageScheduleCreateForm + ManageScheduleList)
/manage/trips/:id/edit/checklist 체크리스트 관리 (ManageChecklistSection)
/manage/trips/:id/edit/share     공유 링크 관리 (ManageShareActions, 중국 여행이면 ChinaPaymentHelper 포함)
```

기존 라우트(`/`, `/demo`, `/share/:token`, 레거시 `/owner`)는 그대로 둔다.

### 이동 방식

전체 페이지 이동(`<a href>`)을 그대로 사용한다. 현재 앱은 `App.tsx`가
`window.location.pathname`을 한 번 읽어 어떤 최상위 페이지를 렌더링할지 결정하는 방식이고
(`/`, `/manage`, `/demo`, `/share/:token` 전부 이 패턴), 클라이언트 라우터가 없다.
새 페이지들도 이 패턴을 그대로 따른다: `App.tsx`에 `/manage/trips/:id`와
`/manage/trips/:id/edit`, `/manage/trips/:id/edit/:section` 매칭 분기를 추가하고,
각 페이지는 이동해 올 때마다 새로 마운트되어 필요한 데이터를 API로 새로 불러온다.

라우트 파싱은 `shared/share.ts`의 `getShareTokenFromPath`와 같은 패턴으로
`shared/manageRoute.ts`에 `parseManageTripPath(pathname)` 같은 헬퍼를 만들어
`{ tripId, section } | null`을 반환하게 한다. section이 없으면 보기 화면,
`edit`만 있으면 편집 허브, `edit/:category`면 해당 편집 페이지.

## 인증

인증 확인/세션 검증 로직(`useTripManageSessionTrips`의 `/api/auth/me` 재검증, PR #156에서
401이 아닌 오류에는 세션을 유지하도록 수정됨)은 그대로 재사용한다. 새 페이지들도
`getSavedOwnerAuth()`로 토큰을 읽고, 없거나 무효하면 로그인 화면(`/manage`)으로
안내하는 기존 패턴을 따른다.

## 보기 화면 (`/manage/trips/:id`)

`/demo`와 동일한 `TripPage` 컴포넌트(탭: 오늘/전체 일정/항공/지도/긴급/마이페이지)를
그대로 재사용하되, `useTripPageController`가 지금처럼 `data/sampleTrip.ts` 정적 데이터를
읽는 대신, 실제 API 응답을 같은 모양으로 변환해서 넘겨주는 새 훅
(`useOwnerTripPageController(tripId)`)을 만든다.

### 데이터 연결 범위 (1차)

- **오늘/전체 일정**: `listTripSchedules` + `listTripPlaces` → 실제 데이터.
- **항공**: `listTripFlights` → 실제 데이터.
- **지도(장소 목록)**: `listTripPlaces` → 실제 데이터. (실제 지도 임베드는 이번 스코프 밖 —
  기존 `/demo`와 동일하게 장식용 프리뷰 + "현위치 길찾기"(구글맵 외부 링크) 유지)
- **체크리스트**: `listChecklist` → 실제 데이터.
- **긴급 탭**: 환율 변환기, 생존 회화, 여권 분실 안내는 원래도 여행별 데이터가 아니라
  범용 정적 콘텐츠이므로 그대로 유지한다. 가족/숙소 연락처는 지금처럼 플레이스홀더로 두고
  실제 연결은 2차 스코프로 미룬다.
- **마이페이지 탭**: 계정 정보/비밀번호 변경(기존 그대로) + "이 여행 편집하기" 버튼을
  새로 추가해 `/manage/trips/:id/edit`로 이동시킨다.

### 데이터 페칭

트립 상세 화면 마운트 시 `Promise.all`로 일정/장소/항공/체크리스트를 병렬로 불러온다.
트립 자체 정보(`title`/`startDate`/`endDate`/`travelers`/`destinationCountry`/`memo`)는
`listMyTrips`로 이미 owner 트립 목록을 갖고 있지 않은 상태로 페이지가 단독 진입될 수 있으므로,
별도로 트립 단건 조회가 필요하다. 현재 `api/trips.ts`에 단건 조회 함수가 없으므로
`getTrip(accessToken, tripID)` 함수를 추가하고, 백엔드에 `GET /api/trips/:id`가 없다면
`internal/handler`에 라우트를 추가한다 (기존 `updateTrip`이 이미 PATCH로 단건 접근하고 있으므로
같은 핸들러 패턴을 따르면 됨 — 구현 계획 단계에서 실제 백엔드 라우터 확인 후 확정).

## 편집 허브 (`/manage/trips/:id/edit`)

카테고리 카드 목록 (기본정보/장소/항공/일정/체크리스트/공유 링크). 각 카드를 누르면
해당 섹션 페이지로 이동. 상단에 여행 제목/기간 요약과 "보기 화면으로" 돌아가는 링크를 둔다.

## 개별 편집 페이지 (`/manage/trips/:id/edit/:section`)

기존 `SelectedTripDetailSection` 안에 있던 컴포넌트들을 그대로 재사용하되, 페이지당 하나씩만
렌더링한다:

| section | 재사용 컴포넌트 |
| --- | --- |
| basic | `TripBasicInfoForm` |
| places | `ManagePlaceCreateForm` + `ManagePlaceList` |
| flights | `ManageFlightCreateForm` + `ManageFlightList` |
| schedules | `ManageScheduleCreateForm` + `ManageScheduleList` |
| checklist | `ManageChecklistSection` |
| share | `ManageShareActions` (+ `destinationCountry === "CN"`이면 `ChinaPaymentHelper`) |

각 페이지 상단에 "편집 허브로" 돌아가는 링크를 둔다. 편집 로직(콜백, 상태)은
`useTripManageController`가 지금처럼 다 갖고 있고, 각 편집 페이지는 필요한 props만 뽑아 쓴다.

## 기존 화면과의 관계

- `/manage`: `TripListSection` + `TripCreateSection`만 남기고 `SelectedTripDetailSection`,
  `ManageFlowGuide`의 "선택 여행" 관련 안내는 제거. "관리하기" 버튼은
  `/manage/trips/:id`로 이동하는 링크로 바뀐다.
- `/demo`: 변경 없음. 그대로 정적 샘플 데이터 전용으로 유지 (첫 방문자 미리보기 용도).
- `/share/:token`: 변경 없음.

## 스코프 밖 (2차 이후)

- 실제 지도 임베드 (카카오맵/구글맵) — 기존에 이미 알려진 별도 결함.
- 보기 화면 안에서 바로 편집 (이번 설계는 보기/편집 분리가 목표이므로 명시적으로 배제).
- 긴급 탭의 가족/숙소 연락처 실제 데이터 연결.
- `/manage/*` 하위 이동을 전체 새로고침이 아닌 클라이언트 라우팅으로 바꾸는 것.

## 테스트

- `npm run check` (tsc, vite build, go test/race, vet, gofmt) 통과 필수.
- 브라우저 수동 검증: 로그인 → 여행 생성 → 목록에서 진입 → 보기 화면 탭 전체 실제 데이터 확인
  → 마이페이지 탭에서 편집 허브 진입 → 카테고리별 편집 페이지에서 CRUD 동작 확인 → 보기 화면
  복귀 시 반영 확인.
- 신규 백엔드 라우트(`GET /api/trips/:id`)를 추가한다면 Go 테스트도 추가.
