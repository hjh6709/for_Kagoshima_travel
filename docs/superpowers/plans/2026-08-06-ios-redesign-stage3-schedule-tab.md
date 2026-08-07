# iOS 리디자인 3단계 — 일정 탭 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일정 탭(`ScheduleTab`)의 날짜 필 · 날짜 요약 · 타임라인 카드 · 여행 준비 그룹을 iOS 리디자인 스펙에 맞춰 마크업까지 개편한다.

**Architecture:** 세그먼트 컨트롤은 1단계 `theme-ios.css`에서 이미 스펙대로 바뀌었으므로 손대지 않는다. 이번 단계는 날짜 필을 3단 구조로 바꾸고, 일정 카드를 아이콘 타일 + 칩 행 구조로 재구성하며, 순서 변경 버튼을 편집 모드 안으로 넣는다. 새 데이터 소스·API·DB는 추가하지 않는다.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, lucide-react(신규 의존성 금지), 순수 CSS.

## Global Constraints

- API · DB · Go 백엔드 · 여행 데이터 스키마 · 국가별 분기 로직은 **변경하지 않는다**.
- 라우팅, `useTripPageController` / `useOwnerTripPageAdapter` / `useSharedTripPageAdapter` / `tripViewState` 계약은 **변경하지 않는다**.
- 아이콘은 이미 설치된 `lucide-react`만 쓴다.
- 터치 영역 최소 **44px**, 글자 최소 **12px**, 의미 있는 텍스트 대비 **4.5:1 이상**. `apps/web/scripts/mobile-ui-foundations.test.mjs`가 CI에서 강제한다. 스펙의 10.5px·11px·12.5px 수치는 이 규칙에 맞춰 올린다.
- **읽기 전용(공유 보기)에서는 상태를 바꾸는 버튼을 렌더하지 않는다.**
- **날짜 탭 버튼의 접근 가능한 이름은 `formatShortDate` 결과(`8/1(토)`)를 유지해야 한다.** 아래 테스트가 이미 고정하고 있다:
  - `apps/web/src/features/share/SharedTripPage.test.tsx:184, 245, 247, 265`
  - `apps/web/src/features/trip/OwnerTripViewPage.test.tsx:113`
  구조를 3단으로 바꾸면 시각 텍스트가 쪼개지므로 버튼에 `aria-label={formatShortDate(getDisplayDate(date))}`를 반드시 붙인다.
- **`fit-tabs` / `scroll-tabs` 클래스 규칙(4일 이하 균등, 5일 이상 스크롤)을 유지한다.** `SharedTripPage.test.tsx:243, 265`가 검증한다.
- 각 태스크는 끝에서 다음을 전부 통과시킨 뒤 커밋한다:
  - `npm --prefix apps/web run test:unit`
  - `npm --prefix apps/web run test:dependencies`
  - `npm run web:typecheck`

## 확정된 설계 결정 (사용자 확인 완료, 2026-08-06)

| 스펙 항목 | 간극 | 결정 |
| --- | --- | --- |
| 날짜 요약의 감성 헤드라인 + 2줄 날짜 노트 | 저장할 필드가 없다 | **진행률 중심으로 대체.** `n개 중 m개 완료` + 5px 프로그레스 바만 스펙 스타일로 구현하고, 감성 문구·노트는 넣지 않는다(2단계에서 날씨·거리를 뺀 것과 같은 기준). |
| 일정 카드의 순서 변경(↑↓) | 스펙에 없지만 **앱 전체에서 유일한 재정렬 수단** | **유지하되 편집 모드 안으로.** 평소에는 스펙대로 깔끔한 카드, 상단 `순서 편집` 토글을 켰을 때만 ↑↓ 노출. |
| 여행 준비 뷰 그룹 기준 | 스펙은 날짜 기준, 현재는 구분 기준 | **현재의 구분 기준 유지.** 날짜 필터가 이미 따로 있어 날짜로 또 묶으면 역할이 겹친다. 그룹 헤더 스타일과 `n / m` 카운트만 스펙대로 바꾼다. |

## 의도적인 스펙 편차

- **글자 크기 하향 수치 미채택.** 스펙의 요일 11px, 배지 10.5px, 현지어 12.5px는 12px 최소 규칙을 어기므로 12px 이상으로 올린다.
- **현지어 부제 미구현.** `Place`에는 범용 현지어 필드가 없고 `chineseName`(중국 전용)뿐이라, 특정 국가에서만 나타나는 부제를 넣으면 국가별 분기가 늘어난다. 대신 기존 `place.name`을 그 자리에 쓴다.
- **"길찾기 칩 → 장소 시트" 미구현.** 스펙은 카드 하단 길찾기 칩이 장소 상세 시트를 열도록 하지만, `PlaceDetailSheet`는 로드맵상 **4단계 신규 컴포넌트**다. 이번 단계에서는 기존 `MapDirectionsChoice`를 그대로 두고, 4단계에서 시트를 만들 때 이 자리를 연결한다.

## 파일 구조

**신규**

| 파일 | 책임 |
| --- | --- |
| `apps/web/src/features/trip/scheduleTypeIcons.ts` | 일정 종류별 lucide 아이콘 매핑. |
| `apps/web/src/features/trip/scheduleTypeIcons.test.ts` | 모든 종류가 아이콘을 갖는지 검증. |
| `apps/web/src/features/trip/components/cards/DatePillList.tsx` | 날짜 필 목록(3단 구조 + 접근명 보존). |
| `apps/web/src/features/trip/components/cards/DatePillList.test.tsx` | 접근명·fit/scroll 클래스·선택 상태 검증. |
| `apps/web/src/features/trip/components/sections/ScheduleSummarySection.tsx` | 날짜 요약(진행률 + 프로그레스 바). |
| `apps/web/src/features/trip/components/sections/ScheduleSummarySection.test.tsx` | 진행률 계산·0개 방어 검증. |

**수정**

| 파일 | 변경 |
| --- | --- |
| `apps/web/src/features/trip/components/cards/ScheduleCard.tsx` | 아이콘 타일 + 칩 행 + 우측 체크 버튼 구조, 순서 버튼은 `isReordering`일 때만. |
| `apps/web/src/features/trip/components/cards/ScheduleCard.test.tsx` | 신규 구조·편집 모드 케이스 추가. |
| `apps/web/src/features/trip/components/tabs/ScheduleTab.tsx` | `DatePillList`·`ScheduleSummarySection` 배치, 순서 편집 토글. |
| `apps/web/src/features/trip/components/sections/ChecklistSection.tsx` | 그룹 헤더 + `n / m` 카운트. |
| `apps/web/src/styles/trip.css` | 일정 탭 신규 클래스 스타일. |

---

### Task 1: 일정 종류별 아이콘 매핑

카드의 36px 아이콘 타일에 쓸 아이콘을 한곳에서 정한다.

**Files:**
- Create: `apps/web/src/features/trip/scheduleTypeIcons.ts`
- Create: `apps/web/src/features/trip/scheduleTypeIcons.test.ts`

**Interfaces:**
- Consumes: 없음.
- Produces: `scheduleTypeIcons: Record<ScheduleItem["type"], LucideIcon>`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/scheduleTypeIcons.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scheduleTypeLabels } from "../../shared/travelOptions";
import { scheduleTypeIcons } from "./scheduleTypeIcons";

describe("scheduleTypeIcons", () => {
  it("모든 일정 종류에 아이콘이 있다", () => {
    for (const type of Object.keys(scheduleTypeLabels)) {
      expect(scheduleTypeIcons[type as keyof typeof scheduleTypeIcons]).toBeTypeOf("object");
    }
  });

  it("라벨과 아이콘의 종류 목록이 정확히 일치한다", () => {
    expect(Object.keys(scheduleTypeIcons).sort()).toEqual(Object.keys(scheduleTypeLabels).sort());
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- scheduleTypeIcons`
Expected: FAIL — `Failed to resolve import "./scheduleTypeIcons"`

- [ ] **Step 3: 매핑을 만든다**

`apps/web/src/features/trip/scheduleTypeIcons.ts`:

```ts
import {
  BedDouble,
  Camera,
  Flag,
  MapPin,
  Navigation,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { ScheduleItem } from "../../types/travel";

// 일정 카드의 아이콘 타일에 쓴다. 종류가 늘면 여기에만 추가하면 된다.
export const scheduleTypeIcons: Record<ScheduleItem["type"], LucideIcon> = {
  move: Navigation,
  meal: Utensils,
  golf: Flag,
  sightseeing: Camera,
  hotel: BedDouble,
  shopping: ShoppingBag,
  etc: MapPin,
};
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- scheduleTypeIcons`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/scheduleTypeIcons.ts apps/web/src/features/trip/scheduleTypeIcons.test.ts
git commit -m "feat(web): 일정 종류별 아이콘 매핑 추가"
```

---

### Task 2: 날짜 필 3단 구조

버튼 안을 요일 · 일 · `DAY n` 3단으로 쌓되, 접근 가능한 이름은 기존과 똑같이 유지한다.

**Files:**
- Create: `apps/web/src/features/trip/components/cards/DatePillList.tsx`
- Create: `apps/web/src/features/trip/components/cards/DatePillList.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `DatePillList` 컴포넌트.
  ```ts
  type DatePillListProps = {
    dates: string[];
    getDisplayDate: (dateStr: string) => string;
    onSelectDate: (date: string) => void;
    selectedDate: string;
  };
  ```
  내부에서 `ref`가 필요하므로 `forwardRef<HTMLDivElement, DatePillListProps>`로 만든다. Task 5에서 `ScheduleTab`이 기존 `dateTabsRef`를 그대로 넘긴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/components/cards/DatePillList.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatePillList } from "./DatePillList";

const dates = ["2026-08-20", "2026-08-21", "2026-08-22"];

describe("DatePillList", () => {
  it("버튼 이름은 기존과 같은 짧은 날짜 형식을 유지한다", () => {
    render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );

    expect(screen.getByRole("button", { name: "8/20(목)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "8/21(금)" })).toHaveAttribute("aria-pressed", "false");
  });

  it("각 필에 요일 · 일 · DAY 번호를 함께 보여준다", () => {
    render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );

    const secondPill = screen.getByRole("button", { name: "8/21(금)" });
    expect(secondPill).toHaveTextContent("금");
    expect(secondPill).toHaveTextContent("21");
    expect(secondPill).toHaveTextContent("DAY 2");
  });

  it("날짜를 누르면 해당 날짜로 선택을 바꾼다", async () => {
    const onSelectDate = vi.fn();
    render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={onSelectDate}
        selectedDate="2026-08-20"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "8/22(토)" }));

    expect(onSelectDate).toHaveBeenCalledWith("2026-08-22");
  });

  it("4일 이하는 균등 분할, 5일 이상은 가로 스크롤 클래스를 쓴다", () => {
    const { unmount } = render(
      <DatePillList
        dates={dates}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );
    expect(screen.getByLabelText("여행 날짜 선택")).toHaveClass("fit-tabs");

    unmount();

    render(
      <DatePillList
        dates={[...dates, "2026-08-23", "2026-08-24"]}
        getDisplayDate={(date) => date}
        onSelectDate={vi.fn()}
        selectedDate="2026-08-20"
      />,
    );
    expect(screen.getByLabelText("여행 날짜 선택")).toHaveClass("scroll-tabs");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- DatePillList`
Expected: FAIL — `Failed to resolve import "./DatePillList"`

- [ ] **Step 3: 컴포넌트를 만든다**

`apps/web/src/features/trip/components/cards/DatePillList.tsx`:

```tsx
import { forwardRef } from "react";
import { formatShortDate } from "../../../../shared/date";

type DatePillListProps = {
  dates: string[];
  getDisplayDate: (dateStr: string) => string;
  onSelectDate: (date: string) => void;
  selectedDate: string;
};

const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 필 목록. 시각적으로는 요일·일·DAY 3단이지만, 접근 가능한 이름은
// 기존 화면과 같은 "8/20(목)" 형식을 유지한다(기존 테스트가 이 이름을 고정한다).
export const DatePillList = forwardRef<HTMLDivElement, DatePillListProps>(function DatePillList(
  { dates, getDisplayDate, onSelectDate, selectedDate },
  ref,
) {
  return (
    <div
      aria-label="여행 날짜 선택"
      className={`date-tabs ${dates.length <= 4 ? "fit-tabs" : "scroll-tabs"}`}
      ref={ref}
      style={
        dates.length <= 4
          ? { gridTemplateColumns: `repeat(${dates.length}, minmax(0, 1fr))` }
          : undefined
      }
    >
      {dates.map((date, index) => {
        const displayDate = getDisplayDate(date);
        const parsed = new Date(`${displayDate}T00:00:00`);
        const isSelected = date === selectedDate;
        return (
          <button
            aria-label={formatShortDate(displayDate)}
            aria-pressed={isSelected}
            className={isSelected ? "active" : ""}
            key={date}
            onClick={() => onSelectDate(date)}
            type="button"
          >
            <span className="date-pill-weekday">{weekdayNames[parsed.getDay()]}</span>
            <span className="date-pill-day">{parsed.getDate()}</span>
            <span className="date-pill-badge">DAY {index + 1}</span>
          </button>
        );
      })}
    </div>
  );
});
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- DatePillList`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/cards/DatePillList.tsx apps/web/src/features/trip/components/cards/DatePillList.test.tsx
git commit -m "feat(web): 날짜 필을 요일·일·DAY 3단 구조로 분리"
```

---

### Task 3: 날짜 요약 섹션

`n개 중 m개 완료` + 5px 프로그레스 바. 감성 헤드라인·날짜 노트는 넣지 않는다(설계 결정 참고).

**Files:**
- Create: `apps/web/src/features/trip/components/sections/ScheduleSummarySection.tsx`
- Create: `apps/web/src/features/trip/components/sections/ScheduleSummarySection.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: `ScheduleSummarySection` 컴포넌트.
  ```ts
  type ScheduleSummarySectionProps = {
    completedCount: number;
    totalCount: number;
  };
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/components/sections/ScheduleSummarySection.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScheduleSummarySection } from "./ScheduleSummarySection";

describe("ScheduleSummarySection", () => {
  it("선택한 날짜의 완료 진행 상황을 보여준다", () => {
    render(<ScheduleSummarySection completedCount={1} totalCount={3} />);

    expect(screen.getByText("3개 중 1개 완료")).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "33");
  });

  it("일정이 없으면 0으로 나누지 않고 0%로 처리한다", () => {
    render(<ScheduleSummarySection completedCount={0} totalCount={0} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("모두 완료하면 100%가 된다", () => {
    render(<ScheduleSummarySection completedCount={4} totalCount={4} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- ScheduleSummarySection`
Expected: FAIL — `Failed to resolve import "./ScheduleSummarySection"`

- [ ] **Step 3: 컴포넌트를 만든다**

`apps/web/src/features/trip/components/sections/ScheduleSummarySection.tsx`:

```tsx
type ScheduleSummarySectionProps = {
  completedCount: number;
  totalCount: number;
};

// 선택한 날짜의 일정 진행 상황만 보여준다.
export function ScheduleSummarySection({ completedCount, totalCount }: ScheduleSummarySectionProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="schedule-summary">
      <p className="schedule-summary-count">
        {totalCount}개 중 {completedCount}개 완료
      </p>
      <div
        aria-label="선택한 날짜의 일정 완료율"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="schedule-summary-track"
        role="progressbar"
      >
        <div className="schedule-summary-fill" style={{ transform: `scaleX(${percentage / 100})` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- ScheduleSummarySection`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/sections/ScheduleSummarySection.tsx apps/web/src/features/trip/components/sections/ScheduleSummarySection.test.tsx
git commit -m "feat(web): 일정 탭 날짜 요약을 진행률 막대로 교체"
```

---

### Task 4: 일정 카드 재구성 + 순서 편집 모드

아이콘 타일 · 칩 행 · 우측 체크 버튼 구조로 바꾸고, 순서 변경 버튼은 `isReordering`일 때만 보여 준다.

**Files:**
- Modify: `apps/web/src/features/trip/components/cards/ScheduleCard.tsx`
- Modify: `apps/web/src/features/trip/components/cards/ScheduleCard.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `scheduleTypeIcons`.
- Produces: `ScheduleCard`의 props에 `isReordering?: boolean`이 **추가**된다. 나머지 props는 그대로다. Task 5에서 `ScheduleTab`이 넘긴다.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`ScheduleCard.test.tsx` **맨 끝**(마지막 `});` 앞이 아니라 파일 끝)에 아래 describe를 덧붙인다. 기존 두 테스트는 그대로 둔다.

```tsx
describe("ScheduleCard 구조와 순서 편집", () => {
  const baseItem = {
    id: "schedule-1",
    date: "2026-08-20",
    time: "10:30",
    type: "sightseeing" as const,
    title: "센간엔 정원",
  };

  it("평소에는 순서 변경 버튼을 보여주지 않는다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast={false}
        item={baseItem}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "센간엔 정원 위로 이동" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "센간엔 정원 완료" })).toBeVisible();
  });

  it("순서 편집 모드에서만 위·아래 이동 버튼을 보여준다", async () => {
    const onMove = vi.fn();
    render(
      <ScheduleCard
        index={1}
        isCompleted={false}
        isLast={false}
        isReordering
        item={baseItem}
        onMove={onMove}
        onToggleComplete={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "센간엔 정원 위로 이동" }));

    expect(onMove).toHaveBeenCalledWith("schedule-1", "up");
  });

  it("완료한 일정은 완료 취소로 다시 되돌릴 수 있다", async () => {
    const onToggleComplete = vi.fn();
    render(
      <ScheduleCard
        index={0}
        isCompleted
        isLast
        item={baseItem}
        onMove={vi.fn()}
        onToggleComplete={onToggleComplete}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "센간엔 정원 완료 취소" }));

    expect(onToggleComplete).toHaveBeenCalledWith("schedule-1");
  });

  it("공유 보기에서는 완료와 순서 변경 버튼을 모두 감춘다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        isReadOnly
        isReordering
        item={baseItem}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "센간엔 정원 완료" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "센간엔 정원 위로 이동" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "센간엔 정원" })).toBeVisible();
  });
});
```

이 파일에는 아직 `userEvent`가 없으므로 1행 아래에 import를 추가한다. 교체 후 상단 4줄은 이렇게 된다:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScheduleCard } from "./ScheduleCard";
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- ScheduleCard`
Expected: FAIL — `Unable to find an accessible element with the role "button" and name "센간엔 정원 완료"`

- [ ] **Step 3: 컴포넌트를 고친다**

`ScheduleCard.tsx` 전체를 아래로 교체한다.

```tsx
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { MaskedText } from "../../../../shared/components/MaskedText";
import { scheduleTypeLabels } from "../../../../shared/travelOptions";
import type { Place, ScheduleItem } from "../../../../types/travel";
import { scheduleTypeIcons } from "../../scheduleTypeIcons";

type ScheduleCardProps = {
  index: number;
  isCompleted: boolean;
  isReadOnly?: boolean;
  isReordering?: boolean;
  isLast: boolean;
  item: ScheduleItem;
  destinationCountry?: string;
  onMove: (scheduleID: string, direction: "up" | "down") => void;
  onToggleComplete: (scheduleID: string) => void;
  place?: Place;
  showGuideMemo?: boolean;
};

// 일정 카드 한 개의 렌더링만 담당한다. 완료·순서 변경은 상위 핸들러를 호출한다.
export function ScheduleCard({
  index,
  isCompleted,
  isReadOnly,
  isReordering = false,
  isLast,
  item,
  destinationCountry,
  onMove,
  onToggleComplete,
  place,
  showGuideMemo = false,
}: ScheduleCardProps) {
  const TypeIcon = scheduleTypeIcons[item.type];

  return (
    <article className={`schedule-card ${isCompleted ? "completed" : ""}`}>
      <span className="time">{item.time}</span>
      <div className="schedule-content">
        <div className="schedule-headline">
          <span aria-hidden="true" className="schedule-type-tile">
            <TypeIcon size={18} />
          </span>
          <div className="schedule-headline-copy">
            <h2>{item.title}</h2>
            {place && <p className="schedule-place">{place.name}</p>}
          </div>
          {!isReadOnly && (
            <button
              aria-label={`${item.title} ${isCompleted ? "완료 취소" : "완료"}`}
              className={`schedule-check${isCompleted ? " checked" : ""}`}
              onClick={() => onToggleComplete(item.id)}
              type="button"
            >
              <Check aria-hidden="true" size={20} />
            </button>
          )}
        </div>

        <div className="schedule-chips">
          <span className="pill subtle">{scheduleTypeLabels[item.type]}</span>
          {isCompleted && <span className="pill completed-pill">완료</span>}
        </div>

        {item.transportMemo && (
          <p className="schedule-detail">
            <strong>이동</strong>
            {item.transportMemo}
          </p>
        )}
        {item.reservationMemo && (
          <p className="schedule-detail">
            <strong style={{ marginRight: "6px" }}>예약</strong>
            <MaskedText text={item.reservationMemo} />
          </p>
        )}
        {item.guideMemo && (
          showGuideMemo ? (
            <p className="schedule-detail muted">
              <strong>안내</strong>
              {item.guideMemo}
            </p>
          ) : (
            <div className="muted schedule-guide-memo">
              <MaskedText text={item.guideMemo} label="안내:" />
            </div>
          )
        )}

        {!isReadOnly && isReordering && (
          <div className="schedule-move-actions" aria-label={`${item.title} 순서 변경`}>
            <button
              aria-label={`${item.title} 위로 이동`}
              className="icon-button neutral"
              disabled={index === 0}
              onClick={() => onMove(item.id, "up")}
              type="button"
            >
              <ArrowUp size={18} />
            </button>
            <button
              aria-label={`${item.title} 아래로 이동`}
              className="icon-button neutral"
              disabled={isLast}
              onClick={() => onMove(item.id, "down")}
              type="button"
            >
              <ArrowDown size={18} />
            </button>
          </div>
        )}

        {place && (
          <div className="schedule-directions">
            <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />
          </div>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- ScheduleCard`
Expected: PASS (6 tests — 기존 2 + 신규 4)

- [ ] **Step 5: 공유 화면 회귀를 확인한다**

Run: `npm --prefix apps/web run test:unit -- SharedTripPage`
Expected: PASS — 특히 `queryByRole("button", { name: "완료" })`가 없다는 기존 단언이 계속 통과해야 한다(완료 버튼 이름이 `제목 + 완료`로 바뀌었으므로 정확 일치 검색에는 더더욱 걸리지 않는다).

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/features/trip/components/cards/ScheduleCard.tsx apps/web/src/features/trip/components/cards/ScheduleCard.test.tsx
git commit -m "feat(web): 일정 카드를 아이콘 타일 구조로 재구성하고 순서 변경을 편집 모드로 이동"
```

---

### Task 5: 일정 탭 조립 + 순서 편집 토글

`ScheduleTab`이 새 컴포넌트를 배치하고 순서 편집 상태를 갖는다.

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/ScheduleTab.tsx`

**Interfaces:**
- Consumes: Task 2의 `DatePillList`, Task 3의 `ScheduleSummarySection`, Task 4의 `isReordering` prop.
- Produces: 없음.

- [ ] **Step 1: import와 상태를 추가한다**

`ScheduleTab.tsx` 상단 import를 아래로 교체한다.

```tsx
import { CalendarDays, ListChecks } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TripPageProps } from "../../tripPageTypes";
import { DatePillList } from "../cards/DatePillList";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";
import { ScheduleCard } from "../cards/ScheduleCard";
import { ChecklistSection } from "../sections/ChecklistSection";
import { ScheduleSummarySection } from "../sections/ScheduleSummarySection";
```

`formatShortDate` import는 `DatePillList`로 옮겨졌으므로 여기서 **삭제한다**.

`const dateTabsRef = useRef<HTMLDivElement>(null);` 바로 아래에 추가한다:

```tsx
  const [isReordering, setIsReordering] = useState(false);
```

- [ ] **Step 2: 날짜 필과 요약을 새 컴포넌트로 교체한다**

`{dates.length > 0 && ( ... )}`의 `<div aria-label="여행 날짜 선택" ...>` 블록 전체와 그 뒤의 `<div className="schedule-summary">` 블록을 아래로 교체한다.

```tsx
          {dates.length > 0 && (
            <DatePillList
              dates={dates}
              getDisplayDate={getDisplayDate}
              onSelectDate={setSelectedDate}
              ref={dateTabsRef}
              selectedDate={selectedDate}
            />
          )}
          <div className="schedule-summary-row">
            <ScheduleSummarySection
              completedCount={completedScheduleCount}
              totalCount={selectedSchedules.length}
            />
            {!isReadOnly && selectedSchedules.length > 1 && (
              <button
                aria-pressed={isReordering}
                className="text-link schedule-reorder-toggle"
                onClick={() => setIsReordering((current) => !current)}
                type="button"
              >
                {isReordering ? "순서 편집 완료" : "순서 편집"}
              </button>
            )}
          </div>
```

- [ ] **Step 3: `ScheduleCard`에 순서 편집 상태를 넘긴다**

`<ScheduleCard ... />`에 prop 한 줄을 추가한다.

```tsx
                    isReadOnly={isReadOnly}
                    isReordering={isReordering}
                    isLast={index === selectedSchedules.length - 1}
```

- [ ] **Step 4: 타입 검사와 전체 테스트를 돌린다**

Run: `npm run web:typecheck && npm --prefix apps/web run test:unit`
Expected: 타입 오류 없음, 전체 PASS

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/ScheduleTab.tsx
git commit -m "feat(web): 일정 탭에 날짜 필·요약 컴포넌트와 순서 편집 토글 배치"
```

---

### Task 6: 여행 준비 그룹 헤더

그룹 제목 옆에 `n / m` 카운트를 붙이고 헤더 스타일을 스펙에 맞춘다. 그룹 기준(구분)은 그대로 둔다.

**Files:**
- Modify: `apps/web/src/features/trip/components/sections/ChecklistSection.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: props 변경 없음.

- [ ] **Step 1: 그룹 계산에 완료 개수를 더한다**

`ChecklistSection.tsx`의 `visibleGroups` 계산을 아래로 교체한다.

```tsx
  const visibleGroups = checklistCategories
    .map(([category, label]) => {
      const items = visibleChecklist.filter((item) => item.category === category);
      return {
        category,
        label,
        items,
        completedCount: items.filter((item) => checkedItems[item.id]).length,
      };
    })
    .filter((group) => group.items.length > 0);
```

- [ ] **Step 2: 그룹 헤더에 카운트를 붙인다**

`<h3>{group.label}</h3>`를 아래로 교체한다.

```tsx
              <div className="check-group-header">
                <h3>{group.label}</h3>
                <span className="check-group-count">
                  {group.completedCount} / {group.items.length}
                </span>
              </div>
```

- [ ] **Step 3: 기존 테스트가 계속 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- ChecklistSection SharedTripPage`
Expected: PASS — 날짜 필터와 항목 표시 동작은 바뀌지 않았다.

- [ ] **Step 4: 커밋한다**

```bash
git add apps/web/src/features/trip/components/sections/ChecklistSection.tsx
git commit -m "feat(web): 여행 준비 그룹 헤더에 완료 카운트 추가"
```

---

### Task 7: 스타일 + 최종 검증

**Files:**
- Modify: `apps/web/src/styles/trip.css`

**Interfaces:**
- Consumes: Task 2~6이 만든 클래스 이름.
- Produces: 없음.

- [ ] **Step 1: 신규 클래스 스타일을 추가한다**

`apps/web/src/styles/trip.css` **맨 끝**에 아래를 덧붙인다.

```css
/* ── 일정 탭 (3단계) ─────────────────────────────────────────── */
.date-pill-weekday {
  display: block;
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-strong);
  opacity: 0.72;
}

.date-pill-day {
  display: block;
  font-size: 1.25rem;
  font-weight: var(--font-weight-display);
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.date-pill-badge {
  display: block;
  margin-top: 2px;
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: 0.04em;
  opacity: 0.72;
}

.schedule-summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.schedule-summary {
  flex: 1;
  display: grid;
  gap: 7px;
}

.schedule-summary-count {
  margin: 0;
  color: var(--c-text);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: var(--tracking-title);
}

.schedule-summary-track {
  height: 5px;
  border-radius: 100px;
  background: var(--c-fill-strong);
  overflow: hidden;
}

.schedule-summary-fill {
  height: 100%;
  border-radius: 100px;
  background: var(--c-route);
  transform-origin: left center;
  transition: transform 0.24s var(--ease-route);
}

.schedule-reorder-toggle {
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 8px;
  border: 0;
  background: transparent;
}

.schedule-headline {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.schedule-type-tile {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--c-route-soft);
  color: var(--c-route);
}

.schedule-card.completed .schedule-type-tile {
  background: var(--c-surface-cool);
  color: var(--c-muted);
}

.schedule-headline-copy {
  flex: 1;
  min-width: 0;
}

.schedule-headline-copy h2 {
  margin: 0;
  font-size: var(--type-title-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: var(--tracking-title);
  overflow-wrap: anywhere;
}

.schedule-place {
  margin: 2px 0 0;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  overflow-wrap: anywhere;
}

.schedule-check {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  background: var(--c-surface);
  color: #c6c2ba;
}

.schedule-check.checked {
  border-color: transparent;
  background: var(--c-success-soft);
  color: var(--c-success);
}

.schedule-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.schedule-guide-memo {
  margin-top: 4px;
  font-size: var(--type-label-size);
}

.schedule-move-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.schedule-directions {
  margin-top: 12px;
}

.check-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.check-group-header h3 {
  margin: 0;
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-display);
  letter-spacing: 0.06em;
}

.check-group-count {
  color: var(--c-muted);
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-strong);
}
```

- [ ] **Step 2: 전체 검증을 돌린다**

Run: `npm --prefix apps/web run test:unit && npm --prefix apps/web run test:dependencies && npm run web:typecheck && npm run web:build`
Expected: 전부 PASS

- [ ] **Step 3: 브라우저에서 실제 렌더를 확인한다**

`mcp__Claude_Browser__preview_start`로 `web` 서버를 띄우고 `/demo`의 일정 탭에서 다음을 **실측**한다. 2단계에서 body 가로 스크롤만 보다가 카드 내부 오버플로를 놓친 전례가 있으므로, 컨테이너 기준으로 확인한다.

1. 375×812 스크린샷 — 날짜 필 3단, 요약 막대, 카드 아이콘 타일·체크 버튼.
2. `순서 편집`을 눌러 ↑↓가 나타나는지, 다시 눌러 사라지는지.
3. 195×700에서 아래를 실행해 **전부 true / 44 이상**인지 확인한다.
   ```js
   (() => {
     const card = document.querySelector('.schedule-card');
     const check = document.querySelector('.schedule-check');
     const pills = document.querySelector('.date-tabs');
     const inside = (child, parent) =>
       child.getBoundingClientRect().right <= parent.getBoundingClientRect().right + 0.5;
     return JSON.stringify({
       checkSize: check && [Math.round(check.getBoundingClientRect().width), Math.round(check.getBoundingClientRect().height)],
       checkInsideCard: check && card ? inside(check, card) : null,
       pillsScrollable: pills ? getComputedStyle(pills).overflowX : null,
       bodyNoHScroll: document.body.scrollWidth <= document.body.clientWidth,
     });
   })();
   ```
   Expected: `checkSize` 44 이상, `checkInsideCard` true, `pillsScrollable` `"auto"`, `bodyNoHScroll` true.

- [ ] **Step 4: 커밋한다**

```bash
git add apps/web/src/styles/trip.css
git commit -m "feat(web): 일정 탭 iOS 리디자인 스타일 적용"
```

---

## 최종 확인

- [ ] `npm run check` 전체 통과(Go 백엔드 포함)
- [ ] `git push` 후 PR 생성 — 제목 `feat(web): iOS 리디자인 3단계 — 일정 탭`
- [ ] PR 본문에 이 플랜과 로드맵 경로를 링크하고, 위 "확정된 설계 결정"과 "의도적인 스펙 편차"를 그대로 옮긴다
- [ ] CI `frontend build` 통과 확인(`gh pr checks <번호>`)
- [ ] 로드맵 표(`docs/superpowers/specs/2026-07-24-ios-redesign-roadmap.md:29`)의 3단계 행을 **완료**로 갱신
