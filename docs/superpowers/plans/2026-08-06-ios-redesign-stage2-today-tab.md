# iOS 리디자인 2단계 — 오늘 탭 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 오늘 탭(`TodayTab`)의 헤더 · Next hero · 스탯 3칸 · 체크 그룹을 iOS 리디자인 스펙에 맞춰 마크업까지 개편한다.

**Architecture:** 1단계는 CSS만 얹는 리스킨이었지만 2단계는 마크업을 바꾼다. 컴포넌트 4개(`TodayHeaderSection`, `NextScheduleCard`, `HomeChecklistSection`, `TodayTab`)를 수정하고 스탯 행 컴포넌트 1개(`TodayStatsSection`)를 새로 만든다. 스탯 값은 **전부 `TripPageProps`에 이미 있는 실제 데이터**로 채우며, 새 API·새 의존성·새 네트워크 호출을 추가하지 않는다. 환율만 예외적으로 `CurrencyExchangeWidget`이 이미 쓰는 localStorage 캐시를 공유 모듈로 추출해 읽기 전용으로 재사용한다.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, lucide-react(신규 아이콘 의존성 금지), 순수 CSS(`apps/web/src/styles/*.css`).

## Global Constraints

- API · DB · Go 백엔드 · 여행 데이터 스키마 · 국가별 분기 로직은 **변경하지 않는다**.
- 정보 구조(5탭 + 마이페이지), 라우팅, `useTripPageController` / `useOwnerTripPageAdapter` / `tripViewState` 계약은 **변경하지 않는다**.
- 아이콘은 이미 설치된 `lucide-react`만 쓴다. 신규 npm 의존성 금지.
- 다크모드 대상 아님(`color-scheme: light` 유지).
- 터치 영역 최소 **44px**, 본문 글자 최소 **12px**, 의미 있는 텍스트 대비 **4.5:1 이상** — 1단계에서 추가한 `apps/web/scripts/mobile-ui-foundations.test.mjs` 계약을 깨면 CI `frontend build`가 실패한다.
- 읽기 전용(공유 보기) 화면에서는 상태를 바꾸는 버튼을 렌더하지 않는다. `apps/web/src/features/share/SharedTripPage.test.tsx:145`가 `queryByRole("button", { name: "완료" })`가 없어야 한다고 이미 검증한다.
- 각 태스크는 끝에서 반드시 다음을 전부 통과시킨 뒤 커밋한다:
  - `npm --prefix apps/web run test:unit`
  - `npm --prefix apps/web run test:dependencies`
  - `npm run web:typecheck`

## 확정된 설계 결정 (사용자 확인 완료, 2026-08-06)

| 로드맵 열린 질문 | 결정 |
| --- | --- |
| 스탯 3칸(날씨/환율/거리) | **실제 데이터로 3칸을 채운다.** 날씨·이동거리는 데이터가 없으므로 뺀다. 대신 `여행 단계` · `오늘 일정 n/m` · `환율`을 쓴다. 목업 고정값 금지. |
| Next hero 완료 버튼 | **넣는다.** `toggleScheduleComplete`가 이미 `TripPageProps:72`에 있으므로 연결만 한다. 읽기 전용에서는 렌더하지 않는다. |
| 헤더 구조 | **절충.** 백링크 · 국가/D-Day/공유 뱃지 · 프로필 버튼은 유지하고, 키커(`여행 2일차 · 11월 4일(수)`) + `오늘` 타이틀을 도입한다. 여행 제목/기간/상태 카드는 키커로 흡수해 제거한다. |

## 의도적인 스펙 편차

- **프로필 버튼 34px → 44px 유지.** README는 34px 원형을 지정하지만 `.header-profile-btn`은 현재 44px이고, 44px 터치 영역이 `DESIGN.md`와 1단계 회귀 테스트가 강제하는 규칙이다. 접근성 계약이 디자인 수치보다 우선한다.
- **날씨 · 오늘 이동 거리 스탯 제외.** 날씨 API도, 거리 계산 로직도 코드베이스에 없다. 목업 고정값을 넣으면 사용자에게 거짓 정보를 보여주게 되므로 실제 데이터가 있는 항목으로 대체한다(사용자 확정).

## 파일 구조

**신규**

| 파일 | 책임 |
| --- | --- |
| `apps/web/src/shared/exchangeRateCache.ts` | 환율 localStorage 캐시 읽기/쓰기. `CurrencyExchangeWidget`과 오늘 탭 스탯이 공유한다. |
| `apps/web/src/shared/exchangeRateCache.test.ts` | 캐시 TTL · 손상된 값 방어 검증. |
| `apps/web/src/features/trip/components/sections/TodayStatsSection.tsx` | 스탯 3칸 행. |
| `apps/web/src/features/trip/components/sections/TodayStatsSection.test.tsx` | 스탯 값·환율 폴백 검증. |
| `apps/web/src/features/trip/components/sections/TodayHeaderSection.test.tsx` | 키커/타이틀 및 기존 기능 유지 검증. |
| `apps/web/src/features/trip/components/sections/HomeChecklistSection.test.tsx` | 카운트 헤더·읽기 전용 동작 검증. |
| `apps/web/src/features/trip/components/sections/TodayRouteSection.tsx` | 스펙 3번 "오늘의 동선" 타임라인 미리보기. |
| `apps/web/src/features/trip/components/sections/TodayRouteSection.test.tsx` | 시간 거터·완료 표시·빈 상태 검증. |

**수정**

| 파일 | 변경 |
| --- | --- |
| `apps/web/src/features/trip/components/helpers/CurrencyExchangeWidget.tsx:11-41` | 캐시 로직을 공유 모듈에서 import 하도록 교체(동작 동일). |
| `apps/web/src/features/trip/components/sections/TodayHeaderSection.tsx` | 키커 + `오늘` 타이틀 도입, 여행 제목/기간/상태 카드 제거. |
| `apps/web/src/features/trip/components/cards/NextScheduleCard.tsx` | Primary 배경 hero 레이아웃 + 완료 버튼. |
| `apps/web/src/features/trip/components/cards/NextScheduleCard.test.tsx` | 완료 버튼 케이스 추가. |
| `apps/web/src/features/trip/components/sections/HomeChecklistSection.tsx` | `n / m` 카운트 헤더 + 헤어라인 행 구조. |
| `apps/web/src/features/trip/components/tabs/TodayTab.tsx` | `TodayStatsSection` 배치 + 신규 prop 전달. |
| `apps/web/src/styles/trip.css` | 오늘 탭 신규 클래스 스타일. |

---

### Task 1: 환율 캐시 공유 모듈 추출

`CurrencyExchangeWidget` 안에만 있던 캐시 로직을 꺼내 오늘 탭 스탯이 같은 캐시를 읽을 수 있게 한다. 동작은 그대로 유지한다(순수 리팩터링 + 신규 소비자 준비).

**Files:**
- Create: `apps/web/src/shared/exchangeRateCache.ts`
- Create: `apps/web/src/shared/exchangeRateCache.test.ts`
- Modify: `apps/web/src/features/trip/components/helpers/CurrencyExchangeWidget.tsx:11-41`

**Interfaces:**
- Consumes: 없음(첫 태스크).
- Produces:
  - `type CachedRate = { rate: number; savedAt: number }`
  - `readCachedRate(currencyCode: string): CachedRate | null`
  - `saveCachedRate(currencyCode: string, rate: number): void`
  - `EXCHANGE_RATE_CACHE_MAX_AGE: number`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/shared/exchangeRateCache.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  EXCHANGE_RATE_CACHE_MAX_AGE,
  readCachedRate,
  saveCachedRate,
} from "./exchangeRateCache";

describe("exchangeRateCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("저장한 환율을 그대로 다시 읽는다", () => {
    saveCachedRate("JPY", 928.4);

    expect(readCachedRate("JPY")?.rate).toBe(928.4);
  });

  it("캐시가 없으면 null을 돌려준다", () => {
    expect(readCachedRate("JPY")).toBeNull();
  });

  it("보관 기간이 지난 환율은 무시한다", () => {
    localStorage.setItem(
      "map-planner:exchange-rate:JPY",
      JSON.stringify({ rate: 928.4, savedAt: Date.now() - EXCHANGE_RATE_CACHE_MAX_AGE - 1 }),
    );

    expect(readCachedRate("JPY")).toBeNull();
  });

  it("값이 손상돼 있으면 예외 대신 null을 돌려준다", () => {
    localStorage.setItem("map-planner:exchange-rate:JPY", "not-json");

    expect(readCachedRate("JPY")).toBeNull();
  });

  it("0 이하의 환율은 유효하지 않은 값으로 본다", () => {
    localStorage.setItem(
      "map-planner:exchange-rate:JPY",
      JSON.stringify({ rate: 0, savedAt: Date.now() }),
    );

    expect(readCachedRate("JPY")).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- exchangeRateCache`
Expected: FAIL — `Failed to resolve import "./exchangeRateCache"`

- [ ] **Step 3: 공유 모듈을 만든다**

`apps/web/src/shared/exchangeRateCache.ts`:

```ts
export type CachedRate = {
  rate: number;
  savedAt: number;
};

export const EXCHANGE_RATE_CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;

function getCacheKey(currencyCode: string) {
  return `map-planner:exchange-rate:${currencyCode}`;
}

// 환율은 오늘 탭 스탯과 환율 위젯이 함께 쓰므로 캐시 규칙을 한곳에 둔다.
export function readCachedRate(currencyCode: string): CachedRate | null {
  try {
    const raw = localStorage.getItem(getCacheKey(currencyCode));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedRate;
    if (!Number.isFinite(cached.rate) || cached.rate <= 0) return null;
    if (Date.now() - cached.savedAt > EXCHANGE_RATE_CACHE_MAX_AGE) return null;
    return cached;
  } catch {
    return null;
  }
}

export function saveCachedRate(currencyCode: string, rate: number) {
  try {
    localStorage.setItem(
      getCacheKey(currencyCode),
      JSON.stringify({ rate, savedAt: Date.now() } satisfies CachedRate),
    );
  } catch {
    // 저장소를 사용할 수 없어도 현재 화면의 계산은 계속 제공한다.
  }
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- exchangeRateCache`
Expected: PASS (5 tests)

- [ ] **Step 5: `CurrencyExchangeWidget`이 공유 모듈을 쓰게 바꾼다**

`apps/web/src/features/trip/components/helpers/CurrencyExchangeWidget.tsx`에서 `CachedRate` 타입 선언, `CACHE_MAX_AGE`, `getCacheKey`, `readCachedRate`, `saveCachedRate`(현재 11-41행)를 **삭제**하고 import로 교체한다. `REQUEST_TIMEOUT`은 이 파일에 그대로 남긴다.

삭제 후 파일 상단이 이렇게 되어야 한다:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpDown, Landmark, RefreshCw } from "lucide-react";
import type { CurrencyConfig } from "../../../../shared/currency";
import { readCachedRate, saveCachedRate } from "../../../../shared/exchangeRateCache";

type RateStatus = "loading" | "live" | "cached" | "manual" | "error";

interface CurrencyExchangeWidgetProps {
  config: CurrencyConfig;
}

const REQUEST_TIMEOUT = 8000;

function foreignToKrw(amount: number, rate: number, rateUnit: number) {
```

`foreignToKrw` 아래 코드는 손대지 않는다.

- [ ] **Step 6: 전체 테스트와 타입 검사를 돌린다**

Run: `npm --prefix apps/web run test:unit && npm run web:typecheck`
Expected: 기존 테스트 전부 PASS, 타입 오류 없음

- [ ] **Step 7: 커밋한다**

```bash
git add apps/web/src/shared/exchangeRateCache.ts apps/web/src/shared/exchangeRateCache.test.ts apps/web/src/features/trip/components/helpers/CurrencyExchangeWidget.tsx
git commit -m "refactor(web): 환율 캐시 로직을 공유 모듈로 추출"
```

---

### Task 2: 오늘 탭 스탯 3칸 컴포넌트

여행 단계 · 오늘 일정 · 환율 3칸. 값은 전부 실제 데이터이며, 환율 캐시가 없으면 값 자리에 `환율 보기`를 띄우고 누르면 긴급 탭으로 보낸다.

**Files:**
- Create: `apps/web/src/features/trip/components/sections/TodayStatsSection.tsx`
- Create: `apps/web/src/features/trip/components/sections/TodayStatsSection.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `readCachedRate(currencyCode: string): CachedRate | null`.
- Produces: `TodayStatsSection` 컴포넌트. props 타입:
  ```ts
  type TodayStatsSectionProps = {
    completedScheduleCount: number;
    destinationCountry?: string;
    onOpenCurrency: () => void;
    scheduleCount: number;
    statusLabel: string;
  };
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/components/sections/TodayStatsSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodayStatsSection } from "./TodayStatsSection";

describe("TodayStatsSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("여행 단계와 오늘 일정 진행 상황을 실제 값으로 보여준다", () => {
    render(
      <TodayStatsSection
        completedScheduleCount={1}
        destinationCountry="JP"
        onOpenCurrency={vi.fn()}
        scheduleCount={3}
        statusLabel="여행 2일차"
      />,
    );

    expect(screen.getByText("여행 2일차")).toBeVisible();
    expect(screen.getByText("1/3")).toBeVisible();
  });

  it("저장된 환율이 있으면 100엔 기준 원화를 보여준다", () => {
    localStorage.setItem(
      "map-planner:exchange-rate:JPY",
      JSON.stringify({ rate: 928.4, savedAt: Date.now() }),
    );

    render(
      <TodayStatsSection
        completedScheduleCount={0}
        destinationCountry="JP"
        onOpenCurrency={vi.fn()}
        scheduleCount={0}
        statusLabel="출발 D-3"
      />,
    );

    expect(screen.getByText("928원")).toBeVisible();
    expect(screen.getByText("100엔")).toBeVisible();
  });

  it("저장된 환율이 없으면 값 대신 환율 보기를 띄우고 눌러서 이동한다", async () => {
    const onOpenCurrency = vi.fn();
    render(
      <TodayStatsSection
        completedScheduleCount={0}
        destinationCountry="JP"
        onOpenCurrency={onOpenCurrency}
        scheduleCount={0}
        statusLabel="출발 D-3"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /환율 보기/ }));

    expect(onOpenCurrency).toHaveBeenCalledTimes(1);
  });

  it("환율을 지원하지 않는 목적지에서는 환율 칸을 빼고 두 칸만 보여준다", () => {
    render(
      <TodayStatsSection
        completedScheduleCount={0}
        destinationCountry="OTHER"
        onOpenCurrency={vi.fn()}
        scheduleCount={2}
        statusLabel="여행 1일차"
      />,
    );

    expect(screen.queryByText(/환율/)).not.toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeVisible();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- TodayStatsSection`
Expected: FAIL — `Failed to resolve import "./TodayStatsSection"`

- [ ] **Step 3: 컴포넌트를 만든다**

`apps/web/src/features/trip/components/sections/TodayStatsSection.tsx`:

```tsx
import { CalendarCheck, Coins, Plane } from "lucide-react";
import { getCurrencyConfig } from "../../../../shared/currency";
import { readCachedRate } from "../../../../shared/exchangeRateCache";

type TodayStatsSectionProps = {
  completedScheduleCount: number;
  destinationCountry?: string;
  onOpenCurrency: () => void;
  scheduleCount: number;
  statusLabel: string;
};

// 오늘 탭 상단 스탯 행. 값은 전부 이미 계산된 실제 데이터만 쓴다.
export function TodayStatsSection({
  completedScheduleCount,
  destinationCountry,
  onOpenCurrency,
  scheduleCount,
  statusLabel,
}: TodayStatsSectionProps) {
  const currencyConfig = getCurrencyConfig(destinationCountry);
  const cachedRate = currencyConfig ? readCachedRate(currencyConfig.code) : null;

  return (
    <div className="today-stats" aria-label="오늘 요약">
      <article className="today-stat-card">
        <Plane aria-hidden="true" size={16} />
        <strong>{statusLabel}</strong>
        <span>여행 단계</span>
      </article>

      <article className="today-stat-card">
        <CalendarCheck aria-hidden="true" size={16} />
        <strong>
          {completedScheduleCount}/{scheduleCount}
        </strong>
        <span>오늘 일정</span>
      </article>

      {currencyConfig && (
        <article className="today-stat-card">
          <Coins aria-hidden="true" size={16} />
          {cachedRate ? (
            <>
              <strong>{Math.round(cachedRate.rate).toLocaleString("ko-KR")}원</strong>
              <span>
                {currencyConfig.rateUnit.toLocaleString("ko-KR")}
                {currencyConfig.label}
              </span>
            </>
          ) : (
            <button className="today-stat-action" onClick={onOpenCurrency} type="button">
              환율 보기
            </button>
          )}
        </article>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- TodayStatsSection`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/sections/TodayStatsSection.tsx apps/web/src/features/trip/components/sections/TodayStatsSection.test.tsx
git commit -m "feat(web): 오늘 탭 스탯 3칸 섹션 추가"
```

---

### Task 3: 헤더를 키커 + `오늘` 타이틀로 개편

백링크 · 뱃지 · 프로필 버튼은 그대로 두고, 여행 제목(`h1`) · 기간(`p.trip-dates`) · 상태 카드(`article.status-card`)를 키커 한 줄로 흡수한다.

**Files:**
- Modify: `apps/web/src/features/trip/components/sections/TodayHeaderSection.tsx:50-88`
- Create: `apps/web/src/features/trip/components/sections/TodayHeaderSection.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `TodayHeaderSection`의 props에 `focusDate: string`가 **추가**된다. 최종 props 타입:
  ```ts
  type TodayHeaderSectionProps = {
    focusDate: string;
    travelStatus: { phase: TravelPhase; label: string; description: string };
    trip: Trip;
    tripDates: TripDates;
    isReadOnly?: boolean;
    onNavigateToMyPage?: () => void;
  };
  ```
  Task 6에서 `TodayTab`이 `focusDate={focusDate}`를 넘긴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/components/sections/TodayHeaderSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TodayHeaderSection } from "./TodayHeaderSection";

const trip = {
  title: "가고시마 3박 4일",
  startDate: "2026-11-03",
  endDate: "2026-11-06",
  travelers: ["나"],
  destinationCountry: "JP",
};

const tripDates = { startDate: "2026-11-03", endDate: "2026-11-06" };

const travelStatus = {
  phase: "during" as const,
  label: "여행 2일차",
  description: "오늘 일정과 다음 이동만 확인하면 됩니다.",
};

describe("TodayHeaderSection", () => {
  it("여행 단계와 오늘 날짜를 키커로 묶고 오늘을 타이틀로 쓴다", () => {
    render(
      <TodayHeaderSection
        focusDate="2026-11-04"
        onNavigateToMyPage={vi.fn()}
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
      />,
    );

    expect(screen.getByText("여행 2일차 · 11월 4일(수)")).toBeVisible();
    expect(screen.getByRole("heading", { name: "오늘" })).toBeVisible();
  });

  it("여행 목록으로 돌아가는 링크와 마이페이지 버튼을 유지한다", () => {
    render(
      <TodayHeaderSection
        focusDate="2026-11-04"
        onNavigateToMyPage={vi.fn()}
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
      />,
    );

    expect(screen.getByRole("link", { name: "여행 목록으로 이동" })).toHaveAttribute("href", "/manage");
    expect(screen.getByRole("button", { name: "마이페이지 열기" })).toBeVisible();
  });

  it("공유 보기에서는 홈 링크와 공유 뱃지를 쓰고 마이페이지 버튼을 감춘다", () => {
    render(
      <TodayHeaderSection
        focusDate="2026-11-04"
        isReadOnly
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
      />,
    );

    expect(screen.getByRole("link", { name: "서비스 홈으로 이동" })).toHaveAttribute("href", "/");
    expect(screen.getByText("공유 보기")).toBeVisible();
    expect(screen.queryByRole("button", { name: "마이페이지 열기" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- TodayHeaderSection`
Expected: FAIL — `Unable to find an element with the text: 여행 2일차 · 11월 4일(수)`

- [ ] **Step 3: 컴포넌트를 고친다**

`TodayHeaderSection.tsx`의 import 줄과 props 타입, 그리고 `return` 블록을 아래로 교체한다. `getCountryBadge` / `getDDayLabel` 헬퍼(15-48행)는 그대로 둔다.

파일 상단 import와 타입:

```tsx
import { ChevronLeft, Share2 } from "lucide-react";
import { formatKoreanDate, type TravelPhase, type TripDates } from "../../../../shared/date";
import { getDestinationCountryLabel } from "../../../../shared/travelOptions";
import type { Trip } from "../../../../types/travel";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";

type TodayHeaderSectionProps = {
  focusDate: string;
  travelStatus: { phase: TravelPhase; label: string; description: string };
  trip: Trip;
  tripDates: TripDates;
  isReadOnly?: boolean;
  onNavigateToMyPage?: () => void;
};
```

함수 본문(50행 이하)을 교체:

```tsx
// 여행 홈 상단. 여행 단계와 오늘 날짜를 키커 한 줄로 묶고 타이틀은 "오늘"로 고정한다.
export function TodayHeaderSection({
  focusDate,
  travelStatus,
  trip,
  tripDates,
  isReadOnly,
  onNavigateToMyPage,
}: TodayHeaderSectionProps) {
  const countryBadge = getCountryBadge(trip.destinationCountry);
  const dday = getDDayLabel(tripDates.startDate, tripDates.endDate);

  return (
    <div className={`trip-header${isReadOnly ? " shared-trip-header" : ""}`}>
      <div className="trip-header-meta">
        <a
          href={isReadOnly ? "/" : "/manage"}
          className="back-to-list-link"
          aria-label={isReadOnly ? "서비스 홈으로 이동" : "여행 목록으로 이동"}
        >
          <ChevronLeft size={16} />
          <span>{isReadOnly ? "홈으로" : "목록으로"}</span>
        </a>
        <div className="trip-badges">
          <span className="badge-item country-badge">{countryBadge}</span>
          <span className={`badge-item dday-badge ${dday.className}`}>{dday.text}</span>
          {isReadOnly && (
            <span className="badge-item shared-view-badge">
              <Share2 aria-hidden="true" size={14} />
              공유 보기
            </span>
          )}
          <ProfileShortcutButton onClick={onNavigateToMyPage} />
        </div>
      </div>
      <p className="today-kicker">
        {travelStatus.label} · {formatKoreanDate(focusDate)}
      </p>
      <h1>오늘</h1>
      <p className="today-trip-title">{trip.title}</p>
    </div>
  );
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- TodayHeaderSection`
Expected: PASS (3 tests). `TodayTab`이 아직 `focusDate`를 안 넘기므로 이 단계에서 `web:typecheck`는 실패한다 — Task 6에서 해소한다.

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/sections/TodayHeaderSection.tsx apps/web/src/features/trip/components/sections/TodayHeaderSection.test.tsx
git commit -m "feat(web): 오늘 탭 헤더를 키커+오늘 타이틀 구조로 변경"
```

---

### Task 4: Next hero 카드 개편 + 완료 버튼

Primary 배경 hero로 바꾸고, 길찾기 옆에 완료 버튼을 붙인다. 읽기 전용에서는 완료 버튼을 렌더하지 않는다.

**Files:**
- Modify: `apps/web/src/features/trip/components/cards/NextScheduleCard.tsx`
- Modify: `apps/web/src/features/trip/components/cards/NextScheduleCard.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `NextScheduleCard`의 props에 `onToggleComplete: (id: string) => void`가 **추가**된다. 최종 props 타입:
  ```ts
  type NextScheduleCardProps = {
    destinationCountry?: string;
    editSchedulesHref?: string;
    focusDate: string;
    getDisplayDate: (dateStr: string) => string;
    getPlace: (placeId?: string) => Place | undefined;
    hasSchedules: boolean;
    isReadOnly?: boolean;
    nextSchedule: ScheduleItem | null;
    onOpenSchedule: () => void;
    onToggleComplete: (id: string) => void;
    travelPhase: TravelPhase;
  };
  ```
  Task 6에서 `TodayTab`이 `onToggleComplete={toggleScheduleComplete}`를 넘긴다.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`NextScheduleCard.test.tsx`를 아래 내용으로 **전체 교체**한다(기존 빈 상태 테스트는 그대로 유지하고 새 케이스를 더한 형태다).

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NextScheduleCard } from "./NextScheduleCard";

const nextSchedule = {
  id: "schedule-1",
  date: "2026-08-03",
  time: "10:30",
  type: "sightseeing" as const,
  title: "센간엔 정원",
  placeId: "place-1",
  guideMemo: "입장권은 매표소에서",
};

describe("NextScheduleCard empty state", () => {
  it("여행 중 등록된 일정이 하나도 없으면 완료가 아니라 추가 안내를 보여준다", () => {
    render(
      <NextScheduleCard
        editSchedulesHref="/manage/trips/trip-1/edit/schedules"
        focusDate="2026-08-03"
        getDisplayDate={(date) => date}
        getPlace={() => undefined}
        hasSchedules={false}
        nextSchedule={null}
        onOpenSchedule={vi.fn()}
        onToggleComplete={vi.fn()}
        travelPhase="during"
      />,
    );

    expect(screen.getByRole("heading", { name: "아직 일정이 없습니다" })).toBeVisible();
    expect(screen.getByRole("link", { name: "일정 추가" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit/schedules",
    );
  });
});

describe("NextScheduleCard 완료 처리", () => {
  it("완료 버튼을 누르면 해당 일정 ID로 토글을 호출한다", async () => {
    const onToggleComplete = vi.fn();
    render(
      <NextScheduleCard
        focusDate="2026-08-03"
        getDisplayDate={(date) => date}
        getPlace={() => undefined}
        hasSchedules
        nextSchedule={nextSchedule}
        onOpenSchedule={vi.fn()}
        onToggleComplete={onToggleComplete}
        travelPhase="during"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "완료" }));

    expect(onToggleComplete).toHaveBeenCalledWith("schedule-1");
  });

  it("공유 보기에서는 완료 버튼을 렌더하지 않는다", () => {
    render(
      <NextScheduleCard
        focusDate="2026-08-03"
        getDisplayDate={(date) => date}
        getPlace={() => undefined}
        hasSchedules
        isReadOnly
        nextSchedule={nextSchedule}
        onOpenSchedule={vi.fn()}
        onToggleComplete={vi.fn()}
        travelPhase="during"
      />,
    );

    expect(screen.queryByRole("button", { name: "완료" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "센간엔 정원" })).toBeVisible();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- NextScheduleCard`
Expected: FAIL — `Unable to find an accessible element with the role "button" and name "완료"`

- [ ] **Step 3: 컴포넌트를 고친다**

`NextScheduleCard.tsx`의 상단(1-31행)을 아래로 교체한다. 빈 상태 블록(34-69행)은 손대지 않는다.

```tsx
import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { formatKoreanDate, type TravelPhase } from "../../../../shared/date";
import type { Place, ScheduleItem } from "../../../../types/travel";
import { CalendarPlus, Check, Clock, MapPin } from "lucide-react";

type NextScheduleCardProps = {
  destinationCountry?: string;
  editSchedulesHref?: string;
  focusDate: string;
  getDisplayDate: (dateStr: string) => string;
  getPlace: (placeId?: string) => Place | undefined;
  hasSchedules: boolean;
  isReadOnly?: boolean;
  nextSchedule: ScheduleItem | null;
  onOpenSchedule: () => void;
  onToggleComplete: (id: string) => void;
  travelPhase: TravelPhase;
};

// 홈 화면의 다음 일정 카드만 담당한다.
export function NextScheduleCard({
  destinationCountry,
  editSchedulesHref,
  focusDate,
  getDisplayDate,
  getPlace,
  hasSchedules,
  isReadOnly,
  nextSchedule,
  onOpenSchedule,
  onToggleComplete,
  travelPhase,
}: NextScheduleCardProps) {
```

이어서 일정이 있을 때의 `return` 블록(71-90행)을 교체:

```tsx
  const place = getPlace(nextSchedule.placeId);
  const kicker = nextSchedule.date === focusDate ? "다음 정류장" : travelPhase === "before" ? "첫 일정" : "다음 일정";

  return (
    <article className="hero-card next-schedule-card">
      <span className="next-schedule-kicker">
        <MapPin aria-hidden="true" size={14} />
        {kicker}
      </span>
      <h2>{nextSchedule.title}</h2>
      <p className="next-schedule-time">
        <Clock aria-hidden="true" size={14} />
        {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
      </p>
      {nextSchedule.guideMemo && <p className="next-schedule-memo">{nextSchedule.guideMemo}</p>}
      <div className="next-schedule-actions">
        {place && <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />}
        {!isReadOnly && (
          <button
            aria-label="완료"
            className="next-schedule-complete"
            onClick={() => onToggleComplete(nextSchedule.id)}
            type="button"
          >
            <Check aria-hidden="true" size={20} />
          </button>
        )}
      </div>
    </article>
  );
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- NextScheduleCard`
Expected: PASS (3 tests)

- [ ] **Step 5: 공유 화면 회귀가 없는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- SharedTripPage`
Expected: PASS — 특히 `queryByRole("button", { name: "완료" })`가 없다는 기존 단언이 계속 통과해야 한다.

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/features/trip/components/cards/NextScheduleCard.tsx apps/web/src/features/trip/components/cards/NextScheduleCard.test.tsx
git commit -m "feat(web): Next hero 카드에 완료 버튼과 새 레이아웃 적용"
```

---

### Task 5: 오늘 챙길 것 체크 그룹 개편

섹션 제목 우측을 `준비물 전체` 버튼 대신 `n / m` 카운트로 바꾸고, 별도의 프로그레스 바 블록을 없앤 뒤 행 구조를 헤어라인 그룹으로 정리한다. 전체 준비물로 가는 경로는 카운트 자체를 버튼으로 만들어 유지한다.

**Files:**
- Modify: `apps/web/src/features/trip/components/sections/HomeChecklistSection.tsx`
- Create: `apps/web/src/features/trip/components/sections/HomeChecklistSection.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: props 타입 변경 없음. 기존 시그니처를 그대로 유지한다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/components/sections/HomeChecklistSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HomeChecklistSection } from "./HomeChecklistSection";

const items = [
  { id: "item-1", title: "여권", category: "before" as const },
  { id: "item-2", title: "보조배터리", category: "before" as const },
];

describe("HomeChecklistSection", () => {
  it("완료 개수를 n / m 카운트로 보여주고 누르면 전체 준비물로 이동한다", async () => {
    const onOpenChecklist = vi.fn();
    render(
      <HomeChecklistSection
        checkedItems={{ "item-1": true }}
        focusCompletedScheduleCount={0}
        focusScheduleCount={0}
        homeChecklistCompletedCount={1}
        homeChecklistItems={items}
        homeChecklistTotalCount={2}
        onOpenChecklist={onOpenChecklist}
        toggleCheck={vi.fn()}
        travelPhase="before"
      />,
    );

    const countButton = screen.getByRole("button", { name: "준비물 전체 보기, 2개 중 1개 완료" });
    await userEvent.click(countButton);

    expect(onOpenChecklist).toHaveBeenCalledTimes(1);
  });

  it("항목을 누르면 해당 ID로 체크를 토글한다", async () => {
    const toggleCheck = vi.fn();
    render(
      <HomeChecklistSection
        checkedItems={{}}
        focusCompletedScheduleCount={0}
        focusScheduleCount={0}
        homeChecklistCompletedCount={0}
        homeChecklistItems={items}
        homeChecklistTotalCount={2}
        onOpenChecklist={vi.fn()}
        toggleCheck={toggleCheck}
        travelPhase="before"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "보조배터리" }));

    expect(toggleCheck).toHaveBeenCalledWith("item-2");
  });

  it("공유 보기에서는 체크 항목을 버튼이 아니라 읽기 전용으로 보여준다", () => {
    render(
      <HomeChecklistSection
        checkedItems={{ "item-1": true }}
        focusCompletedScheduleCount={0}
        focusScheduleCount={0}
        homeChecklistCompletedCount={1}
        homeChecklistItems={items}
        homeChecklistTotalCount={2}
        isReadOnly
        onOpenChecklist={vi.fn()}
        toggleCheck={vi.fn()}
        travelPhase="before"
      />,
    );

    expect(screen.queryByRole("button", { name: "보조배터리" })).not.toBeInTheDocument();
    expect(screen.getByText("보조배터리")).toBeVisible();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- HomeChecklistSection`
Expected: FAIL — `Unable to find an accessible element with the role "button" and name "준비물 전체 보기, 2개 중 1개 완료"`

- [ ] **Step 3: 컴포넌트를 고친다**

`HomeChecklistSection.tsx`의 `return` 블록(42-113행)을 교체한다. props 타입과 상단 계산부(31-40행)는 그대로 둔다.

```tsx
  return (
    <section className="section-block">
      <div className="section-title-row">
        <div>
          <h2>{heading}</h2>
          {scheduleSummary && <p className="section-caption">{scheduleSummary}</p>}
        </div>
        <button
          aria-label={`준비물 전체 보기, ${homeChecklistTotalCount}개 중 ${homeChecklistCompletedCount}개 완료`}
          className="today-check-count"
          onClick={onOpenChecklist}
          type="button"
        >
          {homeChecklistCompletedCount} / {homeChecklistTotalCount}
        </button>
      </div>

      <div className="card-stack today-check-group">
        {homeChecklistItems.length > 0 ? (
          homeChecklistItems.map((item) => {
            const isChecked = Boolean(checkedItems[item.id]);
            const content = (
              <>
                <CheckCircle2 className={isChecked ? "checked" : ""} size={23} />
                <span>{item.title}</span>
              </>
            );
            const className = `check-row${isChecked ? " completed" : ""}`;
            return isReadOnly ? (
              <div className={className} key={item.id}>
                <span className="check-toggle">{content}</span>
                <span className="visually-hidden">{isChecked ? "완료" : "미완료"}</span>
              </div>
            ) : (
              <div className={className} key={item.id}>
                <button
                  aria-pressed={isChecked}
                  className="check-toggle"
                  onClick={() => toggleCheck(item.id)}
                  type="button"
                >
                  {content}
                </button>
              </div>
            );
          })
        ) : (
          <p className="muted today-check-empty">지금 확인할 준비 항목이 없습니다.</p>
        )}
      </div>
    </section>
  );
```

`percentage` 변수가 더 이상 쓰이지 않으므로 31-32행의 선언도 함께 지운다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- HomeChecklistSection`
Expected: PASS (3 tests)

- [ ] **Step 5: 공유 화면 회귀가 없는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- SharedTripPage`
Expected: PASS — `queryByRole("button", { name: "보조배터리" })`가 없다는 기존 단언이 계속 통과해야 한다.

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/features/trip/components/sections/HomeChecklistSection.tsx apps/web/src/features/trip/components/sections/HomeChecklistSection.test.tsx
git commit -m "feat(web): 오늘 챙길 것 체크 그룹을 카운트 헤더+헤어라인 행으로 변경"
```

---

### Task 6: 오늘의 동선 타임라인 섹션

README 스펙 3번 항목. 오늘 일정을 시간 거터 + 도트 + 연결선 형태로 미리 보여준다. 지금 오늘 탭에는 이 섹션이 아예 없다.

**Files:**
- Create: `apps/web/src/features/trip/components/sections/TodayRouteSection.tsx`
- Create: `apps/web/src/features/trip/components/sections/TodayRouteSection.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `TodayRouteSection` 컴포넌트. props 타입:
  ```ts
  type TodayRouteSectionProps = {
    completedSchedules: Record<string, boolean>;
    onOpenSchedule: () => void;
    schedules: ScheduleItem[];
  };
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/components/sections/TodayRouteSection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TodayRouteSection } from "./TodayRouteSection";

const schedules = [
  {
    id: "schedule-1",
    date: "2026-11-04",
    time: "10:30",
    type: "sightseeing" as const,
    title: "센간엔 정원",
  },
  {
    id: "schedule-2",
    date: "2026-11-04",
    time: "13:00",
    type: "meal" as const,
    title: "구로부타 점심",
  },
];

describe("TodayRouteSection", () => {
  it("오늘 일정을 시간과 함께 순서대로 보여준다", () => {
    render(
      <TodayRouteSection completedSchedules={{}} onOpenSchedule={vi.fn()} schedules={schedules} />,
    );

    expect(screen.getByText("10:30")).toBeVisible();
    expect(screen.getByText("센간엔 정원")).toBeVisible();
    expect(screen.getByText("13:00")).toBeVisible();
    expect(screen.getByText("구로부타 점심")).toBeVisible();
  });

  it("완료한 일정은 완료 상태로 표시한다", () => {
    render(
      <TodayRouteSection
        completedSchedules={{ "schedule-1": true }}
        onOpenSchedule={vi.fn()}
        schedules={schedules}
      />,
    );

    expect(screen.getByText("센간엔 정원").closest("li")).toHaveClass("completed");
    expect(screen.getByText("구로부타 점심").closest("li")).not.toHaveClass("completed");
  });

  it("전체 일정 버튼을 누르면 일정 탭으로 보낸다", async () => {
    const onOpenSchedule = vi.fn();
    render(
      <TodayRouteSection
        completedSchedules={{}}
        onOpenSchedule={onOpenSchedule}
        schedules={schedules}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "전체 일정" }));

    expect(onOpenSchedule).toHaveBeenCalledTimes(1);
  });

  it("오늘 일정이 없으면 섹션 자체를 렌더하지 않는다", () => {
    const { container } = render(
      <TodayRouteSection completedSchedules={{}} onOpenSchedule={vi.fn()} schedules={[]} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- TodayRouteSection`
Expected: FAIL — `Failed to resolve import "./TodayRouteSection"`

- [ ] **Step 3: 컴포넌트를 만든다**

`apps/web/src/features/trip/components/sections/TodayRouteSection.tsx`:

```tsx
import type { ScheduleItem } from "../../../../types/travel";

type TodayRouteSectionProps = {
  completedSchedules: Record<string, boolean>;
  onOpenSchedule: () => void;
  schedules: ScheduleItem[];
};

// 오늘 일정을 시간 거터 + 도트 타임라인으로 미리 보여준다. 편집은 일정 탭에서 한다.
export function TodayRouteSection({
  completedSchedules,
  onOpenSchedule,
  schedules,
}: TodayRouteSectionProps) {
  if (schedules.length === 0) return null;

  return (
    <section className="section-block">
      <div className="section-title-row">
        <h2>오늘의 동선</h2>
        <button className="text-link today-route-link" onClick={onOpenSchedule} type="button">
          전체 일정
        </button>
      </div>
      <ol className="today-route-list">
        {schedules.map((schedule) => {
          const isCompleted = Boolean(completedSchedules[schedule.id]);
          return (
            <li className={`today-route-row${isCompleted ? " completed" : ""}`} key={schedule.id}>
              <span className="today-route-time">{schedule.time}</span>
              <span aria-hidden="true" className="today-route-dot" />
              <span className="today-route-title">{schedule.title}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- TodayRouteSection`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/sections/TodayRouteSection.tsx apps/web/src/features/trip/components/sections/TodayRouteSection.test.tsx
git commit -m "feat(web): 오늘 탭에 오늘의 동선 타임라인 섹션 추가"
```

---

### Task 7: 오늘 탭 조립 + 스타일 + 최종 검증

`TodayTab`이 새 prop을 전달하고 스탯 행을 배치한다. 이 태스크가 끝나야 `web:typecheck`가 다시 통과한다.

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/TodayTab.tsx`
- Modify: `apps/web/src/styles/trip.css`

**Interfaces:**
- Consumes: Task 2의 `TodayStatsSection`, Task 3의 `focusDate` prop, Task 4의 `onToggleComplete` prop, Task 6의 `TodayRouteSection`.
- Produces: 없음(최종 조립).

- [ ] **Step 1: `TodayTab`을 고친다**

`TodayTab.tsx` 전체를 아래로 교체한다.

```tsx
import type { TripPageProps } from "../../tripPageTypes";
import { NextScheduleCard } from "../cards/NextScheduleCard";
import { TripDateEditor } from "../helpers/TripDateEditor";
import { HomeChecklistSection } from "../sections/HomeChecklistSection";
import { TodayHeaderSection } from "../sections/TodayHeaderSection";
import { TodayRouteSection } from "../sections/TodayRouteSection";
import { TodayStatsSection } from "../sections/TodayStatsSection";

// 오늘 탭 렌더링만 담당한다. 상태 변경은 상위에서 전달한 핸들러를 호출한다.
export function TodayTab(props: TripPageProps) {
  const {
    checkedItems,
    completedSchedules,
    dates,
    editSchedulesHref,
    focusDate,
    focusCompletedScheduleCount,
    focusSchedules,
    getDisplayDate,
    getPlace,
    homeChecklistCompletedCount,
    homeChecklistItems,
    homeChecklistTotalCount,
    isDemo,
    isReadOnly,
    nextSchedule,
    setActiveTab,
    setSelectedDate,
    setScheduleView,
    toggleCheck,
    toggleScheduleComplete,
    trip,
    tripDates,
    travelStatus,
    updateTripDate,
    onNavigateToMyPage,
  } = props;
  return (
    <section className="screen">
      <TodayHeaderSection
        focusDate={focusDate}
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
        isReadOnly={isReadOnly}
        onNavigateToMyPage={onNavigateToMyPage}
      />
      <NextScheduleCard
        destinationCountry={trip.destinationCountry}
        editSchedulesHref={editSchedulesHref}
        focusDate={focusDate}
        getDisplayDate={getDisplayDate}
        getPlace={getPlace}
        hasSchedules={dates.length > 0}
        isReadOnly={isReadOnly}
        nextSchedule={nextSchedule}
        onOpenSchedule={() => {
          setSelectedDate(focusDate);
          setScheduleView("itinerary");
          setActiveTab("schedule");
        }}
        onToggleComplete={toggleScheduleComplete}
        travelPhase={travelStatus.phase}
      />
      <TodayStatsSection
        completedScheduleCount={focusCompletedScheduleCount}
        destinationCountry={trip.destinationCountry}
        onOpenCurrency={() => setActiveTab("concierge")}
        scheduleCount={focusSchedules.length}
        statusLabel={travelStatus.label}
      />
      <TodayRouteSection
        completedSchedules={completedSchedules}
        onOpenSchedule={() => {
          setSelectedDate(focusDate);
          setScheduleView("itinerary");
          setActiveTab("schedule");
        }}
        schedules={focusSchedules}
      />
      <HomeChecklistSection
        checkedItems={checkedItems}
        focusCompletedScheduleCount={focusCompletedScheduleCount}
        focusScheduleCount={focusSchedules.length}
        homeChecklistCompletedCount={homeChecklistCompletedCount}
        homeChecklistItems={homeChecklistItems}
        homeChecklistTotalCount={homeChecklistTotalCount}
        onOpenChecklist={() => {
          setScheduleView("checklist");
          setActiveTab("schedule");
        }}
        toggleCheck={toggleCheck}
        travelPhase={travelStatus.phase}
        isReadOnly={isReadOnly}
      />
      {isDemo && (
        <details className="date-details today-demo-tools">
          <summary>데모 여행 날짜 조정</summary>
          <TripDateEditor tripDates={tripDates} updateTripDate={updateTripDate} />
        </details>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 타입 검사가 통과하는지 확인한다**

Run: `npm run web:typecheck`
Expected: 오류 없음(Task 3에서 생긴 `focusDate` 누락 오류가 해소된다)

- [ ] **Step 3: 새 클래스 스타일을 추가한다**

`apps/web/src/styles/trip.css` **맨 끝**에 아래를 덧붙인다. 값은 1단계에서 정한 토큰만 쓴다.

```css
/* ── 오늘 탭 (2단계) ─────────────────────────────────────────── */
.today-kicker {
  margin: 4px 0 2px;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
}

.today-trip-title {
  margin: 2px 0 0;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
}

.today-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 8px;
  margin-top: 14px;
}

.today-stat-card {
  display: grid;
  gap: 2px;
  justify-items: start;
  padding: 12px;
  border-radius: 16px;
  background: var(--c-surface);
  color: var(--c-muted);
}

.today-stat-card svg {
  color: var(--c-route);
}

.today-stat-card strong {
  color: var(--c-text);
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.today-stat-card span {
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-strong);
}

.today-stat-action {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-route);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
  text-align: left;
}

.today-check-count {
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-chip);
  background: var(--c-surface-cool);
  color: var(--c-route);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-display);
}

.today-check-group {
  margin-top: 12px;
}

.today-check-empty {
  margin: 0;
  padding: 16px;
  border-radius: var(--radius-card);
  background: var(--c-surface);
}

.today-route-link {
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  background: transparent;
}

.today-route-list {
  margin: 12px 0 0;
  padding: 6px 16px;
  list-style: none;
  border-radius: var(--radius-card);
  background: var(--c-surface);
}

.today-route-row {
  position: relative;
  display: grid;
  grid-template-columns: 40px 12px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.today-route-row + .today-route-row::before {
  position: absolute;
  top: -14px;
  bottom: calc(100% - 6px);
  left: 45px;
  width: 1.5px;
  background: var(--border-color);
  content: "";
}

.today-route-time {
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
}

.today-route-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--c-destination);
  box-shadow: 0 0 0 3px var(--c-destination-soft);
}

.today-route-row.completed .today-route-dot {
  background: var(--c-success);
  box-shadow: 0 0 0 3px var(--c-success-soft);
}

.today-route-title {
  color: var(--c-text);
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-strong);
  overflow-wrap: anywhere;
}

.today-route-row.completed .today-route-title {
  color: var(--c-faint);
  text-decoration: line-through;
}

.next-schedule-memo {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: var(--type-supporting-size);
  line-height: 1.5;
}

.next-schedule-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
}

.next-schedule-actions .directions-choice {
  flex: 1;
}

.next-schedule-complete {
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--c-surface-cool);
  color: var(--c-route);
}
```

- [ ] **Step 4: Next hero를 Primary 배경으로 바꾼다**

`apps/web/src/styles/trip.css`의 `.next-schedule-card` 블록(현재 137행 근처)에서 좌측 세로선/도트 장식인 `.next-schedule-card::before`와 `.next-schedule-card::after` 규칙 **두 개를 통째로 삭제**하고, 대신 위 Step 3에서 덧붙인 블록 끝에 아래를 이어 붙인다.

```css
.next-schedule-card {
  position: relative;
  padding: 20px;
  border: 0;
  border-radius: 24px;
  background: var(--c-route);
  box-shadow: var(--shadow-hero);
  color: #ffffff;
}

.next-schedule-card h2 {
  margin: 8px 0 0;
  color: #ffffff;
  font-size: var(--type-headline-size);
  font-weight: var(--font-weight-display);
  letter-spacing: -0.02em;
}

.next-schedule-card .next-schedule-kicker {
  margin-bottom: 0;
  min-height: 25px;
  padding: 0 10px;
  border-radius: 100px;
  background: var(--c-destination);
  color: #ffffff;
}

.next-schedule-card .next-schedule-time {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.66);
}
```

- [ ] **Step 5: 전체 검증을 돌린다**

Run: `npm --prefix apps/web run test:unit && npm --prefix apps/web run test:dependencies && npm run web:typecheck && npm run web:build`
Expected: 전부 PASS, 빌드 성공

- [ ] **Step 6: 브라우저에서 실제 렌더를 확인한다**

`mcp__Claude_Browser__preview_start`로 `web` 서버를 띄운 뒤 다음을 **실제로** 확인한다(1단계에서 눈대중 확인만 하다 회귀를 놓친 전례가 있다):

1. 375×812에서 오늘 탭 — 키커/타이틀, Next hero, 스탯 3칸, 체크 그룹이 겹침 없이 보이는지 스크린샷.
2. 195×700으로 `resize_window` 후 스탯 3칸이 줄바꿈되며 가로 스크롤이 생기지 않는지 확인.
3. `javascript_tool`로 계산된 값 확인:
   ```js
   (() => {
     const complete = document.querySelector('.next-schedule-complete');
     const count = document.querySelector('.today-check-count');
     return JSON.stringify({
       completeHeight: complete && getComputedStyle(complete).height,
       countMinHeight: count && getComputedStyle(count).minHeight,
       bodyScroll: document.body.scrollWidth <= document.body.clientWidth,
     });
   })();
   ```
   Expected: `completeHeight` 46px 이상, `countMinHeight` 44px, `bodyScroll` true.

- [ ] **Step 7: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/TodayTab.tsx apps/web/src/styles/trip.css
git commit -m "feat(web): 오늘 탭 조립 및 iOS 리디자인 스타일 적용"
```

---

## 최종 확인

- [ ] `npm run check` 전체 통과(Go 백엔드 포함, 손댄 곳 없으니 그대로 green이어야 함)
- [ ] `git push` 후 PR 생성 — 제목 `feat(web): iOS 리디자인 2단계 — 오늘 탭`
- [ ] PR 본문에 이 플랜 경로(`docs/superpowers/plans/2026-08-06-ios-redesign-stage2-today-tab.md`)와 로드맵 경로를 링크
- [ ] CI `frontend build` 통과 확인(`gh pr checks <번호>`)
- [ ] 로드맵 표(`docs/superpowers/specs/2026-07-24-ios-redesign-roadmap.md:28`)의 2단계 행을 **완료**로 갱신
