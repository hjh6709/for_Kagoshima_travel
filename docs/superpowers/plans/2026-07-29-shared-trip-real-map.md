# 공유 여행 실제 지도 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 위치와 저장 장소를 같은 지도에서 확인하고, 일정과 지도의 역할을 분리하며, 공유 여행 화면을 `오늘 · 지도 · 여행정보` 구조로 개선한다.

**Architecture:** 기존 장소 좌표와 외부 지도 링크 로직은 유지한다. Google Maps JavaScript API를 지연 로딩하는 재사용 가능한 `TravelMap`을 만들고, 소유자 지도 탭과 공유 화면이 같은 지도 모델을 사용한다. 현재 위치는 사용자 동작 후 브라우저 메모리에만 보관하며 지도 실패 시 기존 장소 목록과 외부 길찾기를 유지한다.

**Tech Stack:** React 19.2.8, TypeScript 7, Vite 8, Vitest, Testing Library, Google Maps JavaScript API, Browser Geolocation API

## Global Constraints

- 사용자가 위도와 경도를 직접 입력하는 UI를 만들지 않는다.
- 기존 `latitude`, `longitude`, `googlePlaceId`와 `MapDirectionsChoice`를 재사용한다.
- 새 API와 DB 마이그레이션을 추가하지 않는다.
- 현재 위치를 API, DB, 로그, 분석 이벤트에 보내지 않는다.
- 앱 내부 지도는 위치 확인용이며 실제 길찾기는 고덕지도 또는 Google 지도로 연결한다.
- Google 지도 실패, 중국 네트워크, 오프라인, 위치 권한 거부 시 장소 목록을 사용할 수 있어야 한다.
- 기존 Pocket Atlas 디자인 토큰을 유지하고 골드·그라디언트·과도한 카드 중첩을 사용하지 않는다.
- 모바일 터치 대상은 최소 44px로 유지한다.
- 모든 동작 변경은 실패 테스트를 먼저 확인한 뒤 구현한다.

---

### Task 1: 프론트엔드 동작 테스트 기반과 지도 모델

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/package-lock.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/test/setup.ts`
- Create: `apps/web/src/shared/map/mapModel.test.ts`
- Create: `apps/web/src/shared/map/mapModel.ts`

**Interfaces:**
- Produces:
  - `type MapPoint = { id: string; name: string; latitude: number; longitude: number }`
  - `getMappablePlaces<T extends MappableLocation>(places: T[]): Array<T & Required<Pick<T, "latitude" | "longitude">>>`
  - `getMapCenter(points: MapPoint[]): { latitude: number; longitude: number } | null`

- [ ] **Step 1: 테스트 도구 설치 및 명령 추가**

Run:

```bash
cd apps/web
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/google.maps
```

`apps/web/package.json`:

```json
{
  "scripts": {
    "test": "npm run test:dependencies && vitest run",
    "test:unit": "vitest run"
  }
}
```

- [ ] **Step 2: Vitest DOM 환경 구성**

`apps/web/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

`apps/web/src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: 유효 좌표 필터와 중심점 실패 테스트 작성**

```ts
import { describe, expect, it } from "vitest";
import { getMapCenter, getMappablePlaces } from "./mapModel";

describe("getMappablePlaces", () => {
  it("유효 범위의 위도와 경도를 가진 장소만 지도에 표시한다", () => {
    const places = [
      { id: "valid", name: "인민광장", latitude: 31.2304, longitude: 121.4737 },
      { id: "missing", name: "좌표 없음" },
      { id: "invalid", name: "잘못된 좌표", latitude: 95, longitude: 200 },
      { id: "zero", name: "영점", latitude: 0, longitude: 0 },
    ];

    expect(getMappablePlaces(places).map((place) => place.id)).toEqual(["valid", "zero"]);
  });
});

describe("getMapCenter", () => {
  it("표시할 장소가 없으면 중심점을 만들지 않는다", () => {
    expect(getMapCenter([])).toBeNull();
  });

  it("여러 장소의 산술 중심을 반환한다", () => {
    expect(
      getMapCenter([
        { id: "a", name: "A", latitude: 30, longitude: 120 },
        { id: "b", name: "B", latitude: 32, longitude: 122 },
      ]),
    ).toEqual({ latitude: 31, longitude: 121 });
  });
});
```

- [ ] **Step 4: 반환값이 비어 있는 API 골격으로 assertion failure를 확인**

테스트 파일을 먼저 작성한 뒤 다음 API 골격을 만들고 테스트를 실행한다. 테스트는 `["valid", "zero"]` 대신 `[]`, 중심점 대신 `null`을 받아 assertion failure가 나야 한다.

```ts
export function getMappablePlaces<T extends MappableLocation>(
  _places: T[],
): Array<T & Required<Pick<T, "latitude" | "longitude">>> {
  return [];
}

export function getMapCenter(_points: MapPoint[]) {
  return null;
}
```

- [ ] **Step 5: 최소 지도 모델 구현**

```ts
export type MappableLocation = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
};

export type MapPoint = Required<Pick<MappableLocation, "id" | "name" | "latitude" | "longitude">>;

export function getMappablePlaces<T extends MappableLocation>(
  places: T[],
): Array<T & Required<Pick<T, "latitude" | "longitude">>> {
  return places.filter(
    (place): place is T & Required<Pick<T, "latitude" | "longitude">> =>
      typeof place.latitude === "number" &&
      typeof place.longitude === "number" &&
      Number.isFinite(place.latitude) &&
      Number.isFinite(place.longitude) &&
      place.latitude >= -90 &&
      place.latitude <= 90 &&
      place.longitude >= -180 &&
      place.longitude <= 180,
  );
}

export function getMapCenter(points: MapPoint[]) {
  if (points.length === 0) return null;
  return {
    latitude: points.reduce((sum, point) => sum + point.latitude, 0) / points.length,
    longitude: points.reduce((sum, point) => sum + point.longitude, 0) / points.length,
  };
}
```

- [ ] **Step 6: 지도 모델 테스트 통과 확인 및 커밋**

Run: `cd apps/web && npm run test:unit -- src/shared/map/mapModel.test.ts`

Expected: 3 tests pass.

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/vitest.config.ts apps/web/src/test/setup.ts apps/web/src/shared/map
git commit -m "test(frontend): 실제 지도 동작 테스트 기반 추가"
```

### Task 2: Google 지도 로더와 실패 대체 상태

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/package-lock.json`
- Modify: `apps/web/.env.example`
- Create: `apps/web/src/shared/map/googleMapsLoader.ts`
- Create: `apps/web/src/shared/components/TravelMap.test.tsx`
- Create: `apps/web/src/shared/components/TravelMap.tsx`
- Modify: `apps/web/src/styles/map.css`

**Interfaces:**
- Consumes: Task 1의 `getMappablePlaces`, `getMapCenter`
- Produces:
  - `TravelMapPlace`
  - `CurrentLocationState`
  - `<TravelMap places selectedPlaceID onSelectPlace />`

- [ ] **Step 1: Google 지도 공식 로더 설치와 공개 환경변수 예시 추가**

Run:

```bash
cd apps/web
npm install @googlemaps/js-api-loader
```

`apps/web/.env.example`:

```env
VITE_GOOGLE_MAPS_BROWSER_KEY=
```

- [ ] **Step 2: 키 누락·좌표 누락·위치 권한 거부 실패 테스트 작성**

테스트는 실제 `TravelMap`을 렌더링하고 외부 SDK 로더만 경계에서 대체한다.

```tsx
const place = {
  id: "people-square",
  name: "인민광장",
  latitude: 31.2304,
  longitude: 121.4737,
};

const placeWithoutCoordinates = {
  id: "missing",
  name: "좌표 없는 장소",
};

it("브라우저 지도 키가 없어도 장소 목록으로 이동할 수 있는 상태를 보여준다", async () => {
  render(<TravelMap places={[place]} selectedPlaceID="" onSelectPlace={() => undefined} />);
  expect(await screen.findByRole("status")).toHaveTextContent("지도를 준비하지 못했습니다");
  expect(screen.getByText("저장한 장소 목록과 길찾기는 계속 사용할 수 있습니다")).toBeVisible();
});

it("좌표가 없는 장소 수를 안내한다", () => {
  render(<TravelMap places={[place, placeWithoutCoordinates]} selectedPlaceID="" onSelectPlace={() => undefined} />);
  expect(screen.getByText("지도에 표시할 수 없는 장소 1개")).toBeVisible();
});

it("위치 권한이 거부되어도 저장 장소 지도는 유지한다", async () => {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
        error({ code: 1, message: "denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 }),
    },
  });
  render(<TravelMap places={[place]} selectedPlaceID="" onSelectPlace={() => undefined} />);
  await userEvent.click(screen.getByRole("button", { name: "현재 위치 표시" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("위치 권한을 허용하지 않았습니다");
});
```

- [ ] **Step 3: SDK 지연 로더 구현**

`googleMapsLoader.ts`는 `VITE_GOOGLE_MAPS_BROWSER_KEY`를 읽고 한 번만 `setOptions`와 `importLibrary("maps")`, `importLibrary("marker")`를 실행한다. 키가 없으면 사용자에게 노출 가능한 `MapUnavailableError`를 던진다.

- [ ] **Step 4: `TravelMap` 최소 구현**

- 유효 장소가 없으면 지도 대신 좌표 없음 상태를 렌더링한다.
- SDK 로딩 중에는 고정 높이 스켈레톤을 표시한다.
- 로딩 성공 시 장소 핀과 선택 핀을 렌더링한다.
- `현재 위치 표시` 버튼을 누른 경우에만 `navigator.geolocation.getCurrentPosition`을 호출한다.
- 현재 위치는 컴포넌트 상태로만 유지한다.
- 핀 선택 시 `onSelectPlace(place.id)`를 호출한다.
- 지도·위치 오류는 각각 복구 행동을 포함한 한국어 상태로 표시한다.
- 지도 실패 시 바깥 장소 목록과 외부 길찾기 동작을 막지 않는다.

- [ ] **Step 5: 테스트와 타입 검사 통과 확인 및 커밋**

Run:

```bash
cd apps/web
npm run test:unit -- src/shared/components/TravelMap.test.tsx
npm run typecheck
```

Expected: TravelMap 테스트와 타입 검사 exit code 0.

```bash
git add apps/web/package.json apps/web/package-lock.json apps/web/.env.example apps/web/src/shared/map/googleMapsLoader.ts apps/web/src/shared/components/TravelMap.tsx apps/web/src/shared/components/TravelMap.test.tsx apps/web/src/styles/map.css
git commit -m "feat(frontend): 현재 위치와 저장 장소 실제 지도 추가"
```

### Task 3: 소유자 지도 탭에 실제 지도 통합

**Files:**
- Modify: `apps/web/src/shared/map/mapModel.test.ts`
- Modify: `apps/web/src/shared/map/mapModel.ts`
- Modify: `apps/web/src/features/trip/components/tabs/MapTab.tsx`
- Modify: `apps/web/src/styles/map.css`
- Test: `apps/web/src/shared/components/TravelMap.test.tsx`

**Interfaces:**
- Consumes: Task 2의 `TravelMap`, 기존 `MapDirectionsChoice`
- Produces: 지도 핀과 동선·저장 장소 목록이 하나의 장소 선택 상태를 공유하는 지도 탭

- [ ] **Step 1: 선택 핀 표현의 실패 테스트 추가**

```ts
it("선택된 장소 핀은 색상과 크기를 함께 강조한다", () => {
  expect(getMarkerAppearance("people-square", "people-square")).toEqual({
    background: "destination",
    scale: 1.15,
    selected: true,
  });
  expect(getMarkerAppearance("museum", "people-square")).toEqual({
    background: "route",
    scale: 1,
    selected: false,
  });
});
```

- [ ] **Step 2: 선택 핀 표현 최소 구현**

```ts
export function getMarkerAppearance(placeID: string, selectedPlaceID: string) {
  const selected = placeID === selectedPlaceID;
  return {
    background: selected ? "destination" : "route",
    scale: selected ? 1.15 : 1,
    selected,
  } as const;
}
```

`TravelMap`의 각 Advanced Marker는 이 반환값을 사용해 `aria-label`, CSS 클래스와 크기를 결정한다.

- [ ] **Step 3: `MapTab`의 선택 상태를 장소 ID 중심으로 정리**

- 일정의 `selectedScheduleID`에서 선택 장소 ID를 계산한다.
- 저장 장소 목록 선택도 동일한 `selectedPlaceID`를 갱신한다.
- `TravelMap` 핀 선택은 연결된 일정이 있으면 그 일정을 선택하고, 없으면 저장 장소 상세를 연다.

- [ ] **Step 4: 지도 탭 정보 위계 적용**

- 화면 제목을 `지도`로 변경한다.
- 실제 지도와 현재 위치 버튼을 첫 핵심 영역에 둔다.
- `오늘 동선`과 `저장한 장소` 세그먼트는 지도 아래의 탐색 목록으로 유지한다.
- 일정 탭에서 반복되는 체크리스트나 시간표 전체를 지도 탭에 추가하지 않는다.
- 선택 장소 카드의 기존 고덕지도·Google 지도 버튼, 주소 복사, 기사님께 보기를 재사용한다.

- [ ] **Step 5: 모바일 스타일과 접근성 확인**

- 지도 높이는 작은 화면에서 핵심 목록을 완전히 밀어내지 않도록 `clamp()`로 제한한다.
- 지도 오버레이와 버튼은 44px 터치 영역을 보장한다.
- 핀 선택은 색상 외에도 외곽선과 크기로 구분한다.
- 지도 컨테이너에 접근 가능한 이름을 제공한다.

- [ ] **Step 6: 테스트·빌드 및 커밋**

Run:

```bash
cd apps/web
npm run test
npm run typecheck
npm run build
```

Expected: 모든 명령 exit code 0.

```bash
git add apps/web/src/shared/map/mapModel.ts apps/web/src/shared/map/mapModel.test.ts apps/web/src/features/trip/components/tabs/MapTab.tsx apps/web/src/styles/map.css apps/web/src/shared/components/TravelMap.test.tsx
git commit -m "feat(frontend): 지도 탭 장소 선택 흐름 통합"
```

### Task 4: 공유 여행 화면을 오늘·지도·여행정보로 분리

**Files:**
- Create: `apps/web/src/features/share/sharedTripView.test.ts`
- Create: `apps/web/src/features/share/sharedTripView.ts`
- Create: `apps/web/src/features/share/SharedTripMapSection.tsx`
- Modify: `apps/web/src/features/share/SharedTripPage.tsx`
- Modify: `apps/web/src/styles/share.css`
- Modify: `apps/web/src/styles/map.css`

**Interfaces:**
- Consumes: Task 2의 `TravelMap`, 기존 `SharedTripResponse`, `MapDirectionsChoice`
- Produces:
  - `getSharedFocusDate(startDate, endDate, today)`
  - `getSchedulesForDate(schedules, focusDate)`
  - 공유 화면 `today | map | info` 탭

- [ ] **Step 1: 공유 화면 기준 날짜 실패 테스트 작성**

```ts
it("여행 중이면 오늘 날짜를 선택한다", () => {
  expect(getSharedFocusDate("2026-08-03", "2026-08-06", "2026-08-04")).toBe("2026-08-04");
});

it("출발 전이면 첫날을 선택한다", () => {
  expect(getSharedFocusDate("2026-08-03", "2026-08-06", "2026-07-29")).toBe("2026-08-03");
});

it("여행 후면 마지막 날을 선택한다", () => {
  expect(getSharedFocusDate("2026-08-03", "2026-08-06", "2026-08-10")).toBe("2026-08-06");
});
```

- [ ] **Step 2: 날짜 선택과 일정 필터 최소 구현**

문자열 형식 `YYYY-MM-DD`을 그대로 비교해 시간대 변환으로 날짜가 바뀌지 않게 한다. 오늘 문자열은 기존 한국 시간 기준 날짜 유틸리티를 재사용한다.

- [ ] **Step 3: 공유 화면 탭 구조 구현**

- 헤더에 여행명, 기간, 동행인과 오프라인 경고를 유지한다.
- 헤더 아래에 `오늘`, `지도`, `여행정보` 세그먼트 내비게이션을 둔다.
- `오늘`: 기준 날짜의 일정과 해당 날짜에 필요한 읽기 전용 체크 항목.
- `지도`: `SharedTripMapSection`에서 실제 지도, 장소 목록, 선택 장소 카드, 외부 길찾기 제공.
- `여행정보`: 전체 일정, 항공편, 추천 루트, 전체 읽기 전용 체크리스트.
- 소유자 전용 편집·삭제·완료 동작은 렌더링하지 않는다.
- 기존 인라인 스타일은 `share.css`의 명시적인 클래스들로 이동한다.

- [ ] **Step 4: 공유 지도 선택 흐름 구현**

- 핀과 장소 목록이 `selectedPlaceID` 하나를 공유한다.
- 좌표가 없는 장소는 목록에 `위치 정보 없음`으로 남긴다.
- 선택 카드에서 `MapDirectionsChoice`, 현지정보 복사, 큰 글씨 보기를 재사용한다.
- 중국에서 지도 SDK가 실패해도 고덕지도 길찾기와 현지 이름·주소가 남는다.

- [ ] **Step 5: 공유 공개정보 회귀 검사**

Run:

```bash
cd apps/api
go test ./internal/server/... -run 'Share|Public|Mask'
```

Expected: 공유 응답의 민감 메모 마스킹 관련 테스트 통과.

- [ ] **Step 6: 프론트 테스트·빌드 및 커밋**

Run:

```bash
cd apps/web
npm run test
npm run typecheck
npm run build
```

Expected: 모든 명령 exit code 0.

```bash
git add apps/web/src/features/share apps/web/src/styles/share.css apps/web/src/styles/map.css
git commit -m "feat(frontend): 공유 여행 화면 지도 중심으로 재구성"
```

### Task 5: 배포 문서·모바일 시각 검증·PR

**Files:**
- Modify: `docs/DEPLOYMENT.md`
- Modify: `docs/ORACLE_VM_DEPLOYMENT_RUNBOOK.md`
- Modify: `docs/superpowers/specs/2026-07-29-shared-trip-map-design.md` only if implementation revealed an approved design correction

**Interfaces:**
- Consumes: Tasks 1–4의 완성 화면
- Produces: 운영 설정과 검증 근거가 포함된 PR

- [ ] **Step 1: 브라우저 키 운영 설정 문서화**

- `VITE_GOOGLE_MAPS_BROWSER_KEY`는 프론트 배포 빌드 환경에 둔다.
- 서버용 `GOOGLE_MAPS_API_KEY`와 분리한다.
- 허용 웹사이트와 Maps JavaScript API 제한을 명시한다.
- 실제 키 값은 문서나 저장소에 넣지 않는다.

- [ ] **Step 2: 전체 자동 검증**

Run:

```bash
cd apps/web
npm ci
npm run test
npm run typecheck
npm run build
cd ../api
go test ./...
```

Expected: 모든 테스트와 빌드 exit code 0.

- [ ] **Step 3: 로컬 프로덕션 프리뷰 모바일 검증**

다음 화면 폭에서 확인한다.

- 360×800
- 390×844
- 430×932

검증 상태:

- 장소 0개, 1개, 여러 개
- 좌표 있음·없음·잘못된 좌표
- 위치 허용·거부·시간 초과
- 핀과 목록 양방향 선택
- 지도 키 누락과 SDK 로딩 실패
- 중국 장소의 고덕지도 연결
- 비로그인 공유 링크
- 오프라인 전환과 복구

- [ ] **Step 4: Impeccable 기계 검사와 Git diff 검사**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json apps/web/src/shared/components/TravelMap.tsx apps/web/src/features/trip/components/tabs/MapTab.tsx apps/web/src/features/share/SharedTripPage.tsx apps/web/src/features/share/SharedTripMapSection.tsx apps/web/src/styles/map.css apps/web/src/styles/share.css
git diff --check
git status --short
```

Expected: 차단 수준 디자인 위반, whitespace 오류, 비밀 파일 없음.

- [ ] **Step 5: PR 템플릿으로 PR 생성**

`.github/pull_request_template.md`를 사용해 테스트 결과, 위치정보 비저장, 중국 실패 대체 흐름, 환경변수 이름을 기록한다.

- [ ] **Step 6: explain-diff HTML 생성**

PR 생성 후 `explain-diff-html` 스킬을 사용하여 다음 위치에 날짜 접두사 HTML을 만든다.

```text
/Users/hanjeonghyun/dev/docs/travel_app/pr_review/2026-07-29-shared-trip-real-map-explanation.html
```
