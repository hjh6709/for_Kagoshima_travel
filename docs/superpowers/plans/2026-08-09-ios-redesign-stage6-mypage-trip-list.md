# iOS 리디자인 6단계 — 마이페이지 + 여행 목록 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 여행 목록 카드에 장소·일정·항공 개수 스탯을 붙이고, 카드 메뉴와 마이페이지 설정 그룹을 스펙 구조로 바꾼다.

**Architecture:** 리디자인의 마지막 단계다. 앞 5단계와 달리 **백엔드를 함께 바꾼다** — 목록 API가 개수를 내려주도록 서비스 계층에 필드를 더한다. DB 스키마와 저장소 인터페이스는 건드리지 않는다.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, Go(표준 라이브러리 + 기존 서비스 계층), 순수 CSS.

## Global Constraints

- **DB 스키마 · 마이그레이션 · 저장소 인터페이스는 변경하지 않는다.** 개수는 이미 존재하는 `FindPlaces` / `FindSchedules` / `FindFlights`로 센다.
- 라우팅과 훅 계약은 변경하지 않는다.
- 터치 영역 최소 **44px**, 글자 최소 **12px**, 대비 **4.5:1 이상**. `apps/web/scripts/mobile-ui-foundations.test.mjs`가 CI에서 강제한다. 스펙의 12px 미만 수치는 올린다.
- 아이콘은 이미 설치된 `lucide-react`만 쓴다.
- Go 변경이 있으므로 `npm run check`(=`api:test` · `api:test:race` · `api:vet` · `api:gofmt:check` 포함)를 반드시 통과시킨다.
- 각 태스크는 끝에서 다음을 전부 통과시킨 뒤 커밋한다:
  - `npm --prefix apps/web run test:unit`
  - `npm --prefix apps/web run test:dependencies`
  - `npm run web:typecheck`
  - (Go를 건드린 태스크는) `npm run api:test && npm run api:vet && npm run api:gofmt:check`

## 확정된 설계 결정 (사용자 확인 완료, 2026-08-09)

| 항목 | 결정 |
| --- | --- |
| 카드 스탯 3개(장소·일정·항공) | **API에 개수 필드를 추가한다.** 1~5단계는 "API·DB 무변경"을 전제했지만, 이 항목만은 백엔드에서 값을 내려주기로 했다. |
| 카드 `⋯` 메뉴 | **삭제 + 공유 링크만 넣는다.** 복제는 기능 자체가 없어 넣지 않는다. 공유는 편집 화면의 공유 섹션으로 보내는 링크다. |
| 마이페이지 설정 그룹 | **스펙대로 4줄을 다 보여준다.** 비밀번호 변경만 동작하고, 여행 알림 · 언어 · 오프라인 저장은 **비활성 상태로 "준비 중"임을 명시**한다. 동작하는 것처럼 보이는 토글은 만들지 않는다. |

## 백엔드 변경 범위와 근거

`TripRepository` 인터페이스에 `FindPlaces` · `FindSchedules` · `FindFlights`가 **이미 있고 Memory · Postgres 두 구현체가 모두 제공**한다. 따라서 개수 집계는 서비스 계층에서 기존 메서드를 호출하는 것으로 끝나고, **SQL · 스키마 · 인터페이스 변경이 필요 없다.**

- **트레이드오프:** 여행 1건당 조회가 3번 늘어난다(N+1). 개인 여행 계획 앱이라 사용자당 여행 수가 많아야 수십 건이므로 지금 규모에서는 문제되지 않는다. 목록이 커지면 그때 집계 쿼리 한 방으로 바꾼다 — 이 판단 근거를 코드 주석에 남긴다.
- **응답 형태:** `GetTrip`도 쓰는 `TripResponse`에 필드를 더하면 상세 조회 응답에 항상 0이 실려 오해를 준다. **목록 전용 `TripSummaryResponse`를 새로 만든다.**

## 의도적인 스펙 편차

- **복제 미구현.** 여행 복제 기능이 앱에 없다. `⋯` 메뉴에 넣으면 누를 수 없는 항목이 된다.
- **설정 3줄은 비활성.** 알림 · 언어 · 오프라인 저장은 대응 기능이 없다. 켜진 것처럼 보이는 값(`켬`, `한국어`, `최근 3개`) 대신 `준비 중`으로 표시하고 `disabled`로 둔다.
- **지난 여행 카드 `opacity: 0.72` 미적용.** 투명도를 낮추면 본문 대비가 4.5:1 아래로 내려간다. 상태 배지 색으로만 구분한다.

## 파일 구조

**수정 (백엔드)**

| 파일 | 변경 |
| --- | --- |
| `apps/api/internal/dto/travel.go` | `TripSummaryResponse` 추가. |
| `apps/api/internal/service/trip_service.go` | `ListMyTrips`가 개수를 채운 요약을 돌려준다. |
| `apps/api/internal/service/trip_service_test.go` | 개수 집계 검증. |

**수정 (프론트)**

| 파일 | 변경 |
| --- | --- |
| `apps/web/src/api/trips.ts` | `OwnerTrip`에 개수 필드 추가. |
| `apps/web/src/features/manage/components/sections/TripListSection.tsx` | 스탯 행 + `⋯` 메뉴. |
| `apps/web/src/features/manage/components/sections/ManageHeader.tsx` | 키커 + 새 여행 버튼. |
| `apps/web/src/features/trip/components/tabs/MyPageTab.tsx` | 설정 그룹 4줄. |
| `apps/web/src/styles/manage.css` | 카드 스탯 · 메뉴 · 설정 행 스타일. |

---

### Task 1: 목록 API가 장소·일정·항공 개수를 내려준다

**Files:**
- Modify: `apps/api/internal/dto/travel.go`
- Modify: `apps/api/internal/service/trip_service.go:642-652`
- Modify: `apps/api/internal/service/trip_service_test.go`

**Interfaces:**
- Consumes: 기존 `tripRepository.FindPlaces/FindSchedules/FindFlights`.
- Produces:
  ```go
  type TripSummaryResponse struct {
      ID                 string   `json:"id"`
      Title              string   `json:"title"`
      StartDate          string   `json:"startDate"`
      EndDate            string   `json:"endDate"`
      Travelers          []string `json:"travelers"`
      DestinationCountry string   `json:"destinationCountry"`
      Memo               string   `json:"memo,omitempty"`
      PlaceCount         int      `json:"placeCount"`
      ScheduleCount      int      `json:"scheduleCount"`
      FlightCount        int      `json:"flightCount"`
  }
  ```
  `ListMyTrips`의 반환 타입이 `[]dto.TripResponse` → `[]dto.TripSummaryResponse`로 바뀐다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/api/internal/service/trip_service_test.go` 끝에 덧붙인다. 기존 테스트가 저장소를 어떻게 준비하는지 먼저 읽고 같은 헬퍼를 쓴다.

```go
func TestListMyTripsIncludesChildCounts(t *testing.T) {
	svc, repo := newTestTripService(t)
	tripID := seedTripForOwner(t, repo, "owner-1")
	seedPlace(t, repo, tripID)
	seedPlace(t, repo, tripID)
	seedSchedule(t, repo, tripID)

	trips, err := svc.ListMyTrips("owner-1")
	if err != nil {
		t.Fatalf("ListMyTrips returned error: %v", err)
	}
	if len(trips) != 1 {
		t.Fatalf("expected 1 trip, got %d", len(trips))
	}
	if trips[0].PlaceCount != 2 {
		t.Errorf("PlaceCount = %d, want 2", trips[0].PlaceCount)
	}
	if trips[0].ScheduleCount != 1 {
		t.Errorf("ScheduleCount = %d, want 1", trips[0].ScheduleCount)
	}
	if trips[0].FlightCount != 0 {
		t.Errorf("FlightCount = %d, want 0", trips[0].FlightCount)
	}
}
```

> 헬퍼 이름(`newTestTripService` 등)은 이 파일에 이미 있는 것을 쓴다. 없으면 기존 테스트가 저장소를 준비하는 방식을 그대로 따라 인라인으로 만든다.

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd apps/api && go test ./internal/service/ -run TestListMyTripsIncludesChildCounts`
Expected: FAIL — `trips[0].PlaceCount` 필드가 없어 컴파일되지 않는다

- [ ] **Step 3: DTO를 추가한다**

`apps/api/internal/dto/travel.go`의 `TripResponse` 아래에 넣는다.

```go
// TripSummaryResponse는 여행 목록 화면 전용이다.
// 상세 조회(TripResponse)에는 개수를 넣지 않는다 — 항상 0이 실려 오해를 준다.
type TripSummaryResponse struct {
	ID                 string   `json:"id"`
	Title              string   `json:"title"`
	StartDate          string   `json:"startDate"`
	EndDate            string   `json:"endDate"`
	Travelers          []string `json:"travelers"`
	DestinationCountry string   `json:"destinationCountry"`
	Memo               string   `json:"memo,omitempty"`
	PlaceCount         int      `json:"placeCount"`
	ScheduleCount      int      `json:"scheduleCount"`
	FlightCount        int      `json:"flightCount"`
}
```

- [ ] **Step 4: 서비스가 개수를 채우게 한다**

`trip_service.go`의 `ListMyTrips`를 교체한다.

```go
// ListMyTrips는 목록 카드에 필요한 하위 개수까지 함께 돌려준다.
//
// 여행 1건당 조회가 3번 늘어난다(N+1). 개인 여행 계획 앱이라 사용자당 여행 수가
// 많아야 수십 건이므로 지금 규모에서는 집계 쿼리를 따로 두지 않는다.
// 목록이 커지면 저장소에 집계 메서드를 추가해 한 번에 세도록 바꾼다.
func (s *TripService) ListMyTrips(ownerID string) ([]dto.TripSummaryResponse, error) {
	trips, err := s.tripRepository.FindByOwner(ownerID)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.TripSummaryResponse, 0, len(trips))
	for _, trip := range trips {
		base := mapTripResponse(trip)

		places, err := s.tripRepository.FindPlaces(trip.ID)
		if err != nil {
			return nil, err
		}
		schedules, err := s.tripRepository.FindSchedules(trip.ID)
		if err != nil {
			return nil, err
		}
		flights, err := s.tripRepository.FindFlights(trip.ID)
		if err != nil {
			return nil, err
		}

		responses = append(responses, dto.TripSummaryResponse{
			ID:                 base.ID,
			Title:              base.Title,
			StartDate:          base.StartDate,
			EndDate:            base.EndDate,
			Travelers:          base.Travelers,
			DestinationCountry: base.DestinationCountry,
			Memo:               base.Memo,
			PlaceCount:         len(places),
			ScheduleCount:      len(schedules),
			FlightCount:        len(flights),
		})
	}
	return responses, nil
}
```

- [ ] **Step 5: 테스트와 정적 검사를 돌린다**

Run: `cd apps/api && go test ./... && go vet ./... && test -z "$(gofmt -l .)"`
Expected: 전부 PASS. 컴파일 오류가 나면 `ListMyTrips` 반환 타입을 쓰는 다른 호출부를 함께 고친다.

- [ ] **Step 6: OpenAPI 문서를 맞춘다**

`internal/handler/openapi.json`에 `TripResponse` 스키마가 있다면 목록 응답 스키마를 `TripSummaryResponse`로 갈라 준다. `internal/handler/docs_test.go`가 문서와 실제 응답의 일치를 검증하므로, **이 테스트가 실패하면 문서를 고쳐서 맞춘다.**

Run: `cd apps/api && go test ./internal/handler/`
Expected: PASS

- [ ] **Step 7: 커밋한다**

```bash
git add apps/api/internal/dto/travel.go apps/api/internal/service/trip_service.go apps/api/internal/service/trip_service_test.go apps/api/internal/handler/openapi.json
git commit -m "feat(api): 여행 목록 응답에 장소·일정·항공 개수를 포함"
```

---

### Task 2: 프론트가 개수를 받는다

**Files:**
- Modify: `apps/web/src/api/trips.ts:7-15`

- [ ] **Step 1: 타입을 늘린다**

```ts
export type OwnerTrip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  destinationCountry: string;
  memo?: string;
  placeCount?: number;
  scheduleCount?: number;
  flightCount?: number;
};
```

> 선택 필드로 둔다. 배포 시점에 백엔드가 먼저 올라가지 않아도 화면이 깨지지 않는다.

- [ ] **Step 2: 타입 검사와 테스트를 돌린다**

Run: `npm run web:typecheck && npm --prefix apps/web run test:unit`
Expected: PASS

- [ ] **Step 3: 커밋한다**

```bash
git add apps/web/src/api/trips.ts
git commit -m "feat(web): 여행 목록 타입에 하위 개수 필드 추가"
```

---

### Task 3: 여행 카드에 스탯 행과 ⋯ 메뉴

**Files:**
- Modify: `apps/web/src/features/manage/components/sections/TripListSection.tsx`

**Interfaces:**
- Consumes: Task 2의 개수 필드.
- Produces: 없음.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`TripManagePage.test.tsx`에 목록 카드 검증이 있으면 그 파일에, 없으면 `TripListSection.test.tsx`를 새로 만든다. 기존 파일이 저장소/props를 어떻게 준비하는지 먼저 읽고 같은 방식을 쓴다.

```tsx
it("여행 카드에 장소·일정·항공 개수를 함께 보여준다", () => {
  renderTripList([
    {
      id: "trip-1",
      title: "가고시마 3박 4일",
      startDate: "2026-11-03",
      endDate: "2026-11-06",
      travelers: ["나"],
      destinationCountry: "JP",
      placeCount: 7,
      scheduleCount: 12,
      flightCount: 2,
    },
  ]);

  expect(screen.getByLabelText("장소 7곳")).toBeVisible();
  expect(screen.getByLabelText("일정 12개")).toBeVisible();
  expect(screen.getByLabelText("항공편 2개")).toBeVisible();
});

it("개수를 아직 못 받았으면 스탯 행을 넣지 않는다", () => {
  renderTripList([
    {
      id: "trip-1",
      title: "가고시마 3박 4일",
      startDate: "2026-11-03",
      endDate: "2026-11-06",
      travelers: ["나"],
      destinationCountry: "JP",
    },
  ]);

  expect(screen.queryByLabelText(/장소 \d+곳/)).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- TripList TripManagePage`
Expected: FAIL — `장소 7곳` 라벨을 찾을 수 없다

- [ ] **Step 3: 카드를 고친다**

import에 아이콘을 더한다.

```tsx
import {
  ArrowRight, CalendarDays, Compass, MapPin, MoreHorizontal,
  PencilLine, Plane, Share2, Trash2, UsersRound,
} from "lucide-react";
```

`getManageTripEditorPath`와 나란히 공유 섹션 경로 헬퍼가 있으면 함께 import 한다. 없으면 `` `${getManageTripEditorPath(id)}/share` `` 형태를 쓰기 전에 **실제 라우트를 `shared/manageRoute.ts`에서 확인**한다.

카드 본문에서 `<div className="owner-trip-actions">` 바로 **위**에 스탯 행을 넣는다.

```tsx
                {typeof ownerTrip.placeCount === "number" && (
                  <div className="owner-trip-stats">
                    <span aria-label={`장소 ${ownerTrip.placeCount}곳`}>
                      <MapPin aria-hidden="true" size={16} />
                      {ownerTrip.placeCount}
                    </span>
                    <span aria-label={`일정 ${ownerTrip.scheduleCount ?? 0}개`}>
                      <CalendarDays aria-hidden="true" size={16} />
                      {ownerTrip.scheduleCount ?? 0}
                    </span>
                    <span aria-label={`항공편 ${ownerTrip.flightCount ?? 0}개`}>
                      <Plane aria-hidden="true" size={16} />
                      {ownerTrip.flightCount ?? 0}
                    </span>
                  </div>
                )}
```

`<details className="owner-trip-manage">` 블록 전체를 아래로 교체한다.

```tsx
                <details className="owner-trip-manage">
                  <summary aria-label={`${ownerTrip.title} 관리 메뉴`}>
                    <MoreHorizontal aria-hidden="true" size={18} />
                  </summary>
                  <div className="owner-trip-manage-panel">
                    <a className="secondary-button compact-button" href={shareHref}>
                      <Share2 aria-hidden="true" size={16} />
                      공유 링크
                    </a>
                    <button
                      className="danger-button compact-button"
                      disabled={isDeleting}
                      onClick={() => {
                        if (window.confirm(`정말로 '${ownerTrip.title}' 여행 일정을 영구 삭제하시겠습니까?`)) {
                          onDeleteTrip(ownerTrip.id);
                        }
                      }}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={16} />
                      {isDeleting ? "삭제 중" : "여행 삭제"}
                    </button>
                    <p>삭제하면 일정과 장소를 복구할 수 없습니다.</p>
                  </div>
                </details>
```

`shareHref`는 map 콜백 안에서 만든다.

```tsx
            const shareHref = `${getManageTripEditorPath(ownerTrip.id)}/share`;
```

> `ChevronDown` import는 더 이상 쓰지 않으므로 지운다. `npm run web:typecheck`가 잡아 준다.

- [ ] **Step 4: 공유 경로가 실제로 존재하는지 확인한다**

Run: `grep -rn "share" apps/web/src/shared/manageRoute.ts`
편집 섹션 라우트가 `/manage/trips/:id/edit/:section` 형태이고 `share`가 유효한 섹션인지 확인한다. 다르면 실제 경로에 맞춘다. **추측한 URL을 그대로 두지 않는다.**

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit && npm run web:typecheck`
Expected: PASS

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/features/manage/components/sections/TripListSection.tsx apps/web/src/features/manage/**/*.test.tsx
git commit -m "feat(web): 여행 카드에 하위 개수 스탯과 관리 메뉴 추가"
```

---

### Task 4: 목록 헤더에 키커와 새 여행 버튼

**Files:**
- Modify: `apps/web/src/features/manage/components/sections/ManageHeader.tsx`
- Modify: `apps/web/src/features/manage/TripManagePage.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `ManageHeader`가 `tripCount: number`와 `onCreateTrip: () => void`를 **추가로 받는다**.

- [ ] **Step 1: 헤더를 고친다**

```tsx
import { Plus, User } from "lucide-react";
import type { AuthResponse } from "../../../../api/auth";

type ManageHeaderProps = {
  auth: AuthResponse;
  tripCount: number;
  onCreateTrip: () => void;
};

// 로그인 후 첫 화면에서는 제품 설명보다 사용자의 여행이 먼저 보이도록 계정 정보만 간결하게 표시한다.
export function ManageHeader({ auth, tripCount, onCreateTrip }: ManageHeaderProps) {
  return (
    <header className="owner-header">
      <div>
        <span className="eyebrow">{tripCount}개의 여행</span>
        <h1>내 여행</h1>
        <p className="owner-account-email">{auth.user.email}</p>
      </div>
      <div className="owner-header-actions">
        <button className="primary-button compact-button" onClick={onCreateTrip} type="button">
          <Plus aria-hidden="true" size={17} />
          새 여행
        </button>
        <a className="secondary-button compact-button owner-account-link" href="/manage/account">
          <User aria-hidden="true" size={18} />
          마이페이지
        </a>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: `TripManagePage`가 값을 넘기게 한다**

```tsx
                <ManageHeader
                  auth={auth}
                  onCreateTrip={() => setIsTripCreateOpen(true)}
                  tripCount={ownerTrips.length}
                />
```

- [ ] **Step 3: 회귀를 확인한다**

Run: `npm --prefix apps/web run test:unit -- TripManagePage ManageLandingSections && npm run web:typecheck`
Expected: PASS. 실패하면 무엇이 깨졌는지 먼저 읽고, 기대값을 임의로 바꾸지 말고 실제 동작이 맞는지 판단한다.

- [ ] **Step 4: 커밋한다**

```bash
git add apps/web/src/features/manage/components/sections/ManageHeader.tsx apps/web/src/features/manage/TripManagePage.tsx
git commit -m "feat(web): 여행 목록 헤더에 개수 키커와 새 여행 버튼 추가"
```

---

### Task 5: 마이페이지 설정 그룹

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/MyPageTab.tsx`

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`MyPageTab.test.tsx` 끝에 덧붙인다.

```tsx
describe("MyPageTab 설정 그룹", () => {
  it("아직 준비되지 않은 설정은 눌리지 않게 두고 준비 중임을 알린다", () => {
    renderMyPageTab();

    for (const label of ["여행 알림", "언어", "오프라인 저장"]) {
      const row = screen.getByRole("button", { name: new RegExp(label) });
      expect(row).toBeDisabled();
      expect(row).toHaveTextContent("준비 중");
    }
  });
});
```

> `renderMyPageTab`은 이 파일에 이미 있는 헬퍼를 쓴다. 없으면 기존 테스트의 `render(...)` 호출을 그대로 따른다.

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- MyPageTab`
Expected: FAIL — `여행 알림` 버튼을 찾을 수 없다

- [ ] **Step 3: 설정 그룹을 추가한다**

import에 `ChevronRight`를 더하고, `<PasswordSettingsSection ... />` **바로 위**에 넣는다.

```tsx
      <section className="mypage-section" aria-labelledby="mypage-settings">
        <h2 className="mypage-section-title" id="mypage-settings">
          설정
        </h2>
        <div className="mypage-setting-list">
          {/* 대응하는 기능이 아직 없다. 값이 켜져 있는 것처럼 보이면 거짓말이 되므로
              눌리지 않게 두고 준비 중임을 그대로 밝힌다. */}
          {["여행 알림", "언어", "오프라인 저장"].map((label) => (
            <button className="mypage-setting-row" disabled key={label} type="button">
              <span>{label}</span>
              <span className="mypage-setting-value">
                준비 중
                <ChevronRight aria-hidden="true" size={17} />
              </span>
            </button>
          ))}
        </div>
      </section>
```

> 비밀번호 변경과 계정 삭제는 기존 `PasswordSettingsSection` · `AccountDeletionSection`이 그대로 담당한다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- MyPageTab`
Expected: PASS

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/MyPageTab.tsx apps/web/src/features/trip/components/tabs/MyPageTab.test.tsx
git commit -m "feat(web): 마이페이지에 설정 그룹 추가 (미구현 항목은 비활성)"
```

---

### Task 6: 스타일 + 최종 검증

**Files:**
- Modify: `apps/web/src/styles/manage.css`

- [ ] **Step 1: 스타일을 추가한다**

`apps/web/src/styles/manage.css` 맨 끝에 덧붙인다.

```css
/* ── 여행 목록 · 마이페이지 (6단계) ──────────────────────────── */
.owner-header-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.owner-trip-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.owner-trip-stats span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
}

.owner-trip-stats svg {
  color: var(--c-route);
}

.owner-trip-manage > summary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin-left: auto;
  border-radius: 12px;
  color: var(--c-muted);
  cursor: pointer;
  list-style: none;
}

.owner-trip-manage > summary::-webkit-details-marker {
  display: none;
}

.owner-trip-manage-panel {
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 14px;
  border-radius: 16px;
  background: var(--c-bg);
}

.owner-trip-manage-panel p {
  margin: 0;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  line-height: 1.5;
}

.mypage-setting-list {
  display: grid;
  gap: 8px;
}

.mypage-setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 14px 16px;
  border: 0;
  border-radius: 16px;
  background: var(--c-surface);
  color: var(--c-text);
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-strong);
  text-align: left;
}

.mypage-setting-row:disabled {
  color: var(--c-muted);
  cursor: not-allowed;
}

.mypage-setting-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
}
```

- [ ] **Step 2: 전체 검증을 돌린다**

Run: `npm --prefix apps/web run test:unit && npm --prefix apps/web run test:dependencies && npm run check`
Expected: 전부 PASS (Go 포함)

- [ ] **Step 3: 브라우저에서 실제 렌더를 확인한다**

목록과 마이페이지는 로그인이 필요하다. 로컬 API를 함께 띄운다.

```bash
PORT=8081 npm run api:dev
```

`/manage`에서 **컨테이너 기준으로** 실측한다.

1. 375×812 — 헤더 키커·새 여행 버튼, 카드 스탯 행, `⋯` 메뉴를 펼친 모습 스크린샷.
2. 마이페이지에서 설정 4줄이 보이고 3줄이 비활성인지 확인.
3. 195×700에서 아래 실행 — 전부 true / 44 이상이어야 한다.
   ```js
   (() => {
     const card = document.querySelector('.owner-trip-card');
     const stats = document.querySelector('.owner-trip-stats');
     const summary = document.querySelector('.owner-trip-manage > summary');
     const overflow = (el) => el.scrollWidth > el.clientWidth + 1;
     return JSON.stringify({
       cardNoOverflow: card ? !overflow(card) : null,
       statsNoOverflow: stats ? !overflow(stats) : null,
       summarySize: summary && [
         Math.round(summary.getBoundingClientRect().width),
         Math.round(summary.getBoundingClientRect().height),
       ],
       bodyNoHScroll: document.body.scrollWidth <= document.body.clientWidth,
     });
   })();
   ```

- [ ] **Step 4: 커밋한다**

```bash
git add apps/web/src/styles/manage.css
git commit -m "feat(web): 여행 목록 카드와 마이페이지 설정 스타일 적용"
```

---

## 최종 확인

- [ ] `npm run check` 전체 통과 (이번 단계는 **Go 변경이 있으므로 특히 중요**)
- [ ] `git push` 후 PR 생성 — 제목 `feat: iOS 리디자인 6단계 — 마이페이지 + 여행 목록`
- [ ] PR 본문에 이 플랜과 로드맵 경로를 링크하고, **백엔드를 건드린 이유와 N+1 트레이드오프**를 명시
- [ ] CI `frontend build` · `backend test` · `backend postgres test` 통과 확인
- [ ] 로드맵 6단계 행을 **완료**로 갱신하고, 리디자인 전체가 끝났음을 표에 남긴다
