# 여행 관리 화면 개편 — 플랜 A (라우팅 + 보기 화면 + 목록 전용화) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/manage`를 목록/생성 전용 화면으로 줄이고, "관리하기"를 누르면 `/manage/trips/:id`에서 `/demo`와 같은 탭형 UI(오늘/전체 일정/항공/지도/긴급/마이페이지)로 실제 여행 데이터를 볼 수 있게 하며, 마이페이지 탭에서 편집 허브(`/manage/trips/:id/edit`, 카테고리 카드 뿐인 스텁)로 이동하는 진입점을 만든다.

**Architecture:** 새 페이지들은 기존 `<a href>` 전체 페이지 이동 방식을 그대로 따른다(클라이언트 라우터 없음). 보기 화면과 편집 허브는 새 API 페칭 코드를 작성하지 않고, 이미 존재하는 `useTripManageController`(로그인 세션 검증 + 여행 목록/일정/장소/항공/체크리스트 CRUD)를 그대로 재사용해 URL의 tripId로 여행을 자동 선택시킨 뒤, 그 결과를 `TripPage`가 요구하는 `TripPageProps` 모양으로 변환하는 얇은 어댑터 계층만 새로 만든다. 백엔드 변경은 없다(단건 조회 API를 새로 만들지 않고 이미 있는 `listMyTrips` 목록에서 tripId로 찾는다).

**Tech Stack:** React 19 + TypeScript(`apps/web`), Vite. 이 저장소의 `apps/web`에는 JS/TS 단위 테스트 러너가 없다(`package.json`에 test 스크립트 없음). 따라서 각 프론트엔드 작업의 "테스트" 단계는 `npm run web:typecheck` + `npm run web:build` + 브라우저로 직접 확인하는 방식이며, 이는 이 저장소의 기존 관례를 그대로 따르는 것이다.

## Global Constraints

- 백엔드(`apps/api`)는 변경하지 않는다. 새 REST 엔드포인트를 추가하지 않는다.
- `/demo`, `/share/:token`, `StartPage`는 변경하지 않는다(단, `MyPageTab.tsx`의 인증 정보 읽기 버그 수정과 `editTripHref` prop 추가는 `/demo`에도 적용되지만 `editTripHref`를 넘기지 않으므로 `/demo`의 렌더 결과는 그대로다).
- 페이지 이동은 전부 `<a href="...">` 전체 페이지 이동이다. `history.pushState` 기반 클라이언트 라우팅을 새로 도입하지 않는다.
- 매 작업 후 `npm run web:typecheck`와 `npm run web:build`가 통과해야 한다(저장소 루트에서 실행).
- 커밋 메시지는 이 저장소의 기존 스타일(`fix(web): ...`, `feat(web): ...` 등 Conventional Commits + 한글 설명)을 따른다.

## 시작 전

`origin/main`에서 새 브랜치를 딴다:

```bash
cd /Users/hanjeonghyun/dev/for_Kagoshima_travel
git fetch origin
git checkout -b feat/web-manage-view-plan-a origin/main
```

이후 모든 Task는 이 브랜치 위에서 진행하고, Task 9에서 이 브랜치를 push해 PR을 연다.

---

## Task 1: 여행 관리 하위 경로 파서

**Files:**
- Create: `apps/web/src/shared/manageRoute.ts`

**Interfaces:**
- Consumes: 없음 (순수 함수, 외부 의존성 없음)
- Produces: `parseManageRoute(pathname: string): ManageRoute` — `ManageRoute`는 `{ view: "list" } | { view: "trip"; tripId: string } | { view: "editHub"; tripId: string }`.이후 Task 7(`App.tsx` 라우팅)과 Task 5/6(페이지 컴포넌트)에서 이 타입과 함수를 그대로 가져다 쓴다.

- [ ] **Step 1: 파일 작성**

```typescript
// apps/web/src/shared/manageRoute.ts

export type ManageRoute =
  | { view: "list" }
  | { view: "trip"; tripId: string }
  | { view: "editHub"; tripId: string };

// "/manage/trips/:id/edit" -> 편집 허브, "/manage/trips/:id" -> 보기 화면,
// 그 외 "/manage"로 시작하는 모든 경로 -> 목록 화면.
export function parseManageRoute(pathname: string): ManageRoute {
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
Expected: 에러 없음 (새 파일은 아직 아무 곳에서도 import되지 않으므로 기존 빌드에 영향 없음).

- [ ] **Step 3: 수동 검증**

이 파일은 아직 어디서도 쓰이지 않으므로 브라우저 검증은 생략하고, 아래 케이스를 node로 직접 실행해 파서 동작만 눈으로 확인한다.

Run:
```bash
cd apps/web && npx tsx -e "
import { parseManageRoute } from './src/shared/manageRoute';
console.log(parseManageRoute('/manage'));
console.log(parseManageRoute('/manage/trips/abc-123'));
console.log(parseManageRoute('/manage/trips/abc-123/'));
console.log(parseManageRoute('/manage/trips/abc-123/edit'));
console.log(parseManageRoute('/manage/trips/abc-123/edit/places'));
"
```
Expected output (마지막 줄은 `edit/places`처럼 하위 섹션까지 붙으면 `editHub` 정규식에 안 걸리므로 `list`로 떨어짐 — 이 경로는 플랜 B에서 다룬다. 지금은 이 동작이 맞다):
```
{ view: 'list' }
{ view: 'trip', tripId: 'abc-123' }
{ view: 'trip', tripId: 'abc-123' }
{ view: 'editHub', tripId: 'abc-123' }
{ view: 'list' }
```

만약 `npx tsx`가 설치되어 있지 않다면 `npm --prefix apps/web install -D tsx` 없이, 대신 임시로 이 스텝만 `node -e`로 실행 가능한 컴파일된 JS를 쓰지 말고 typecheck 통과만으로 충분하다고 보고 이 스텝은 생략해도 된다(파서 로직은 Task 7에서 실제 라우팅에 연결된 뒤 브라우저로 다시 검증되므로 이중 확인이다).

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/shared/manageRoute.ts
git commit -m "feat(web): /manage 하위 경로(보기/편집 허브) 파서 추가"
```

---

## Task 2: 소유자 여행 데이터 → 보기 화면 데이터 변환 유틸

**Files:**
- Create: `apps/web/src/features/trip/ownerTripAdapter.ts`

**Interfaces:**
- Consumes: `SharedFlight`, `SharedPlace`, `SharedSchedule` (from `apps/web/src/api/trips.ts`), `ChecklistItemResponse` (from `apps/web/src/api/checklist.ts`), `FlightInfo`, `Place`, `ScheduleItem`, `AccommodationInfo`, `ChecklistItem` (from `apps/web/src/types/travel.ts`), `getFlightDirectionLabel` (from `apps/web/src/shared/travelOptions.ts`)
- Produces: `mapOwnerFlight`, `mapOwnerPlace`, `mapOwnerSchedule`, `mapOwnerChecklistItem`, `deriveAccommodation`, `getOwnerPlaceById`, `getOwnerSchedulesForDate`, `getSavedOwnerTripDates`, `saveOwnerTripDates`, `getSavedOwnerScheduleCompletions`, `saveOwnerScheduleCompletions`, `getSavedOwnerScheduleOrder`, `saveOwnerScheduleOrder`. Task 4에서 전부 가져다 쓴다.

- [ ] **Step 1: 파일 작성**

```typescript
// apps/web/src/features/trip/ownerTripAdapter.ts
import type { ChecklistItemResponse } from "../../api/checklist";
import type { SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import { getFlightDirectionLabel } from "../../shared/travelOptions";
import type {
  AccommodationInfo,
  ChecklistItem,
  FlightInfo,
  Place,
  PlaceCategory,
  ScheduleItem,
  ScheduleType,
} from "../../types/travel";
import type { ScheduleOrderByDate } from "./tripViewState";
import type { TripDates } from "../../shared/date";

// --- API 응답 -> 탭 UI가 쓰는 타입으로 변환 (전부 순수 함수) ---

export function mapOwnerFlight(flight: SharedFlight): FlightInfo {
  return {
    id: flight.id,
    label: getFlightDirectionLabel(flight.direction),
    airline: flight.airline,
    flightNumber: flight.flightNumber,
    date: flight.departureDate,
    time: flight.departureTime,
    memo: flight.memo,
  };
}

export function mapOwnerPlace(place: SharedPlace): Place {
  return {
    id: place.id,
    name: place.name,
    category: place.category as PlaceCategory,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    googleMapsUrl: place.googleMapsUrl,
    recommendedReason: place.recommendedReason,
  };
}

export function mapOwnerSchedule(schedule: SharedSchedule): ScheduleItem {
  return {
    id: schedule.id,
    date: schedule.date,
    time: schedule.time,
    type: schedule.type as ScheduleType,
    title: schedule.title,
    placeId: schedule.placeId,
    transportMemo: schedule.transportMemo,
    guideMemo: schedule.guideMemo,
  };
}

export function mapOwnerChecklistItem(item: ChecklistItemResponse): ChecklistItem {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    destinationCountry: item.destinationCountry,
  };
}

// 숙소 정보는 별도 API가 없고, category가 "hotel"인 장소에서 이름/주소만 가져온다.
// 체크인/체크아웃/전화번호는 백엔드 스키마에 없는 필드라 안내 문구로 대체한다(기존 샘플 데이터와 동일한 관례).
export function deriveAccommodation(places: Place[]): AccommodationInfo {
  const hotel = places.find((place) => place.category === "hotel");
  if (!hotel) {
    return {
      name: "숙소 정보 미입력",
      address: "장소 관리에서 숙소를 등록하면 여기에 표시됩니다.",
      checkIn: "체크인 시간 확인 필요",
      checkOut: "체크아웃 시간 확인 필요",
    };
  }
  return {
    name: hotel.name,
    address: hotel.address || "숙소 주소 미입력",
    checkIn: "체크인 시간 확인 필요",
    checkOut: "체크아웃 시간 확인 필요",
    memo: hotel.recommendedReason,
  };
}

export function getOwnerPlaceById(placeId: string | undefined, places: Place[]): Place | undefined {
  return places.find((place) => place.id === placeId);
}

export function getOwnerSchedulesForDate(
  date: string,
  schedules: ScheduleItem[],
  orderByDate: ScheduleOrderByDate
): ScheduleItem[] {
  const baseSchedules = schedules.filter((item) => item.date === date);
  const order = orderByDate[date];
  if (!order) return baseSchedules;

  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return [...baseSchedules].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

// --- 여행별(namespaced) 로컬 개인 설정 저장소 ---
// 실제 여행 데이터(DB)는 건드리지 않는, 이 브라우저에서만 보이는 표시용 조정값이다.
// /demo가 쓰는 tripViewState.ts의 저장 키와 절대 겹치지 않도록 트립 ID를 접두어로 넣는다.

function isDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getSavedOwnerTripDates(tripId: string, fallback: TripDates): TripDates {
  const saved = window.localStorage.getItem(`owner-trip-${tripId}-dates`);
  try {
    const parsed = saved ? JSON.parse(saved) : fallback;
    return isDateValue(parsed?.startDate) && isDateValue(parsed?.endDate) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveOwnerTripDates(tripId: string, dates: TripDates) {
  window.localStorage.setItem(`owner-trip-${tripId}-dates`, JSON.stringify(dates));
}

export function getSavedOwnerScheduleCompletions(tripId: string): Record<string, boolean> {
  const saved = window.localStorage.getItem(`owner-trip-${tripId}-schedule-completions`);
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean")
    );
  } catch {
    return {};
  }
}

export function saveOwnerScheduleCompletions(tripId: string, completions: Record<string, boolean>) {
  window.localStorage.setItem(`owner-trip-${tripId}-schedule-completions`, JSON.stringify(completions));
}

export function getSavedOwnerScheduleOrder(tripId: string): ScheduleOrderByDate {
  const saved = window.localStorage.getItem(`owner-trip-${tripId}-schedule-order`);
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]))
    );
  } catch {
    return {};
  }
}

export function saveOwnerScheduleOrder(tripId: string, orderByDate: ScheduleOrderByDate) {
  window.localStorage.setItem(`owner-trip-${tripId}-schedule-order`, JSON.stringify(orderByDate));
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run web:typecheck`
Expected: 에러 없음. (`ScheduleType`, `PlaceCategory`가 `types/travel.ts`에서 export되어 있는지 확인 — 이미 export되어 있음, `apps/web/src/types/travel.ts:1`, `:3`)

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/trip/ownerTripAdapter.ts
git commit -m "feat(web): 실제 여행 데이터를 보기 화면 타입으로 변환하는 어댑터 유틸 추가"
```

---

## Task 3: `TripPageProps`에 편집 진입점 추가 + `MyPageTab` 인증 정보 버그 수정

`MyPageTab.tsx`는 현재 `localStorage.getItem("accessToken")`과 `localStorage.getItem("userEmail")`을 직접 읽는다. 하지만 로그인 시 실제로 저장되는 키는 `travel-app-owner-auth`(JSON 객체, `apps/web/src/features/manage/ownerAuthStorage.ts:3`)이고 `accessToken`/`userEmail`이라는 키는 이 코드베이스 어디에서도 저장된 적이 없다. 즉 마이페이지의 비밀번호 변경은 지금도 항상 빈 토큰으로 요청을 보내 실패하는 버그다. 이번 작업에서 보기 화면에 마이페이지 탭을 그대로 재사용하므로, 이 버그를 먼저 고친다.

**Files:**
- Modify: `apps/web/src/features/trip/tripPageTypes.ts`
- Modify: `apps/web/src/features/trip/components/MyPageTab.tsx`

**Interfaces:**
- Consumes: `getSavedOwnerAuth` (from `apps/web/src/features/manage/ownerAuthStorage.ts`, 이미 존재)
- Produces: `TripPageProps.editTripHref?: string` — Task 4에서 보기 화면 어댑터가 이 필드에 `/manage/trips/:id/edit`를 채워 넣는다. `/demo`는 이 필드를 넘기지 않으므로 `undefined`로 유지된다.

- [ ] **Step 1: `tripPageTypes.ts`에 필드 추가**

`apps/web/src/features/trip/tripPageTypes.ts`에서 `TripPageProps` 타입 마지막에 필드를 추가한다:

```typescript
export type TripPageProps = {
  accommodation: AccommodationInfo;
  activeTab: Tab;
  addressCopied: boolean;
  allChecklist: ChecklistItem[];
  checkedItems: Record<string, boolean>;
  completedCount: number;
  completedScheduleCount: number;
  completedSchedules: Record<string, boolean>;
  contentRef: RefObject<HTMLDivElement | null>;
  dates: string[];
  editTripHref?: string;
  emergencies: EmergencyInfo[];
  flights: FlightInfo[];
  focusCompletedScheduleCount: number;
  focusSchedules: ScheduleItem[];
  getDisplayDate: (dateStr: string) => string;
  getMapUrl: (place?: Place) => string;
  getPlace: (placeId?: string) => Place | undefined;
  groupedChecklist: Array<{ category: ChecklistCategory; label: string; items: ChecklistItem[] }>;
  hiddenChecklistIDs: string[];
  homeChecklistCompletedCount: number;
  homeChecklistItems: ChecklistItem[];
  isChecklistEditing: boolean;
  newChecklistCategory: ChecklistCategory;
  newChecklistTitle: string;
  nextSchedule: ScheduleItem;
  phrases: UsefulPhrase[];
  places: Place[];
  routes: RecommendedRoute[];
  selectedDate: string;
  selectedSchedules: ScheduleItem[];
  trip: Trip;
  tripDates: TripDates;
  travelStatus: { phase: string; label: string; description: string };
  addChecklistItem: (event: FormEvent<HTMLFormElement>) => void;
  copyAccommodationAddress: () => void;
  moveSchedule: (scheduleID: string, direction: "up" | "down") => void;
  removeChecklistItem: (item: ChecklistItem) => void;
  restoreDefaultChecklistItems: () => void;
  setActiveTab: (tab: Tab) => void;
  setIsChecklistEditing: (value: boolean) => void;
  setNewChecklistCategory: (category: ChecklistCategory) => void;
  setNewChecklistTitle: (title: string) => void;
  setSelectedDate: (date: string) => void;
  toggleCheck: (id: string) => void;
  toggleScheduleComplete: (id: string) => void;
  updateTripDate: (field: "startDate" | "endDate", value: string) => void;
};
```

(위치는 알파벳 순서를 대략 따르는 기존 관례에 맞춰 `dates` 다음, `emergencies` 앞에 `editTripHref?: string`을 끼워 넣은 것 — 필드 순서 자체는 타입 동작에 영향 없다.)

- [ ] **Step 2: `MyPageTab.tsx` 수정**

`apps/web/src/features/trip/components/MyPageTab.tsx` 전체를 아래로 교체한다.

```tsx
import { useState } from "react";
import { Key, Eye, EyeOff, Lock, User, LogOut, Settings2 } from "lucide-react";
import type { TripPageProps } from "../tripPageTypes";
import { changePassword } from "../../../api/auth";
import { getSavedOwnerAuth } from "../../manage/ownerAuthStorage";

type MyPageTabProps = TripPageProps & {
  onLogout?: () => void;
};

export function MyPageTab({ trip, onLogout, editTripHref }: MyPageTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const savedAuth = getSavedOwnerAuth();

  // 사용자가 마이페이지에서 기존 비밀번호와 새 비밀번호를 입력해 비밀번호 변경을 요청하는 핸들러입니다.
  // api/auth.ts 내 공통화된 통신 함수를 호출하여 주소 오타를 차단하고, catch 블록에서 세부 에러를 매핑합니다.
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(newPassword)) {
      setError("새 비밀번호는 영문 대/소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함하여 8자 이상이어야 합니다.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const token = savedAuth?.accessToken ?? "";
      await changePassword(token, currentPassword, newPassword);

      setMessage("비밀번호가 성공적으로 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      // ApiError에서 맵핑된 HTTP status 코드를 기반으로, 세부 원인을 구체적으로 설명합니다.
      if (err.status === 400) {
        setError("현재 사용 중인 비밀번호가 일치하지 않거나 입력 규격이 잘못되었습니다.");
      } else if (err.status === 401) {
        setError("로그인 세션이 만료되었습니다. 다시 로그인한 뒤 변경을 시도해 주세요.");
      } else if (err.status === 404) {
        setError("존재하지 않거나 삭제된 사용자 정보입니다.");
      } else {
        setError(err.message || "서버 통신 오류가 발생했습니다. 네트워크 상태를 확인해 주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.reload();
    }
  };

  return (
    <section className="screen">
      <h1>마이페이지</h1>
      <p className="muted">내 계정 정보 관리 및 비밀번호 변경을 지원합니다.</p>

      <article className="info-card auth-card-premium" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(28, 50, 37, 0.05)" }}>
          <div className="auth-brand-circle" style={{ width: "40px", height: "40px" }}>
            <User size={20} />
          </div>
          <div>
            <span style={{ display: "block", fontSize: "11px", color: "var(--c-muted)", fontWeight: 700 }}>접속 계정</span>
            <strong style={{ fontSize: "15px", color: "var(--c-text)" }}>{savedAuth?.user.email ?? "인증된 사용자"}</strong>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
          <span className="pill subtle">여정 관리자</span>
          <button
            className="secondary-button compact-button"
            onClick={handleLogoutClick}
            type="button"
            style={{ color: "var(--c-muted)", border: "1px solid rgba(28, 50, 37, 0.1)" }}
          >
            <LogOut size={14} style={{ marginRight: "4px" }} />
            로그아웃
          </button>
        </div>
      </article>

      {editTripHref && (
        <article className="info-card" style={{ marginBottom: "16px" }}>
          <h2>{trip.title}</h2>
          <p className="muted">이 여행의 기본정보, 장소, 항공편, 일정, 체크리스트를 편집합니다.</p>
          <a className="primary-button" href={editTripHref} style={{ marginTop: "8px" }}>
            <Settings2 size={18} />
            이 여행 편집하기
          </a>
        </article>
      )}

      <section className="section-block">
        <h2>비밀번호 변경</h2>
        <form className="auth-form auth-card-premium" onSubmit={handlePasswordChange} style={{ background: "var(--c-surface)" }}>
          <label className="auth-field-label">
            <span>현재 비밀번호</span>
            <div className="input-with-icon">
              <Key size={16} className="field-icon" />
              <input
                className="with-password-toggle"
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호 입력"
                required
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
              />
              <button
                className="password-toggle-btn"
                onClick={() => setShowCurrent(!showCurrent)}
                type="button"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label className="auth-field-label" style={{ marginTop: "12px" }}>
            <span>새 비밀번호</span>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                className="with-password-toggle"
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8자 이상 입력"
                required
                type={showNew ? "text" : "password"}
                value={newPassword}
              />
              <button
                className="password-toggle-btn"
                onClick={() => setShowNew(!showNew)}
                type="button"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {newPassword && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(newPassword) && (
            <p className="form-error" style={{ fontSize: "11px", marginTop: "4px", color: "var(--c-muted)", paddingLeft: "42px" }}>
              ⚠️ 영문 대/소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함해야 합니다.
            </p>
          )}

          <label className="auth-field-label" style={{ marginTop: "12px" }}>
            <span>새 비밀번호 확인</span>
            <div className="input-with-icon">
              <Lock size={16} className="field-icon" />
              <input
                className="with-password-toggle"
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호 다시 입력"
                required
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
              />
              <button
                className="password-toggle-btn"
                onClick={() => setShowConfirm(!showConfirm)}
                type="button"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && <p className="form-error" style={{ marginTop: "8px" }}>{error}</p>}
          {message && <p style={{ color: "var(--c-green)", fontSize: "13px", fontWeight: 700, marginTop: "8px" }}>{message}</p>}

          <button className="primary-button" disabled={submitting} type="submit" style={{ marginTop: "16px" }}>
            비밀번호 변경 완료
          </button>
        </form>
      </section>
    </section>
  );
}
```

변경 요약: `localStorage.getItem("accessToken"/"userEmail")` 직접 읽기 제거 → `getSavedOwnerAuth()` 사용. `handleLogoutClick`의 폴백 분기에서도 존재한 적 없는 `"accessToken"` 키 제거(원래 `onLogout`이 항상 넘어오는 실제 사용 경로에서는 이 폴백이 실행되지 않는다). `editTripHref`가 있을 때만 "이 여행 편집하기" 카드를 추가로 렌더링 — `/demo`는 이 prop을 넘기지 않으므로 화면에 아무 변화가 없다.

- [ ] **Step 3: 타입체크 + 빌드**

Run: `npm run web:typecheck && npm run web:build`
Expected: 에러 없음.

- [ ] **Step 4: 브라우저로 `/demo` 회귀 확인**

`.claude/launch.json`이 `apps/for_Kagoshima_travel`을 가리키도록 이미 설정돼 있다면 재사용하고, 없다면 아래로 만든다(`--prefix`로 실제 저장소 경로를 지정 — 이 세션의 작업 디렉터리인 `cowork`가 아니라 `for_Kagoshima_travel` 저장소를 가리켜야 한다):

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "web",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["--prefix", "/Users/hanjeonghyun/dev/for_Kagoshima_travel", "run", "web:dev"],
      "port": 5173
    }
  ]
}
```

미리보기 서버를 켜고 `/demo`로 들어가 마이페이지 탭을 확인한다. "이 여행 편집하기" 카드가 보이면 안 되고(로그인 안 한 상태이므로 `savedAuth`가 null → "인증된 사용자"로 표시), 비밀번호 변경 폼과 로그아웃 버튼은 이전과 동일하게 보여야 한다.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/features/trip/tripPageTypes.ts apps/web/src/features/trip/components/MyPageTab.tsx
git commit -m "fix(web): 마이페이지 계정 정보가 잘못된 localStorage 키를 읽던 버그 수정 및 편집 진입점 필드 추가"
```

---

## Task 4: 보기 화면 데이터 어댑터 훅

`useTripManageController`가 이미 인증/여행목록/일정/장소/항공/체크리스트를 전부 갖고 있으므로, 이 훅은 새로 API를 호출하지 않고 그 결과값들을 받아 `TripPageProps` 모양으로 조립하기만 한다.

**Files:**
- Create: `apps/web/src/features/trip/useOwnerTripPageAdapter.ts`

**Interfaces:**
- Consumes:
  - `selectedOwnerTrip: OwnerTrip | null`, `ownerSchedules: SharedSchedule[]`, `ownerPlaces: SharedPlace[]`, `ownerFlights: SharedFlight[]` (모두 `apps/web/src/api/trips.ts`의 타입)
  - `checklistItems: ChecklistItemResponse[]`, `onToggleChecklistItem: (id: string, isCompleted: boolean) => void`, `onAddChecklistItem: (e: FormEvent<HTMLFormElement>) => void`, `onDeleteChecklistItem: (id: string) => void`, `newChecklistTitle: string`, `newChecklistCategory`, `onNewChecklistTitleChange`, `onNewChecklistCategoryChange` (모두 `useTripManageController`가 이미 반환하는 값들 — `apps/web/src/features/manage/manageTypes.ts`의 `SelectedTripDetailSectionProps` 참고)
  - `editTripHref: string` (Task 5가 `/manage/trips/:id/edit` 문자열을 만들어 넘긴다)
- Produces: `useOwnerTripPageAdapter(params): TripPageProps` — Task 5(`OwnerTripViewPage.tsx`)가 이 결과를 그대로 `<TripPage {...result} />`에 스프레드한다.

- [ ] **Step 1: 파일 작성**

```typescript
// apps/web/src/features/trip/useOwnerTripPageAdapter.ts
import { useMemo, useRef, useState, type FormEvent } from "react";
import type { ChecklistItemResponse } from "../../api/checklist";
import type { OwnerTrip, SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import {
  clampDate,
  getDateOffset,
  getTodayDateString,
  getTravelStatus,
  shiftDate,
  type TripDates,
} from "../../shared/date";
import { checklistCategories } from "../../shared/travelOptions";
import { emergencies, phrases } from "../../data/sampleTrip";
import type { ChecklistItem, ScheduleItem } from "../../types/travel";
import {
  deriveAccommodation,
  getOwnerPlaceById,
  getOwnerSchedulesForDate,
  getSavedOwnerScheduleCompletions,
  getSavedOwnerScheduleOrder,
  getSavedOwnerTripDates,
  mapOwnerChecklistItem,
  mapOwnerFlight,
  mapOwnerPlace,
  mapOwnerSchedule,
  saveOwnerScheduleCompletions,
  saveOwnerScheduleOrder,
  saveOwnerTripDates,
} from "./ownerTripAdapter";
import type { TripPageProps } from "./tripPageTypes";
import type { ChecklistCategory, ScheduleOrderByDate, Tab } from "./tripViewState";

type UseOwnerTripPageAdapterParams = {
  selectedOwnerTrip: OwnerTrip;
  ownerSchedules: SharedSchedule[];
  ownerPlaces: SharedPlace[];
  ownerFlights: SharedFlight[];
  checklistItems: ChecklistItemResponse[];
  newChecklistTitle: string;
  newChecklistCategory: ChecklistCategory;
  onNewChecklistTitleChange: (value: string) => void;
  onNewChecklistCategoryChange: (value: ChecklistCategory) => void;
  onAddChecklistItem: (event: FormEvent<HTMLFormElement>) => void;
  onToggleChecklistItem: (itemID: string, isCompleted: boolean) => void;
  onDeleteChecklistItem: (itemID: string) => void;
  editTripHref: string;
};

const FALLBACK_SCHEDULE_ID = "__owner-trip-no-schedule__";

// 실제 소유자 여행 데이터를 /demo와 동일한 TripPage가 요구하는 props 모양으로 조립한다.
// 새 API 호출은 하지 않는다 — 인자로 받은 값은 전부 useTripManageController가 이미 불러온 것이다.
export function useOwnerTripPageAdapter({
  selectedOwnerTrip,
  ownerSchedules,
  ownerPlaces,
  ownerFlights,
  checklistItems,
  newChecklistTitle,
  newChecklistCategory,
  onNewChecklistTitleChange,
  onNewChecklistCategoryChange,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  editTripHref,
}: UseOwnerTripPageAdapterParams): TripPageProps {
  const contentRef = useRef<HTMLDivElement>(null);
  const tripId = selectedOwnerTrip.id;

  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [addressCopied, setAddressCopied] = useState(false);
  const [isChecklistEditing, setIsChecklistEditing] = useState(false);
  const [tripDates, setTripDatesState] = useState<TripDates>(() =>
    getSavedOwnerTripDates(tripId, { startDate: selectedOwnerTrip.startDate, endDate: selectedOwnerTrip.endDate })
  );
  const [completedSchedules, setCompletedSchedulesState] = useState<Record<string, boolean>>(() =>
    getSavedOwnerScheduleCompletions(tripId)
  );
  const [scheduleOrderByDate, setScheduleOrderByDateState] = useState<ScheduleOrderByDate>(() =>
    getSavedOwnerScheduleOrder(tripId)
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => ownerSchedules[0]?.date ?? selectedOwnerTrip.startDate);

  const trip = useMemo(
    () => ({
      title: selectedOwnerTrip.title,
      startDate: selectedOwnerTrip.startDate,
      endDate: selectedOwnerTrip.endDate,
      travelers: selectedOwnerTrip.travelers,
      destinationCountry: selectedOwnerTrip.destinationCountry,
      memo: selectedOwnerTrip.memo,
    }),
    [selectedOwnerTrip]
  );

  const schedules = useMemo(() => ownerSchedules.map(mapOwnerSchedule), [ownerSchedules]);
  const places = useMemo(() => ownerPlaces.map(mapOwnerPlace), [ownerPlaces]);
  const flights = useMemo(() => ownerFlights.map(mapOwnerFlight), [ownerFlights]);
  const allChecklist = useMemo(() => checklistItems.map(mapOwnerChecklistItem), [checklistItems]);
  const checkedItems = useMemo(
    () => Object.fromEntries(checklistItems.map((item) => [item.id, item.isCompleted])),
    [checklistItems]
  );
  const accommodation = useMemo(() => deriveAccommodation(places), [places]);

  const dates = useMemo(() => Array.from(new Set(schedules.map((item) => item.date))), [schedules]);
  const selectedSchedules = useMemo(
    () => getOwnerSchedulesForDate(selectedDate, schedules, scheduleOrderByDate),
    [selectedDate, schedules, scheduleOrderByDate]
  );
  const completedScheduleCount = selectedSchedules.filter((item) => completedSchedules[item.id]).length;
  const completedCount = allChecklist.filter((item) => checkedItems[item.id]).length;

  const today = getTodayDateString();
  const travelStatus = getTravelStatus(today, tripDates);
  const displayFocusDate = clampDate(today, tripDates.startDate, tripDates.endDate);
  const focusDateOffset = getDateOffset(tripDates.startDate, displayFocusDate);
  const focusScheduleDate = shiftDate(trip.startDate, focusDateOffset);
  const focusSchedules = useMemo(
    () => getOwnerSchedulesForDate(focusScheduleDate, schedules, scheduleOrderByDate),
    [focusScheduleDate, schedules, scheduleOrderByDate]
  );
  const fallbackSchedule: ScheduleItem = {
    id: FALLBACK_SCHEDULE_ID,
    date: trip.startDate,
    time: "",
    type: "etc",
    title: "등록된 일정이 없습니다",
    guideMemo: "편집 화면에서 일정을 추가해보세요.",
  };
  const nextSchedule =
    focusSchedules.find((item) => !completedSchedules[item.id]) ??
    schedules.find((item) => !completedSchedules[item.id]) ??
    schedules[0] ??
    fallbackSchedule;
  const focusCompletedScheduleCount = focusSchedules.filter((item) => completedSchedules[item.id]).length;

  const homeChecklistCategories: ChecklistCategory[] =
    travelStatus.phase === "before" ? ["before", "airport"] : travelStatus.phase === "during" ? ["daily"] : ["return"];
  const homeChecklistItems = allChecklist.filter((item) => homeChecklistCategories.includes(item.category)).slice(0, 4);
  const homeChecklistCompletedCount = homeChecklistItems.filter((item) => checkedItems[item.id]).length;
  const groupedChecklist = useMemo(
    () =>
      checklistCategories
        .map(([category, label]) => ({
          category,
          label,
          items: allChecklist.filter((item) => item.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [allChecklist]
  );

  function getDisplayDate(dateStr: string) {
    return shiftDate(tripDates.startDate, getDateOffset(trip.startDate, dateStr));
  }

  function getMapUrl(place?: { latitude?: number; longitude?: number; address?: string; name?: string }) {
    const destination =
      place?.latitude && place?.longitude
        ? `${place.latitude},${place.longitude}`
        : place?.address || place?.name || "여행지";
    return `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${encodeURIComponent(destination)}`;
  }

  function getPlace(placeId?: string) {
    return getOwnerPlaceById(placeId, places);
  }

  function updateTripDate(field: "startDate" | "endDate", value: string) {
    if (!value) return;
    const next = { ...tripDates, [field]: value };
    if (next.endDate < next.startDate) {
      next.endDate = next.startDate;
    }
    setTripDatesState(next);
    saveOwnerTripDates(tripId, next);
  }

  function copyAccommodationAddress() {
    navigator.clipboard
      ?.writeText(accommodation.address)
      .then(() => {
        setAddressCopied(true);
        window.setTimeout(() => setAddressCopied(false), 2000);
      })
      .catch(() => {});
  }

  function toggleCheck(id: string) {
    const item = checklistItems.find((checklistItem) => checklistItem.id === id);
    if (!item) return;
    onToggleChecklistItem(id, !item.isCompleted);
  }

  function removeChecklistItem(item: ChecklistItem) {
    onDeleteChecklistItem(item.id);
  }

  // 기본 체크리스트 "숨김/복원" 개념은 실제 데이터 모델에 없다(항목은 삭제로만 없앤다).
  function restoreDefaultChecklistItems() {}

  function toggleScheduleComplete(id: string) {
    const next = { ...completedSchedules, [id]: !completedSchedules[id] };
    setCompletedSchedulesState(next);
    saveOwnerScheduleCompletions(tripId, next);
  }

  function moveSchedule(scheduleID: string, direction: "up" | "down") {
    const currentOrder = selectedSchedules.map((item) => item.id);
    const currentIndex = currentOrder.indexOf(scheduleID);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentOrder.length) return;

    const nextOrder = [...currentOrder];
    [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
    const nextOrderByDate = { ...scheduleOrderByDate, [selectedDate]: nextOrder };
    setScheduleOrderByDateState(nextOrderByDate);
    saveOwnerScheduleOrder(tripId, nextOrderByDate);
  }

  return {
    accommodation,
    activeTab,
    addressCopied,
    allChecklist,
    checkedItems,
    completedCount,
    completedScheduleCount,
    completedSchedules,
    contentRef,
    dates,
    editTripHref,
    emergencies,
    flights,
    focusCompletedScheduleCount,
    focusSchedules,
    getDisplayDate,
    getMapUrl,
    getPlace,
    groupedChecklist,
    hiddenChecklistIDs: [],
    homeChecklistCompletedCount,
    homeChecklistItems,
    isChecklistEditing,
    newChecklistCategory,
    newChecklistTitle,
    nextSchedule,
    phrases,
    places,
    routes: [],
    selectedDate,
    selectedSchedules,
    trip,
    tripDates,
    travelStatus,
    addChecklistItem: onAddChecklistItem,
    copyAccommodationAddress,
    moveSchedule,
    removeChecklistItem,
    restoreDefaultChecklistItems,
    setActiveTab,
    setIsChecklistEditing,
    setNewChecklistCategory: onNewChecklistCategoryChange,
    setNewChecklistTitle: onNewChecklistTitleChange,
    setSelectedDate,
    toggleCheck,
    toggleScheduleComplete,
    updateTripDate,
  };
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run web:typecheck`
Expected: 에러 없음. (`emergencies`, `phrases`를 `data/sampleTrip.ts`에서 import하는 부분에서 타입 에러가 나면, `apps/web/src/data/sampleTrip.ts:51`, `:218`에 실제로 export되어 있는지 다시 확인 — 이미 export되어 있음)

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/trip/useOwnerTripPageAdapter.ts
git commit -m "feat(web): useTripManageController 데이터를 TripPageProps로 변환하는 어댑터 훅 추가"
```

---

## Task 5: 보기 화면 페이지 (`/manage/trips/:id`)

**Files:**
- Create: `apps/web/src/features/trip/OwnerTripViewPage.tsx`

**Interfaces:**
- Consumes: `useTripManageController` (`apps/web/src/features/manage/useTripManageController.ts`, 이미 존재), `useOwnerTripPageAdapter` (Task 4), `TripPage` (`apps/web/src/features/trip/TripPage.tsx`, 이미 존재), `ManageAuthSection` (`apps/web/src/features/manage/components/ManageAuthSection.tsx`, 이미 존재)
- Produces: `OwnerTripViewPage({ tripId }: { tripId: string })` — Task 7에서 `App.tsx`가 `parseManageRoute` 결과가 `{ view: "trip", tripId }`일 때 렌더링한다.

- [ ] **Step 1: 파일 작성**

```tsx
// apps/web/src/features/trip/OwnerTripViewPage.tsx
import { useEffect } from "react";
import { Compass } from "lucide-react";
import { ManageAuthSection } from "../manage/components/ManageAuthSection";
import { useTripManageController } from "../manage/useTripManageController";
import { TripPage } from "./TripPage";
import { useOwnerTripPageAdapter } from "./useOwnerTripPageAdapter";

type OwnerTripViewPageProps = {
  tripId: string;
};

// "/manage/trips/:id" 진입점. useTripManageController가 이미 갖고 있는 인증/여행목록/상세데이터를
// tripId로 자동 선택시킨 뒤, TripPage(오늘/전체 일정/항공/지도/긴급/마이페이지 탭)로 그대로 넘긴다.
export function OwnerTripViewPage({ tripId }: OwnerTripViewPageProps) {
  const currentPath = window.location.pathname;
  const manage = useTripManageController({ currentPath, isLegacyOwnerRoute: false, isManageRoute: true });
  const {
    auth,
    authChecked,
    ownerTrips,
    ownerTripsLoading,
    selectedOwnerTrip,
    onSelectOwnerTrip,
    ownerDetailDataLoading,
    ownerDetailDataError,
    ownerSchedules,
    ownerPlaces,
    ownerFlights,
    checklistItems,
    checklistLoading,
    newChecklistTitle,
    newChecklistCategory,
    onNewChecklistTitleChange,
    onNewChecklistCategoryChange,
    onAddChecklistItem,
    onToggleChecklistItem,
    onDeleteChecklistItem,
    onLogout,
  } = manage;

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

  if (ownerTripsLoading || (!selectedOwnerTrip && ownerDetailDataLoading)) {
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

  if (ownerDetailDataLoading || checklistLoading) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen" style={{ display: "grid", placeItems: "center", gap: "10px", padding: "48px 0" }}>
              <Compass className="spin-slow" size={32} />
              <h1>{selectedOwnerTrip.title} 일정을 불러오는 중입니다</h1>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (ownerDetailDataError) {
    return (
      <main className="app-shell">
        <section className="phone-frame owner-frame">
          <div className="content">
            <section className="screen">
              <h1>여행 정보를 불러오지 못했습니다</h1>
              <p className="form-error">{ownerDetailDataError}</p>
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
    <OwnerTripViewContent
      checklistItems={checklistItems}
      editTripHref={`/manage/trips/${selectedOwnerTrip.id}/edit`}
      newChecklistCategory={newChecklistCategory}
      newChecklistTitle={newChecklistTitle}
      onAddChecklistItem={onAddChecklistItem}
      onDeleteChecklistItem={onDeleteChecklistItem}
      onLogout={onLogout}
      onNewChecklistCategoryChange={onNewChecklistCategoryChange}
      onNewChecklistTitleChange={onNewChecklistTitleChange}
      onToggleChecklistItem={onToggleChecklistItem}
      ownerFlights={ownerFlights}
      ownerPlaces={ownerPlaces}
      ownerSchedules={ownerSchedules}
      selectedOwnerTrip={selectedOwnerTrip}
    />
  );
}

type OwnerTripViewContentProps = Parameters<typeof useOwnerTripPageAdapter>[0] & {
  onLogout: () => void;
};

// useOwnerTripPageAdapter는 훅이라 早期 return 뒤에서 호출할 수 없으므로,
// "데이터 준비 완료" 상태만 들어오는 별도 컴포넌트로 분리해 훅 순서 규칙을 지킨다.
function OwnerTripViewContent({ onLogout, ...adapterParams }: OwnerTripViewContentProps) {
  const tripPageProps = useOwnerTripPageAdapter(adapterParams);
  return <TripPage {...tripPageProps} onLogout={onLogout} />;
}
```

- [ ] **Step 2: `TripPage.tsx`에 `onLogout` 전달 추가**

`TripPage.tsx`는 현재 `TripPageProps`만 받고 내부에서 `activeTab`에 따라 각 탭에 `{...props}`를 스프레드한다. `onLogout`은 `TripPageProps`에 없는 필드이므로, `OwnerTripViewPage`가 `<TripPage {...tripPageProps} onLogout={onLogout} />`처럼 넘겨도 `MyPageTab`까지 전달되게 하려면 `TripPage.tsx`도 `onLogout`을 받아 `MyPageTab`에 넘기도록 고쳐야 한다.

`apps/web/src/features/trip/TripPage.tsx` 전체를 아래로 교체한다:

```tsx
import { BottomTabs } from "./components/BottomTabs";
import { ConciergeTab } from "./components/ConciergeTab";
import { FlightTab } from "./components/FlightTab";
import { MapTab } from "./components/MapTab";
import { ScheduleTab } from "./components/ScheduleTab";
import { TodayTab } from "./components/TodayTab";
import { MyPageTab } from "./components/MyPageTab";
import type { TripPageProps } from "./tripPageTypes";

type TripPageComponentProps = TripPageProps & {
  onLogout?: () => void;
};

// 일반 여행 화면의 탭 컴포넌트를 조립한다. 상태 저장과 API 흐름은 App.tsx가 관리한다.
export function TripPage(props: TripPageComponentProps) {
  const { activeTab, contentRef, onLogout, setActiveTab } = props;

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <div className="content" ref={contentRef}>
          {activeTab === "today" && <TodayTab {...props} />}
          {activeTab === "schedule" && <ScheduleTab {...props} />}
          {activeTab === "flight" && <FlightTab {...props} />}
          {activeTab === "map" && <MapTab {...props} />}
          {activeTab === "concierge" && <ConciergeTab {...props} />}
          {activeTab === "mypage" && <MyPageTab {...props} onLogout={onLogout} />}
        </div>

        <BottomTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </section>
    </main>
  );
}
```

Step 2로 `TripPage`가 `onLogout`을 직접 받으므로, Step 1의 `OwnerTripViewContent`에서 `<TripPage {...tripPageProps} onLogout={onLogout} />` 호출은 그대로 유효하다.

- [ ] **Step 3: 타입체크 + 빌드**

Run: `npm run web:typecheck && npm run web:build`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/features/trip/OwnerTripViewPage.tsx apps/web/src/features/trip/TripPage.tsx
git commit -m "feat(web): 실제 여행 데이터를 탭형 UI로 보여주는 보기 화면(/manage/trips/:id) 추가"
```

(이 페이지는 Task 7에서 `App.tsx`에 라우팅이 연결되기 전까지는 어디서도 렌더링되지 않는다 — 브라우저 검증은 Task 7 이후에 함께 한다.)

---

## Task 6: 편집 허브 페이지 (`/manage/trips/:id/edit`, 스텁)

플랜 A 범위에서는 카테고리 카드만 보여준다. 각 카드가 실제 편집 페이지로 이동하는 것은 플랜 B에서 연결한다.

**Files:**
- Create: `apps/web/src/features/manage/TripEditHubPage.tsx`

**Interfaces:**
- Consumes: `useTripManageController` (이미 존재), `ManageAuthSection` (이미 존재)
- Produces: `TripEditHubPage({ tripId }: { tripId: string })` — Task 7에서 `parseManageRoute` 결과가 `{ view: "editHub", tripId }`일 때 렌더링한다.

- [ ] **Step 1: 파일 작성**

```tsx
// apps/web/src/features/manage/TripEditHubPage.tsx
import { useEffect } from "react";
import { Compass, Luggage, MapPin, Plane, CalendarDays, ListChecks, Link2 } from "lucide-react";
import { formatKoreanDate } from "../../shared/date";
import { ManageAuthSection } from "./components/ManageAuthSection";
import { useTripManageController } from "./useTripManageController";

type TripEditHubPageProps = {
  tripId: string;
};

const editCategories = [
  { icon: Luggage, label: "기본정보" },
  { icon: MapPin, label: "장소" },
  { icon: Plane, label: "항공편" },
  { icon: CalendarDays, label: "일정" },
  { icon: ListChecks, label: "체크리스트" },
  { icon: Link2, label: "공유 링크" },
] as const;

// "/manage/trips/:id/edit" 진입점. 카테고리별 실제 편집 페이지는 이후 별도 작업에서 연결한다.
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
              {editCategories.map(({ icon: Icon, label }) => (
                <article className="info-card" key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Icon size={20} />
                  <div style={{ flex: 1 }}>
                    <strong>{label}</strong>
                  </div>
                  <span className="pill subtle">준비 중</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: 타입체크**

Run: `npm run web:typecheck`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/features/manage/TripEditHubPage.tsx
git commit -m "feat(web): 여행 편집 허브(/manage/trips/:id/edit) 스텁 페이지 추가"
```

---

## Task 7: `App.tsx` 라우팅 연결

**Files:**
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Consumes: `parseManageRoute` (Task 1), `OwnerTripViewPage` (Task 5), `TripEditHubPage` (Task 6)

- [ ] **Step 1: `App.tsx` 전체 교체**

```tsx
// apps/web/src/App.tsx
import { TripManagePage } from "./features/manage/TripManagePage";
import { TripEditHubPage } from "./features/manage/TripEditHubPage";
import { useTripManageController } from "./features/manage/useTripManageController";
import { SharedTripPage } from "./features/share/SharedTripPage";
import { useSharedTripController } from "./features/share/useSharedTripController";
import { StartPage } from "./features/start/StartPage";
import { OwnerTripViewPage } from "./features/trip/OwnerTripViewPage";
import { TripPage } from "./features/trip/TripPage";
import { useTripPageController } from "./features/trip/useTripPageController";
import { parseManageRoute } from "./shared/manageRoute";
import { getShareTokenFromPath } from "./shared/share";

function App() {
  const currentPath = window.location.pathname;
  const isLegacyOwnerRoute = currentPath === "/owner" || currentPath.startsWith("/owner/");
  const isManageRoute = currentPath === "/manage" || currentPath.startsWith("/manage/") || isLegacyOwnerRoute;
  const isDemoRoute = currentPath === "/demo" || currentPath.startsWith("/demo/");
  const shareToken = getShareTokenFromPath(currentPath);
  const { isShareRoute, sharedTrip, sharedTripError, sharedTripLoading } = useSharedTripController({ shareToken });
  const managePageProps = useTripManageController({ currentPath, isLegacyOwnerRoute, isManageRoute });
  const tripPageProps = useTripPageController();

  if (isShareRoute) {
    return <SharedTripPage error={sharedTripError} loading={sharedTripLoading} sharedTrip={sharedTrip} />;
  }

  if (isManageRoute && !isLegacyOwnerRoute) {
    const manageRoute = parseManageRoute(currentPath);
    if (manageRoute.view === "trip") {
      return <OwnerTripViewPage tripId={manageRoute.tripId} />;
    }
    if (manageRoute.view === "editHub") {
      return <TripEditHubPage tripId={manageRoute.tripId} />;
    }
    return <TripManagePage {...managePageProps} />;
  }

  if (isManageRoute) {
    // 레거시 /owner 경로: useTripManageController 내부의 리다이렉트 effect가 /manage로 옮겨준다.
    return <TripManagePage {...managePageProps} />;
  }

  if (isDemoRoute) {
    return <TripPage {...tripPageProps} />;
  }

  return <StartPage />;
}

export default App;
```

`managePageProps`(즉 `useTripManageController` 호출)는 `isManageRoute`가 true인 모든 경로(`/manage`, `/manage/trips/:id`, `/manage/trips/:id/edit`, `/owner`)에서 항상 계산된다 — 이는 기존 코드도 이미 그랬던 것과 동일한 패턴이다(`useTripPageController()`도 `/manage`에서 그냥 버려지는 채로 항상 호출됨). `/manage/trips/:id`와 `/manage/trips/:id/edit`에서는 `managePageProps`를 실제로 쓰지 않고 `OwnerTripViewPage`/`TripEditHubPage`가 내부에서 자기 자신의 `useTripManageController` 호출을 따로 한다 — 즉 이 두 경로에서는 인증 확인과 여행 목록 조회가 두 번(App.tsx에서 한 번, 페이지 컴포넌트에서 한 번) 일어난다. 네트워크 요청이 중복되긴 하지만 오류를 일으키지는 않으며, 기존 코드베이스가 이미 갖고 있던 "안 쓰는 훅도 항상 호출" 패턴의 연장선이라 이번 작업에서 구조를 바꾸지 않는다.

- [ ] **Step 2: 타입체크 + 빌드**

Run: `npm run web:typecheck && npm run web:build`
Expected: 에러 없음.

- [ ] **Step 3: 브라우저로 전체 흐름 확인**

`.claude/launch.json`으로 미리보기 서버를 켜고, 실제 계정으로 로그인해서 확인한다(테스트 계정이 없다면 `/manage`에서 회원가입 → 이메일 인증 코드 발급/확인 플로우를 거쳐 하나 만든다. 로컬 API가 Resend 연동 없이 인증코드를 콘솔/응답으로 노출하는지는 `docs/LOCAL_DEVELOPMENT_RUNBOOK.md`를 참고한다).

1. `/manage`에서 로그인 후 여행을 하나 만든다(제목/날짜만 있어도 됨).
2. 목록에 뜬 카드에서 "관리하기"를 누른다 → `/manage/trips/:id`로 이동하고, 오늘 탭이 뜨는지 확인. 일정/장소/항공편이 없는 새 여행이므로 "등록된 일정이 없습니다" 다음 일정 카드, 빈 지도/항공 탭이 정상적으로(에러 없이) 보이는지 확인한다.
3. 마이페이지 탭으로 이동 → "이 여행 편집하기" 카드가 보이는지, 눌렀을 때 `/manage/trips/:id/edit`로 이동하는지 확인한다.
4. 편집 허브에서 카테고리 카드 6개("준비 중" 배지)와 "보기 화면으로" 링크가 보이는지 확인한다.
5. 주소창에 존재하지 않는 tripId로 직접 `/manage/trips/does-not-exist`를 입력해 "여행을 찾을 수 없습니다" 화면이 뜨는지 확인한다.
6. `/manage`로 돌아가 여전히 목록 하단에 상세 편집 폼이 통째로 나오지 않고 목록/생성 폼만 보이는지 확인한다(이 화면은 Task 8에서 바뀐다 — 지금은 아직 이전 상태 그대로다).

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/App.tsx
git commit -m "feat(web): /manage/trips/:id, /manage/trips/:id/edit 라우팅 연결"
```

---

## Task 8: `/manage`를 목록/생성 전용으로 축소

**Files:**
- Modify: `apps/web/src/features/manage/TripManagePage.tsx`
- Modify: `apps/web/src/features/manage/components/TripListSection.tsx`
- Modify: `apps/web/src/features/manage/manageTypes.ts`

**Interfaces:**
- Consumes: 없음 (기존 컴포넌트 정리)
- Produces: 없음 (이 작업이 플랜 A의 마지막 조각)

- [ ] **Step 1: `manageTypes.ts`에서 `onSelectOwnerTrip` 제거**

`apps/web/src/features/manage/manageTypes.ts`의 `TripListSectionProps`에서 `onSelectOwnerTrip` 필드를 지운다:

```typescript
export type TripListSectionProps = {
  ownerTrips: OwnerTrip[];
  ownerTripsError: string;
  ownerTripsLoading: boolean;
};
```

- [ ] **Step 2: `TripListSection.tsx` 수정**

`apps/web/src/features/manage/components/TripListSection.tsx` 전체를 아래로 교체한다:

```tsx
import { Compass } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import type { TripListSectionProps } from "../manageTypes";

// 여행 목록 렌더링만 담당한다. 관리 상세 화면 이동은 링크(전체 페이지 이동)로 처리한다.
export function TripListSection({ ownerTrips, ownerTripsError, ownerTripsLoading }: TripListSectionProps) {
  return (
    <section className="section-block">
      <div className="section-title-row">
        <h2>여행 목록</h2>
        <span className="pill subtle">{ownerTrips.length}개</span>
      </div>

      {ownerTripsLoading && <p className="muted">여행 목록을 불러오는 중입니다.</p>}

      {ownerTripsError && <p className="form-error">{ownerTripsError}</p>}

      {!ownerTripsLoading && !ownerTripsError && ownerTrips.length === 0 && (
        <article className="info-card empty-state-card">
          <div className="brand-badge-circle" style={{ width: "44px", height: "44px", marginBottom: "8px" }}>
            <Compass size={22} className="auth-hero-icon" />
          </div>
          <h2>아직 만든 여행이 없습니다</h2>
          <p className="muted">아래 폼에서 첫 여행을 만들면 이 목록에 바로 표시됩니다.</p>
        </article>
      )}

      {!ownerTripsLoading && !ownerTripsError && ownerTrips.length > 0 && (
        <div className="card-stack">
          {ownerTrips.map((ownerTrip) => (
            <article className="owner-trip-card" key={ownerTrip.id}>
              <div>
                <span className="pill subtle">여행</span>
                <h2>{ownerTrip.title}</h2>
                <p className="muted">
                  {formatKoreanDate(ownerTrip.startDate)} ~ {formatKoreanDate(ownerTrip.endDate)}
                </p>
                <p>{ownerTrip.travelers.length > 0 ? ownerTrip.travelers.join(", ") : "여행자 미입력"}</p>
              </div>
              <a className="secondary-button compact-button" href={`/manage/trips/${ownerTrip.id}`}>
                관리하기
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: `TripManagePage.tsx` 수정**

`apps/web/src/features/manage/TripManagePage.tsx` 전체를 아래로 교체한다:

```tsx
import { ManageAuthSection } from "./components/ManageAuthSection";
import { ManageFlowGuide } from "./components/ManageFlowGuide";
import { ManageHeader } from "./components/ManageHeader";
import { TripCreateSection } from "./components/TripCreateSection";
import { TripListSection } from "./components/TripListSection";
import type { TripManagePageProps } from "./manageTypes";

// API 호출과 세션 상태는 useTripManageController가 담당한다.
// 이 컴포넌트는 여행 목록과 새 여행 생성만 다룬다 — 특정 여행 보기/편집은 /manage/trips/:id로 분리됐다.
export function TripManagePage(props: TripManagePageProps) {
  const { auth, authChecked, onLogout, ownerTrips } = props;

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            <ManageAuthSection {...props} />

            {authChecked && auth && (
              <>
                <ManageHeader auth={auth} onLogout={onLogout} />
                <ManageFlowGuide hasSelectedTrip={false} tripCount={ownerTrips.length} />
                <TripListSection {...props} />
                <TripCreateSection {...props} />
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
```

`SelectedTripDetailSection` import와 사용을 제거했다. `ManageFlowGuide`의 `hasSelectedTrip`은 이 화면에서 더 이상 의미가 없으므로(선택 자체가 없다) 항상 `false`로 고정한다.

- [ ] **Step 4: 타입체크 + 빌드**

Run: `npm run web:typecheck && npm run web:build`
Expected: 에러 없음. `SelectedTripDetailSection.tsx`와 그 하위 컴포넌트들(`TripBasicInfoForm`, `ManagePlaceCreateForm` 등)은 더 이상 `TripManagePage.tsx`에서 import되지 않지만, 파일 자체는 지우지 않는다(플랜 B에서 그대로 재사용할 예정이므로). `useTripManageController.ts`가 반환하는 `onSelectOwnerTrip` 등도 그대로 남겨둔다(Task 5/6이 이미 쓰고 있다).

- [ ] **Step 5: 브라우저로 최종 확인**

1. `/manage`에 로그인해서 들어가면 목록과 "새 여행 만들기" 폼만 보이고, 예전처럼 카드 아래에 거대한 편집 폼이 나오지 않는지 확인한다.
2. "관리하기"를 눌러 `/manage/trips/:id`로 정상 이동하는지 다시 한번 확인한다(Task 7에서 이미 확인했지만, `TripListSection`이 버튼에서 링크로 바뀌었으므로 클릭 동작을 다시 확인).
3. 새 여행을 하나 더 만들어서 목록에 바로 반영되는지 확인한다(이 동작은 안 건드렸으므로 회귀 없어야 함).

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/features/manage/TripManagePage.tsx apps/web/src/features/manage/components/TripListSection.tsx apps/web/src/features/manage/manageTypes.ts
git commit -m "refactor(web): /manage를 여행 목록/생성 전용 화면으로 축소"
```

---

## Task 9: 전체 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 체크 실행**

Run: `npm run check`
Expected: typecheck, build, `go test`, `go test -race`, `go vet`, `gofmt` 전부 통과. 백엔드는 이 플랜에서 변경하지 않았으므로 Go 관련 항목은 항상 그린이어야 한다.

- [ ] **Step 2: 회귀 확인 — `/demo`, `/share/:token`**

`/demo`가 Task 3(마이페이지 버그 수정) 이후에도 그대로 동작하는지, 그리고 기존에 만들어 둔 공유 링크(`/share/:token`)가 `TripPage`/`TripPageProps`를 전혀 쓰지 않으므로(별도 컴포넌트) 영향이 없는지 다시 한번 확인한다.

- [ ] **Step 3: 브랜치 push + PR**

이 작업 전체는 `origin/main`에서 새로 딴 `feat/web-manage-view-plan-a` 브랜치에서 진행한다(이미 이 브랜치에서 작업 중이 아니라면 Task 1을 시작하기 전에 `git checkout -b feat/web-manage-view-plan-a origin/main`으로 분기해야 한다).

```bash
git push -u origin feat/web-manage-view-plan-a
gh pr create --title "feat(web): 여행 관리 화면 보기/목록 분리 (플랜 A)" --body "$(cat <<'EOF'
## 변경 요약
- /manage를 여행 목록/생성 전용 화면으로 축소했습니다.
- "관리하기"를 누르면 /manage/trips/:id에서 /demo와 동일한 탭형 UI(오늘/전체 일정/항공/지도/긴급/마이페이지)로 실제 여행 데이터를 볼 수 있습니다.
- 마이페이지 탭에 "이 여행 편집하기" 버튼을 추가해 /manage/trips/:id/edit(편집 허브)로 연결했습니다. 이번 PR에서는 카테고리 카드만 "준비 중" 상태로 보여주고, 카테고리별 실제 편집 페이지는 후속 플랜(플랜 B)에서 연결합니다.
- 마이페이지 탭이 잘못된 localStorage 키(accessToken/userEmail)를 읽어 비밀번호 변경이 항상 실패하던 기존 버그를 함께 고쳤습니다.
- 백엔드 변경 없음(단건 조회 API를 새로 만들지 않고 기존 listMyTrips 목록에서 tripId로 찾습니다).

## 관련 문서
- 설계: docs/superpowers/specs/2026-07-22-manage-view-edit-split-design.md
- 구현 계획: docs/superpowers/plans/2026-07-22-manage-view-plan-a.md

## 테스트
- npm run check 전체 통과
- 브라우저 수동 검증: 로그인 -> 여행 생성 -> 관리하기로 보기 화면 진입 -> 마이페이지 탭에서 편집 허브 진입 -> /manage 목록 화면 회귀 확인 -> /demo 회귀 확인
EOF
)"
```
