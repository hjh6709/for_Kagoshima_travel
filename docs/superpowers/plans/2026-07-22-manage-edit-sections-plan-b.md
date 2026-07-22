# 여행 관리 화면 개편 — 플랜 B (카테고리별 편집 페이지) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 플랜 A에서 "준비 중" 스텁으로 남겨둔 편집 허브(`/manage/trips/:id/edit`)의 카테고리 카드 6개를 실제 편집 페이지(`/manage/trips/:id/edit/:section`)로 연결한다.

**Architecture:** 새 CRUD 로직은 작성하지 않는다. 기존에 giant form(`SelectedTripDetailSection.tsx`) 안에 이미 있던 컴포넌트들(`TripBasicInfoForm`, `ManagePlaceCreateForm`/`ManagePlaceList`, `ManageFlightCreateForm`/`ManageFlightList`, `ManageScheduleCreateForm`/`ManageScheduleList`, `ManageChecklistSection`, `ManageShareActions`, `ChinaPaymentHelper`)을 그대로 재사용하고, 카테고리 하나만 렌더링하는 새 페이지 셸(`TripEditSectionPage`)에 옮겨 담는다. 라우팅은 플랜 A와 동일하게 `parseManageRoute`를 확장하고 `<a href>` 전체 페이지 이동을 유지한다.

**Tech Stack:** React 19 + TypeScript(`apps/web`), Vite. 이 저장소의 `apps/web`에는 JS/TS 단위 테스트 러너가 없다. 각 프론트엔드 작업의 "테스트" 단계는 `npm run web:typecheck` + `npm run web:build` + 브라우저 수동 검증이다(플랜 A와 동일한 관례).

## Global Constraints

- 백엔드(`apps/api`)는 변경하지 않는다. 플랜 A에서 이미 pgbouncer 500 버그를 고쳐서, 일정/장소/항공편 병렬 조회는 정상 동작한다.
- `SelectedTripDetailSection.tsx`와 옛 giant form 관련 컴포넌트 파일은 삭제하지 않는다 — 이번 작업이 그 컴포넌트들을 새 위치에서 재사용하는 것이다.
- 페이지 이동은 전부 `<a href="...">` 전체 페이지 이동이다.
- 매 작업 후 `npm run web:typecheck`와 `npm run web:build`가 통과해야 한다(저장소 루트에서 실행).
- 커밋 메시지는 이 저장소의 기존 스타일(`fix(web): ...`, `feat(web): ...` 등 Conventional Commits + 한글 설명)을 따른다.

## 시작 전

`origin/main`에서 새 브랜치를 딴다(플랜 A `#157`이 이미 머지되어 있어야 한다):

```bash
cd /Users/hanjeonghyun/dev/for_Kagoshima_travel
git fetch origin
git checkout -b feat/web-manage-edit-sections-plan-b origin/main
```

---

## Task 1: 라우트 파서에 `editSection` 추가

**Files:**
- Modify: `apps/web/src/shared/manageRoute.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `EditSection` 타입(`"basic" | "places" | "flights" | "schedules" | "checklist" | "share"`), `ManageRoute`에 `{ view: "editSection"; tripId: string; section: EditSection }` 케이스 추가. Task 2(`TripEditSectionPage`)와 Task 3(`App.tsx`, `TripEditHubPage.tsx`)이 이 타입과 값을 그대로 가져다 쓴다.

- [ ] **Step 1: 파일 전체 교체**

`apps/web/src/shared/manageRoute.ts`를 아래로 교체한다:

```typescript
// apps/web/src/shared/manageRoute.ts

export type EditSection = "basic" | "places" | "flights" | "schedules" | "checklist" | "share";

const EDIT_SECTIONS: readonly EditSection[] = ["basic", "places", "flights", "schedules", "checklist", "share"];

function isEditSection(value: string): value is EditSection {
  return (EDIT_SECTIONS as readonly string[]).includes(value);
}

export type ManageRoute =
  | { view: "list" }
  | { view: "trip"; tripId: string }
  | { view: "editHub"; tripId: string }
  | { view: "editSection"; tripId: string; section: EditSection };

// "/manage/trips/:id/edit/:section" -> 카테고리 편집 페이지 (section이 알 수 없는 값이면 편집 허브로 되돌린다),
// "/manage/trips/:id/edit" -> 편집 허브, "/manage/trips/:id" -> 보기 화면,
// 그 외 "/manage"로 시작하는 모든 경로 -> 목록 화면.
export function parseManageRoute(pathname: string): ManageRoute {
  const editSectionMatch = pathname.match(/^\/manage\/trips\/([^/]+)\/edit\/([^/]+)\/?$/);
  if (editSectionMatch) {
    const tripId = decodeURIComponent(editSectionMatch[1]);
    const section = decodeURIComponent(editSectionMatch[2]);
    if (isEditSection(section)) {
      return { view: "editSection", tripId, section };
    }
    return { view: "editHub", tripId };
  }

  const editHubMatch = pathname.match(/^\/manage\/trips\/([^/]+)\/edit\/?$/);
  if (editHubMatch) {
    return { view: "editHub", tripId: decodeURIComponent(editHubMatch[1]) };
  }

  const tripMatch = pathname.match(/^\/manage\/trips\/([^/]+)\/?$/);
  if (tripMatch) {
    return { view: "trip", tripId: decodeURIComponent(tripMatch[1]) };
  }

  return { view: "list" };
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run web:typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 파서 동작 직접 확인**

Run:
```bash
cd apps/web && node --experimental-strip-types -e "
import { parseManageRoute } from './src/shared/manageRoute.ts';
console.log(parseManageRoute('/manage/trips/abc/edit/places'));
console.log(parseManageRoute('/manage/trips/abc/edit/nope'));
console.log(parseManageRoute('/manage/trips/abc/edit'));
console.log(parseManageRoute('/manage/trips/abc'));
"
```
Expected output:
```
{ view: 'editSection', tripId: 'abc', section: 'places' }
{ view: 'editHub', tripId: 'abc' }
{ view: 'editHub', tripId: 'abc' }
{ view: 'trip', tripId: 'abc' }
```

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/shared/manageRoute.ts
git commit -m "feat(web): 편집 허브 하위 카테고리 경로(/edit/:section) 파서 추가"
```

---

## Task 2: 카테고리 편집 페이지 (`TripEditSectionPage`)

**Files:**
- Create: `apps/web/src/features/manage/TripEditSectionPage.tsx`

**Interfaces:**
- Consumes: `EditSection`(Task 1), `useTripManageController`(기존), `ManageAuthSection`/`TripBasicInfoForm`/`ManagePlaceCreateForm`/`ManagePlaceList`/`ManageFlightCreateForm`/`ManageFlightList`/`ManageScheduleCreateForm`/`ManageScheduleList`/`ManageChecklistSection`/`ManageShareActions`/`ChinaPaymentHelper`(전부 `apps/web/src/features/manage/components/`에 이미 존재)
- Produces: `TripEditSectionPage({ tripId, section }: { tripId: string; section: EditSection })` — Task 3에서 `App.tsx`가 라우팅한다.

- [ ] **Step 1: 파일 작성**

```tsx
// apps/web/src/features/manage/TripEditSectionPage.tsx
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { formatKoreanDate } from "../../shared/date";
import type { EditSection } from "../../shared/manageRoute";
import { ChinaPaymentHelper } from "./components/ChinaPaymentHelper";
import { ManageAuthSection } from "./components/ManageAuthSection";
import { ManageChecklistSection } from "./components/ManageChecklistSection";
import { ManageFlightCreateForm } from "./components/ManageFlightCreateForm";
import { ManageFlightList } from "./components/ManageFlightList";
import { ManagePlaceCreateForm } from "./components/ManagePlaceCreateForm";
import { ManagePlaceList } from "./components/ManagePlaceList";
import { ManageScheduleCreateForm } from "./components/ManageScheduleCreateForm";
import { ManageScheduleList } from "./components/ManageScheduleList";
import { ManageShareActions } from "./components/ManageShareActions";
import { TripBasicInfoForm } from "./components/TripBasicInfoForm";
import { useTripManageController } from "./useTripManageController";

type TripEditSectionPageProps = {
  tripId: string;
  section: EditSection;
};

const sectionLabels: Record<EditSection, string> = {
  basic: "기본정보",
  places: "장소",
  flights: "항공편",
  schedules: "일정",
  checklist: "체크리스트",
  share: "공유 링크",
};

// "/manage/trips/:id/edit/:section" 진입점. 카테고리 하나만 렌더링한다는 점만 다르고,
// 실제 폼/목록 컴포넌트와 상태 관리는 기존 giant form(SelectedTripDetailSection)이 쓰던 것을 그대로 재사용한다.
export function TripEditSectionPage({ tripId, section }: TripEditSectionPageProps) {
  const currentPath = window.location.pathname;
  const manage = useTripManageController({ currentPath, isLegacyOwnerRoute: false, isManageRoute: true });
  const { auth, authChecked, ownerTrips, ownerTripsLoading, selectedOwnerTrip, onSelectOwnerTrip } = manage;

  useEffect(() => {
    if (ownerTripsLoading || ownerTrips.length === 0) return;
    if (selectedOwnerTrip?.id === tripId) return;
    onSelectOwnerTrip(tripId);
  }, [tripId, ownerTripsLoading, ownerTrips, selectedOwnerTrip, onSelectOwnerTrip]);

  if (!authChecked || !auth) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen owner-screen">
              <ManageAuthSection {...manage} />
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (ownerTripsLoading) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen" style={{ display: "grid", placeItems: "center", gap: "10px", padding: "48px 0" }}>
              <Compass className="spin-slow" size={32} />
              <h1>여행 정보를 불러오는 중입니다</h1>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (!selectedOwnerTrip) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen">
              <h1>여행을 찾을 수 없습니다</h1>
              <p className="muted">삭제되었거나 접근 권한이 없는 여행입니다.</p>
              <a className="primary-button" href="/manage" style={{ marginTop: "16px" }}>
                여행 목록으로
              </a>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <div className="section-title-row">
              <div>
                <span className="pill">편집 · {sectionLabels[section]}</span>
                <h1>{selectedOwnerTrip.title}</h1>
                <p className="muted">
                  {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
                </p>
              </div>
              <a className="secondary-button compact-button" href={`/manage/trips/${selectedOwnerTrip.id}/edit`}>
                편집 허브로
              </a>
            </div>

            {section === "basic" && (
              <>
                {selectedOwnerTrip.destinationCountry === "CN" && <ChinaPaymentHelper />}
                <TripBasicInfoForm {...manage} />
              </>
            )}

            {section === "places" && (
              <>
                <ManagePlaceCreateForm {...manage} />
                <ManagePlaceList {...manage} destinationCountry={selectedOwnerTrip.destinationCountry} />
              </>
            )}

            {section === "flights" && (
              <>
                <ManageFlightCreateForm
                  {...manage}
                  tripEndDate={selectedOwnerTrip.endDate}
                  tripStartDate={selectedOwnerTrip.startDate}
                />
                <ManageFlightList {...manage} />
              </>
            )}

            {section === "schedules" && (
              <>
                <ManageScheduleCreateForm
                  {...manage}
                  tripEndDate={selectedOwnerTrip.endDate}
                  tripStartDate={selectedOwnerTrip.startDate}
                />
                <ManageScheduleList {...manage} />
              </>
            )}

            {section === "checklist" && (
              <ManageChecklistSection
                checklistItems={manage.checklistItems}
                checklistLoading={manage.checklistLoading}
                checklistError={manage.checklistError}
                newChecklistTitle={manage.newChecklistTitle}
                setNewChecklistTitle={manage.onNewChecklistTitleChange}
                newChecklistCategory={manage.newChecklistCategory}
                setNewChecklistCategory={manage.onNewChecklistCategoryChange}
                checklistSubmitting={manage.checklistSubmitting}
                handleAddChecklistItem={manage.onAddChecklistItem}
                handleToggleChecklistItem={manage.onToggleChecklistItem}
                handleDeleteChecklistItem={manage.onDeleteChecklistItem}
              />
            )}

            {section === "share" && <ManageShareActions {...manage} />}
          </section>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run web:typecheck`
Expected: 에러 없음. `TripBasicInfoForm`/`ManagePlaceCreateForm`/`ManagePlaceList`/`ManageFlightCreateForm`/`ManageFlightList`/`ManageScheduleCreateForm`/`ManageScheduleList`/`ManageShareActions`는 기존 `SelectedTripDetailSection.tsx`(`apps/web/src/features/manage/components/SelectedTripDetailSection.tsx`)에서 이미 `{...props}` 스프레드로 똑같이 쓰이던 컴포넌트라 `manage`(타입 `TripManagePageProps`) 스프레드로 그대로 만족된다.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/manage/TripEditSectionPage.tsx
git commit -m "feat(web): 카테고리별 여행 편집 페이지(/manage/trips/:id/edit/:section) 추가"
```

---

## Task 3: 라우팅 연결 + 편집 허브 카드를 실제 링크로 전환

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/features/manage/TripEditHubPage.tsx`

**Interfaces:**
- Consumes: `TripEditSectionPage`(Task 2), `EditSection`(Task 1)

- [ ] **Step 1: `App.tsx`에 라우팅 분기 추가**

`apps/web/src/App.tsx`에서 import와 `isManageRoute` 분기 블록을 아래처럼 수정한다.

```tsx
// 상단 import에 추가
import { TripEditSectionPage } from "./features/manage/TripEditSectionPage";
```

```tsx
  if (isManageRoute && !isLegacyOwnerRoute) {
    const manageRoute = parseManageRoute(currentPath);
    if (manageRoute.view === "trip") {
      return <OwnerTripViewPage tripId={manageRoute.tripId} />;
    }
    if (manageRoute.view === "editSection") {
      return <TripEditSectionPage section={manageRoute.section} tripId={manageRoute.tripId} />;
    }
    if (manageRoute.view === "editHub") {
      return <TripEditHubPage tripId={manageRoute.tripId} />;
    }
    return <TripManagePage {...managePageProps} />;
  }
```

(`editSection` 분기를 `editHub` 분기보다 먼저 둔다 — 둘 다 서로 다른 정규식에 매칭되므로 순서 자체는 결과에 영향 없지만, 더 구체적인 경로를 먼저 검사하는 순서가 읽기 쉽다.)

- [ ] **Step 2: `TripEditHubPage.tsx`의 카드를 실제 링크로 변경**

`apps/web/src/features/manage/TripEditHubPage.tsx` 전체를 아래로 교체한다:

```tsx
// apps/web/src/features/manage/TripEditHubPage.tsx
import { useEffect } from "react";
import { ChevronRight, Compass, Luggage, MapPin, Plane, CalendarDays, ListChecks, Link2 } from "lucide-react";
import { formatKoreanDate } from "../../shared/date";
import type { EditSection } from "../../shared/manageRoute";
import { ManageAuthSection } from "./components/ManageAuthSection";
import { useTripManageController } from "./useTripManageController";

type TripEditHubPageProps = {
  tripId: string;
};

const editCategories: Array<{ icon: typeof Luggage; label: string; section: EditSection }> = [
  { icon: Luggage, label: "기본정보", section: "basic" },
  { icon: MapPin, label: "장소", section: "places" },
  { icon: Plane, label: "항공편", section: "flights" },
  { icon: CalendarDays, label: "일정", section: "schedules" },
  { icon: ListChecks, label: "체크리스트", section: "checklist" },
  { icon: Link2, label: "공유 링크", section: "share" },
];

// "/manage/trips/:id/edit" 진입점. 카드를 누르면 /manage/trips/:id/edit/:section으로 이동한다.
export function TripEditHubPage({ tripId }: TripEditHubPageProps) {
  const currentPath = window.location.pathname;
  const manage = useTripManageController({ currentPath, isLegacyOwnerRoute: false, isManageRoute: true });
  const { auth, authChecked, ownerTrips, ownerTripsLoading, selectedOwnerTrip, onSelectOwnerTrip } = manage;

  useEffect(() => {
    if (ownerTripsLoading || ownerTrips.length === 0) return;
    if (selectedOwnerTrip?.id === tripId) return;
    onSelectOwnerTrip(tripId);
  }, [tripId, ownerTripsLoading, ownerTrips, selectedOwnerTrip, onSelectOwnerTrip]);

  if (!authChecked || !auth) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen owner-screen">
              <ManageAuthSection {...manage} />
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (ownerTripsLoading) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen" style={{ display: "grid", placeItems: "center", gap: "10px", padding: "48px 0" }}>
              <Compass className="spin-slow" size={32} />
              <h1>여행 정보를 불러오는 중입니다</h1>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (!selectedOwnerTrip) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen">
              <h1>여행을 찾을 수 없습니다</h1>
              <p className="muted">삭제되었거나 접근 권한이 없는 여행입니다.</p>
              <a className="primary-button" href="/manage" style={{ marginTop: "16px" }}>
                여행 목록으로
              </a>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <div className="section-title-row">
              <div>
                <span className="pill">편집</span>
                <h1>{selectedOwnerTrip.title}</h1>
                <p className="muted">
                  {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
                </p>
              </div>
              <a className="secondary-button compact-button" href={`/manage/trips/${selectedOwnerTrip.id}`}>
                보기 화면으로
              </a>
            </div>

            <div className="card-stack">
              {editCategories.map(({ icon: Icon, label, section }) => (
                <a
                  className="info-card"
                  href={`/manage/trips/${selectedOwnerTrip.id}/edit/${section}`}
                  key={section}
                  style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}
                >
                  <Icon size={20} />
                  <div style={{ flex: 1 }}>
                    <strong>{label}</strong>
                  </div>
                  <ChevronRight size={18} className="muted" />
                </a>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
```

(카드가 이제 `준비 중` 배지 대신 실제 `<a href>` 링크가 되고, 오른쪽 화살표(`ChevronRight`)로 이동 가능함을 표시한다.)

- [ ] **Step 3: 타입체크 + 빌드**

Run: `npm run web:typecheck && npm run web:build`
Expected: 에러 없음.

- [ ] **Step 4: 브라우저로 6개 카테고리 전부 CRUD 동작 확인**

`.claude/launch.json`(플랜 A에서 만든 `web` 설정)으로 미리보기 서버를 켜고, 로컬 API 서버도 띄운다(`docs/LOCAL_DEVELOPMENT_RUNBOOK.md` 참고, 또는 플랜 A 실행 때 쓴 것과 동일하게 `PORT=8081 npm run api:dev` + `apps/web/.env`의 `VITE_API_BASE_URL=http://localhost:8081`).

플랜 A에서 만든 계정(`plan-a-test@example.com`)과 "플랜A 테스트 여행"을 그대로 재사용해도 되고, 새로 만들어도 된다.

1. `/manage/trips/:id/edit`에서 카드 6개가 전부 `→` 화살표와 함께 클릭 가능한 링크로 보이는지 확인.
2. "기본정보" 카드 클릭 → `/manage/trips/:id/edit/basic`로 이동, 여행명/날짜/여행자/메모 수정 폼이 보이고 저장이 실제로 반영되는지 확인(저장 후 "보기 화면으로" 눌러서 `/manage/trips/:id`에서 바뀐 제목이 보이는지까지 확인).
3. "장소" 카드 → 장소 하나 추가(예: 이름 "테스트 공항", 카테고리 "이동") → 목록에 바로 뜨는지 확인.
4. "항공편" 카드 → 항공편 하나 추가(출국, 출발/도착 공항, 날짜/시간 채워서) → 목록에 바로 뜨는지 확인.
5. "일정" 카드 → 방금 만든 장소를 연결한 일정 하나 추가 → 목록에 뜨는지 확인.
6. "체크리스트" 카드 → 커스텀 항목 하나 추가, 체크 토글 확인.
7. "공유 링크" 카드 → 공유 링크 생성 버튼 눌러서 링크가 만들어지는지 확인.
8. 각 편집 페이지 상단 "편집 허브로" 링크로 허브로 돌아오는지, 허브에서 "보기 화면으로" 링크로 `/manage/trips/:id`(탭형 UI)로 가는지, 거기서 방금 추가한 장소/항공편/일정/체크리스트가 실제로 보이는지 확인(플랜 A의 `useOwnerTripPageAdapter`가 이 데이터를 그대로 반영해야 한다).
9. `/manage/trips/:id/edit/nope`처럼 알 수 없는 section으로 직접 접근 시 편집 허브로 떨어지는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/App.tsx apps/web/src/features/manage/TripEditHubPage.tsx
git commit -m "feat(web): 편집 허브 카드를 카테고리별 편집 페이지로 연결"
```

---

## Task 4: 전체 검증 + PR

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 체크 실행**

Run: `npm run check`
Expected: typecheck, build, `go test`, `go test -race`, `go vet`, `gofmt` 전부 통과. 백엔드는 이 플랜에서 변경하지 않았으므로 Go 관련 항목은 항상 그린이어야 한다.

- [ ] **Step 2: 회귀 확인**

- `/manage` 목록 화면, `/manage/trips/:id` 보기 화면(플랜 A 결과물)이 여전히 정상 동작하는지 다시 확인한다.
- `/demo`, `/share/:token`은 이번 플랜에서 건드리지 않았으므로 영향 없다.

- [ ] **Step 3: 브랜치 push + PR**

```bash
git push -u origin feat/web-manage-edit-sections-plan-b
gh pr create --title "feat(web): 여행 편집 허브 카테고리별 페이지 연결 (플랜 B)" --body "$(cat <<'EOF'
## 변경 요약
- 플랜 A(#157)에서 "준비 중" 스텁으로 남겨뒀던 편집 허브(/manage/trips/:id/edit)의 카테고리 카드 6개를 실제 편집 페이지로 연결했습니다.
- 새 CRUD 로직은 없습니다 — 기존 giant form(SelectedTripDetailSection)이 쓰던 컴포넌트(TripBasicInfoForm, ManagePlaceCreateForm/List, ManageFlightCreateForm/List, ManageScheduleCreateForm/List, ManageChecklistSection, ManageShareActions, ChinaPaymentHelper)를 카테고리 하나만 보여주는 새 페이지(TripEditSectionPage)로 재배치했습니다.
- 라우트: /manage/trips/:id/edit/basic|places|flights|schedules|checklist|share
- 알 수 없는 section으로 접근하면 편집 허브로 되돌립니다.

## 관련 문서
- 설계: docs/superpowers/specs/2026-07-22-manage-view-edit-split-design.md
- 구현 계획: docs/superpowers/plans/2026-07-22-manage-edit-sections-plan-b.md

## 테스트
- npm run check 전체 통과
- 브라우저 수동 검증: 편집 허브 카드 6개 전부 진입 확인, 기본정보/장소/항공편/일정/체크리스트/공유링크 각각 실제 생성·수정 동작 확인, 보기 화면(/manage/trips/:id)에 반영되는지 확인, 알 수 없는 section 접근 시 허브로 폴백 확인
EOF
)"
```

---

## Self-Review 메모

- **스펙 커버리지:** `docs/superpowers/specs/2026-07-22-manage-view-edit-split-design.md`의 "개별 편집 페이지" 표(basic/places/flights/schedules/checklist/share ↔ 컴포넌트 매핑)를 Task 2에서 그대로 구현했다. "각 편집 페이지 상단에 편집 허브로 돌아가는 링크"도 포함했다.
- **타입 일관성:** `EditSection` 값(`"basic" | "places" | "flights" | "schedules" | "checklist" | "share"`)은 Task 1(파서), Task 2(`TripEditSectionPage`의 `sectionLabels`/분기), Task 3(`TripEditHubPage`의 `editCategories`) 세 곳에서 동일한 리터럴 문자열을 쓴다 — 오타가 나면 TypeScript가 타입체크 단계에서 바로 잡아준다(리터럴 유니언이므로).
- **플레이스홀더 없음:** 모든 단계에 실행 가능한 전체 코드/명령을 넣었다.
