# iOS 리디자인 4a단계 — 항공 탭 + 장소 상세 시트 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공용 `PlaceDetailSheet`를 만들어 일정 탭에 연결하고, 항공 탭을 보딩패스형 카드로 재구성한다.

**Architecture:** 로드맵 4단계를 둘로 나눈 앞쪽이다. 4a는 시트를 신설해 **일정 탭**에서 먼저 쓰고, 4b에서 지도 탭의 인라인 펼침을 이 시트로 교체한다. 기존 모달(`taxi-phrase-overlay`)에 이미 완성된 포커스 트랩이 있으므로 훅으로 추출해 시트와 함께 쓴다.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, lucide-react(신규 의존성 금지), 순수 CSS.

## Global Constraints

- API · DB · Go 백엔드 · 여행 데이터 스키마 · 국가별 분기 로직은 **변경하지 않는다**.
- 라우팅과 훅 계약(`useTripPageController` / `useOwnerTripPageAdapter` / `useSharedTripPageAdapter` / `tripViewState`)은 **변경하지 않는다**.
- 아이콘은 이미 설치된 `lucide-react`만 쓴다.
- 터치 영역 최소 **44px**, 글자 최소 **12px**, 의미 있는 텍스트 대비 **4.5:1 이상**. `apps/web/scripts/mobile-ui-foundations.test.mjs`가 CI에서 강제한다. 스펙의 10.5px·12.5px 수치는 12px 이상으로 올린다.
- **읽기 전용(공유 보기)에서는 상태를 바꾸는 버튼을 렌더하지 않는다.**
- 각 태스크는 끝에서 다음을 전부 통과시킨 뒤 커밋한다:
  - `npm --prefix apps/web run test:unit`
  - `npm --prefix apps/web run test:dependencies`
  - `npm run web:typecheck`

## 확정된 설계 결정 (사용자 확인 완료, 2026-08-06)

| 항목 | 결정 |
| --- | --- |
| 장소 상세 시트 도입 방식 | **인라인 펼침을 시트로 교체한다.** 다만 지도 탭 교체는 4b에서 하고, 4a에서는 시트를 만들어 일정 탭에 먼저 연결한다. |
| 애플 지도 추가 | **추가하지 않는다.** 유틸(`getDirectionUrl`의 `apple` 분기)은 있지만 국가별 분기를 늘리지 않기로 했다. 기존대로 구글(+중국이면 고덕)만 쓴다. |
| 4단계 분할 | **4a(항공 + 시트) / 4b(지도)로 나눈다.** 이 플랜은 4a다. |

## 의도적인 스펙 편차

- **애플 지도 버튼 없음.** 위 결정에 따른다. 스펙의 "액션 2개(구글/애플)"는 비중국에서 구글 1개, 중국에서 구글+고덕 2개가 된다.
- **소요시간 미표시.** 스펙은 보딩패스 중앙에 소요시간을 넣으라고 하지만, `FlightInfo`에는 출발·도착의 현지 시각만 있고 시간대 정보가 없다. 시간대를 무시하고 빼면 국제선에서 틀린 값이 나오므로 넣지 않는다.
- **예약번호 = `memo` 필드.** `FlightInfo`에 예약번호 전용 필드가 없다. 스펙의 "예약번호 `••••-••••`, 탭하면 노출"은 기존 `memo` + `MaskedText` 계약을 그대로 쓴다.
- **글자 크기 하향 미채택.** 스펙의 10.5px·12px·12.5px는 12px 최소 규칙에 맞춰 올린다.

## 파일 구조

**신규**

| 파일 | 책임 |
| --- | --- |
| `apps/web/src/shared/useDialogFocusTrap.ts` | 모달·시트 공용 포커스 트랩(열림 시 포커스 이동, Escape 닫기, Tab 순환, 이전 포커스 복원). |
| `apps/web/src/features/trip/placeCategoryIcons.ts` | 장소 범주별 lucide 아이콘 매핑. |
| `apps/web/src/features/trip/placeCategoryIcons.test.ts` | 모든 범주가 아이콘을 갖는지 검증. |
| `apps/web/src/shared/components/PlaceDetailSheet.tsx` | 장소 상세 바텀 시트. |
| `apps/web/src/shared/components/PlaceDetailSheet.test.tsx` | 내용·닫기·국가별 액션 검증. |

**수정**

| 파일 | 변경 |
| --- | --- |
| `apps/web/src/features/trip/components/tabs/MapTab.tsx` | 기존 포커스 트랩을 훅으로 대체(동작 동일). |
| `apps/web/src/features/trip/components/cards/ScheduleCard.tsx` | 길찾기 자리를 시트 열기 칩으로 교체. |
| `apps/web/src/features/trip/components/cards/ScheduleCard.test.tsx` | 시트 열기 케이스 추가. |
| `apps/web/src/features/trip/components/tabs/ScheduleTab.tsx` | 시트 상태 보유 + 렌더. |
| `apps/web/src/features/trip/components/tabs/FlightTab.tsx` | 보딩패스형 카드로 재구성. |
| `apps/web/src/styles/travel-components.css` | 시트 · 보딩패스 스타일. |

---

### Task 1: 포커스 트랩 훅 추출

`MapTab`에만 있던 모달 접근성 로직을 훅으로 꺼내 시트가 같은 동작을 쓰게 한다. 동작은 바꾸지 않는다.

**Files:**
- Create: `apps/web/src/shared/useDialogFocusTrap.ts`
- Modify: `apps/web/src/features/trip/components/tabs/MapTab.tsx:225-257`

**Interfaces:**
- Consumes: 없음.
- Produces:
  ```ts
  function useDialogFocusTrap(options: {
    isOpen: boolean;
    onClose: () => void;
    dialogRef: RefObject<HTMLElement | null>;
    initialFocusRef: RefObject<HTMLElement | null>;
  }): void
  ```

- [ ] **Step 1: 훅을 만든다**

`apps/web/src/shared/useDialogFocusTrap.ts`:

```ts
import { useEffect, type RefObject } from "react";

type DialogFocusTrapOptions = {
  isOpen: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
};

const FOCUSABLE_SELECTOR = "button, [href], [tabindex]:not([tabindex='-1'])";

/**
 * 모달과 바텀 시트가 공유하는 키보드 접근성 규칙.
 * 열리면 지정한 요소로 포커스를 옮기고, Escape로 닫고, Tab을 안에서 순환시키며,
 * 닫힐 때 원래 포커스를 되돌린다.
 */
export function useDialogFocusTrap({
  isOpen,
  onClose,
  dialogRef,
  initialFocusRef,
}: DialogFocusTrapOptions) {
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [dialogRef, initialFocusRef, isOpen, onClose]);
}
```

- [ ] **Step 2: `MapTab`이 훅을 쓰게 바꾼다**

`MapTab.tsx`의 `useEffect(() => { if (!phraseModal.open) return; ... }, [phraseModal.open]);` 블록(225-257행) 전체를 **삭제**하고 아래로 교체한다.

```tsx
  const closePhraseModal = useCallback(() => {
    setPhraseModal({ open: false, title: "", address: "" });
  }, []);

  useDialogFocusTrap({
    dialogRef,
    initialFocusRef: closeButtonRef,
    isOpen: phraseModal.open,
    onClose: closePhraseModal,
  });
```

import에 `useCallback`과 훅을 추가한다:

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDialogFocusTrap } from "../../../../shared/useDialogFocusTrap";
```

기존 닫기 버튼의 `onClick={() => setPhraseModal({ open: false, title: "", address: "" })}`도 `onClick={closePhraseModal}`로 바꾼다.

> `useEffect`/`useMemo`가 파일의 다른 곳에서 계속 쓰이면 import에 남긴다. 쓰이지 않으면 지운다 — `npm run web:typecheck`가 미사용 import를 잡아 준다.

- [ ] **Step 3: 지도 탭 회귀를 확인한다**

Run: `npm --prefix apps/web run test:unit -- MapTab SharedTripPage`
Expected: PASS

- [ ] **Step 4: 커밋한다**

```bash
git add apps/web/src/shared/useDialogFocusTrap.ts apps/web/src/features/trip/components/tabs/MapTab.tsx
git commit -m "refactor(web): 모달 포커스 트랩을 공용 훅으로 추출"
```

---

### Task 2: 장소 범주 아이콘 매핑

**Files:**
- Create: `apps/web/src/features/trip/placeCategoryIcons.ts`
- Create: `apps/web/src/features/trip/placeCategoryIcons.test.ts`

**Interfaces:**
- Consumes: 없음.
- Produces: `placeCategoryIcons: Record<PlaceCategory, LucideIcon>`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/features/trip/placeCategoryIcons.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { placeCategoryLabels } from "../../shared/travelOptions";
import { placeCategoryIcons } from "./placeCategoryIcons";

describe("placeCategoryIcons", () => {
  it("모든 장소 범주에 아이콘이 있다", () => {
    for (const category of Object.keys(placeCategoryLabels)) {
      expect(placeCategoryIcons[category as keyof typeof placeCategoryIcons]).toBeTruthy();
    }
  });

  it("라벨과 아이콘의 범주 목록이 정확히 일치한다", () => {
    expect(Object.keys(placeCategoryIcons).sort()).toEqual(Object.keys(placeCategoryLabels).sort());
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- placeCategoryIcons`
Expected: FAIL — `Failed to resolve import "./placeCategoryIcons"`

- [ ] **Step 3: 매핑을 만든다**

`apps/web/src/features/trip/placeCategoryIcons.ts`:

```ts
import {
  BedDouble,
  Bus,
  Camera,
  Coffee,
  Flag,
  MapPin,
  ShoppingBag,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { PlaceCategory } from "../../types/travel";

// 장소 상세 시트의 아이콘 타일에 쓴다.
export const placeCategoryIcons: Record<PlaceCategory, LucideIcon> = {
  hotel: BedDouble,
  meal: Utensils,
  golf: Flag,
  cafe: Coffee,
  sightseeing: Camera,
  shopping: ShoppingBag,
  transport: Bus,
  etc: MapPin,
};
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- placeCategoryIcons`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/placeCategoryIcons.ts apps/web/src/features/trip/placeCategoryIcons.test.ts
git commit -m "feat(web): 장소 범주별 아이콘 매핑 추가"
```

---

### Task 3: 장소 상세 시트

**Files:**
- Create: `apps/web/src/shared/components/PlaceDetailSheet.tsx`
- Create: `apps/web/src/shared/components/PlaceDetailSheet.test.tsx`

**Interfaces:**
- Consumes: Task 1의 `useDialogFocusTrap`, Task 2의 `placeCategoryIcons`.
- Produces: `PlaceDetailSheet` 컴포넌트.
  ```ts
  type PlaceDetailSheetProps = {
    destinationCountry?: string;
    onClose: () => void;
    place: Place;
  };
  ```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/shared/components/PlaceDetailSheet.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlaceDetailSheet } from "./PlaceDetailSheet";

const place = {
  id: "place-1",
  name: "센간엔 정원",
  category: "sightseeing" as const,
  address: "가고시마시 요시노초 9700-1",
  latitude: 31.62,
  longitude: 130.57,
  recommendedReason: "사쿠라지마가 정원 너머로 보입니다.",
};

describe("PlaceDetailSheet", () => {
  it("장소 이름과 설명, 주소를 보여준다", () => {
    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);

    expect(screen.getByRole("heading", { name: "센간엔 정원" })).toBeVisible();
    expect(screen.getByText("사쿠라지마가 정원 너머로 보입니다.")).toBeVisible();
    expect(screen.getByText("가고시마시 요시노초 9700-1")).toBeVisible();
  });

  it("구글 지도 길찾기 링크를 제공한다", () => {
    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);

    const link = screen.getByRole("link", { name: /Google 지도/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("href")).toContain("google.com");
  });

  it("중국 목적지에서는 고덕지도 링크도 함께 제공한다", () => {
    render(<PlaceDetailSheet destinationCountry="CN" onClose={vi.fn()} place={place} />);

    expect(screen.getByRole("link", { name: /고덕지도/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Google 지도/ })).toBeVisible();
  });

  it("중국이 아니면 고덕지도 링크를 넣지 않는다", () => {
    render(<PlaceDetailSheet destinationCountry="JP" onClose={vi.fn()} place={place} />);

    expect(screen.queryByRole("link", { name: /고덕지도/ })).not.toBeInTheDocument();
  });

  it("닫기 버튼을 누르면 닫힘을 알린다", async () => {
    const onClose = vi.fn();
    render(<PlaceDetailSheet onClose={onClose} place={place} />);

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape 키로도 닫을 수 있다", async () => {
    const onClose = vi.fn();
    render(<PlaceDetailSheet onClose={onClose} place={place} />);

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("현지어 이름이 있으면 함께 보여준다", () => {
    render(
      <PlaceDetailSheet
        destinationCountry="CN"
        onClose={vi.fn()}
        place={{ ...place, chineseName: "仙巌园" }}
      />,
    );

    expect(screen.getByText("仙巌园")).toBeVisible();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- PlaceDetailSheet`
Expected: FAIL — `Failed to resolve import "./PlaceDetailSheet"`

- [ ] **Step 3: 컴포넌트를 만든다**

`apps/web/src/shared/components/PlaceDetailSheet.tsx`:

```tsx
import { useRef } from "react";
import { Map, X } from "lucide-react";
import { placeCategoryIcons } from "../../features/trip/placeCategoryIcons";
import type { Place } from "../../types/travel";
import { getAmapDirectionsUrl, getGoogleDirectionsUrl, getPlaceMarkerUrl } from "../../utils/mapLinks";
import { placeCategoryLabels } from "../travelOptions";
import { useDialogFocusTrap } from "../useDialogFocusTrap";

type PlaceDetailSheetProps = {
  destinationCountry?: string;
  onClose: () => void;
  place: Place;
};

// 장소 상세 바텀 시트. 지도·일정 어디서 열어도 같은 정보와 같은 길찾기 흐름을 준다.
export function PlaceDetailSheet({ destinationCountry, onClose, place }: PlaceDetailSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ dialogRef, initialFocusRef: closeButtonRef, isOpen: true, onClose });

  const CategoryIcon = placeCategoryIcons[place.category];
  const displayAddress = place.chineseAddress || place.address;
  const isChina = destinationCountry === "CN";
  const amapDirectionsUrl = isChina ? getAmapDirectionsUrl(place) : undefined;
  const amapUrl = isChina ? amapDirectionsUrl || getPlaceMarkerUrl("amap", place) : undefined;

  return (
    <div className="place-sheet-backdrop">
      <div
        aria-label={`${place.name} 상세`}
        aria-modal="true"
        className="place-sheet"
        ref={dialogRef}
        role="dialog"
      >
        <span aria-hidden="true" className="place-sheet-handle" />

        <div className="place-sheet-heading">
          <span aria-hidden="true" className="place-sheet-tile">
            <CategoryIcon size={22} />
          </span>
          <div className="place-sheet-title-copy">
            <h2>{place.name}</h2>
            <p className="place-sheet-category">{placeCategoryLabels[place.category]}</p>
            {place.chineseName && <p className="place-sheet-local">{place.chineseName}</p>}
          </div>
        </div>

        {place.recommendedReason && <p className="place-sheet-description">{place.recommendedReason}</p>}

        {displayAddress && (
          <div className="place-sheet-address">
            <span className="place-sheet-address-label">주소</span>
            <p>{displayAddress}</p>
          </div>
        )}

        <div className="place-sheet-actions">
          {amapUrl && (
            <a
              className="primary-button place-sheet-action"
              href={amapUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Map aria-hidden="true" size={16} />
              {amapDirectionsUrl ? "고덕지도" : "고덕지도 위치 보기"}
            </a>
          )}
          <a
            className={`${amapUrl ? "secondary-button" : "primary-button"} place-sheet-action`}
            href={getGoogleDirectionsUrl(place)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Map aria-hidden="true" size={16} />
            Google 지도
          </a>
        </div>

        <button className="place-sheet-close" onClick={onClose} ref={closeButtonRef} type="button">
          <X aria-hidden="true" size={16} />
          닫기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- PlaceDetailSheet`
Expected: PASS (7 tests)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/shared/components/PlaceDetailSheet.tsx apps/web/src/shared/components/PlaceDetailSheet.test.tsx
git commit -m "feat(web): 장소 상세 바텀 시트 추가"
```

---

### Task 4: 일정 카드에서 시트 열기

3단계에서 "4단계로 미룬다"고 적어 둔 항목이다. 카드 안 길찾기 펼침을 시트 열기 칩으로 바꾼다.

**Files:**
- Modify: `apps/web/src/features/trip/components/cards/ScheduleCard.tsx`
- Modify: `apps/web/src/features/trip/components/cards/ScheduleCard.test.tsx`
- Modify: `apps/web/src/features/trip/components/tabs/ScheduleTab.tsx`

**Interfaces:**
- Consumes: Task 3의 `PlaceDetailSheet`.
- Produces: `ScheduleCard`의 props에서 `destinationCountry`가 빠지고 `onOpenPlace?: (place: Place) => void`가 **추가**된다.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`ScheduleCard.test.tsx` 끝에 덧붙인다.

```tsx
describe("ScheduleCard 장소 시트 연결", () => {
  const place = {
    id: "place-1",
    name: "센간엔 정원",
    category: "sightseeing" as const,
  };

  it("장소가 있으면 길찾기 칩으로 시트를 연다", async () => {
    const onOpenPlace = vi.fn();
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "schedule-1",
          date: "2026-08-20",
          time: "10:30",
          type: "sightseeing" as const,
          title: "센간엔 정원 관람",
          placeId: "place-1",
        }}
        onMove={vi.fn()}
        onOpenPlace={onOpenPlace}
        onToggleComplete={vi.fn()}
        place={place}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "센간엔 정원 길찾기" }));

    expect(onOpenPlace).toHaveBeenCalledWith(place);
  });

  it("연결된 장소가 없으면 길찾기 칩을 넣지 않는다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "schedule-2",
          date: "2026-08-20",
          time: "12:00",
          type: "etc" as const,
          title: "자유 시간",
        }}
        onMove={vi.fn()}
        onOpenPlace={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /길찾기/ })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- ScheduleCard`
Expected: FAIL — `Unable to find an accessible element with the role "button" and name "센간엔 정원 길찾기"`

- [ ] **Step 3: `ScheduleCard`를 고친다**

import에서 `MapDirectionsChoice`를 **지우고** props를 바꾼다.

```tsx
import { ArrowDown, ArrowUp, Check, Navigation } from "lucide-react";
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
  onMove: (scheduleID: string, direction: "up" | "down") => void;
  onOpenPlace?: (place: Place) => void;
  onToggleComplete: (scheduleID: string) => void;
  place?: Place;
  showGuideMemo?: boolean;
};
```

구조 분해에서 `destinationCountry`를 빼고 `onOpenPlace`를 넣는다. 그리고 카드 끝의 길찾기 블록을 교체한다.

```tsx
        {place && onOpenPlace && (
          <div className="schedule-directions">
            <button
              aria-label={`${place.name} 길찾기`}
              className="schedule-directions-chip"
              onClick={() => onOpenPlace(place)}
              type="button"
            >
              <Navigation aria-hidden="true" size={15} />
              길찾기
            </button>
          </div>
        )}
```

- [ ] **Step 4: `ScheduleTab`이 시트를 갖게 한다**

import를 추가한다:

```tsx
import type { Place } from "../../../../types/travel";
import { PlaceDetailSheet } from "../../../../shared/components/PlaceDetailSheet";
```

`const [isReordering, setIsReordering] = useState(false);` 아래에 추가한다:

```tsx
  const [sheetPlace, setSheetPlace] = useState<Place | null>(null);
```

`<ScheduleCard ... />`에서 `destinationCountry={trip.destinationCountry}`를 지우고 아래를 넣는다:

```tsx
                    onOpenPlace={setSheetPlace}
```

`</section>` 바로 앞(컴포넌트 최상위 `<section className="screen">`의 닫는 태그 앞)에 시트를 렌더한다:

```tsx
      {sheetPlace && (
        <PlaceDetailSheet
          destinationCountry={trip.destinationCountry}
          onClose={() => setSheetPlace(null)}
          place={sheetPlace}
        />
      )}
```

- [ ] **Step 5: 테스트와 타입 검사를 돌린다**

Run: `npm --prefix apps/web run test:unit && npm run web:typecheck`
Expected: 전부 PASS, 타입 오류 없음

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/features/trip/components/cards/ScheduleCard.tsx apps/web/src/features/trip/components/cards/ScheduleCard.test.tsx apps/web/src/features/trip/components/tabs/ScheduleTab.tsx
git commit -m "feat(web): 일정 카드 길찾기를 장소 상세 시트로 연결"
```

---

### Task 5: 항공 탭 보딩패스 카드

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/FlightTab.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: 없음(내부 구조 변경).

- [ ] **Step 1: `FlightJourneyCard`를 보딩패스 구조로 바꾼다**

`FlightTab.tsx`의 `FlightJourneyCard` 함수 전체를 아래로 교체한다. `displayFlightDate` 헬퍼는 그대로 둔다.

```tsx
function FlightJourneyCard({ flight, getDisplayDate }: FlightCardProps) {
  const departureDate = displayFlightDate(flight.date, getDisplayDate);
  const arrivalDate = displayFlightDate(flight.arrivalDate, getDisplayDate);
  const isReturn = flight.direction === "return";

  return (
    <article className="flight-journey-card">
      <header className={`flight-journey-header${isReturn ? " return" : ""}`}>
        <span className="flight-journey-label">{flight.label}</span>
        <span className="flight-journey-date">{departureDate}</span>
      </header>

      <div className="flight-route" aria-label={`${flight.label} 항공 노선`}>
        <div className="flight-route-point">
          <span>출발</span>
          <strong>{flight.departureAirport || "출발 공항 미등록"}</strong>
          <b>{flight.time || "시각 미등록"}</b>
        </div>
        <div className="flight-route-line" aria-hidden="true">
          <span />
          <Plane size={18} />
        </div>
        <div className="flight-route-point arrival">
          <span>도착</span>
          <strong>{flight.arrivalAirport || "도착 공항 미등록"}</strong>
          <b>{flight.arrivalTime || "도착 시각 미등록"}</b>
        </div>
      </div>

      <dl className="flight-journey-facts">
        <div>
          <dt>항공사 · 편명</dt>
          <dd>
            {flight.airline || "항공사 미등록"} {flight.flightNumber || ""}
          </dd>
        </div>
        <div>
          <dt>도착 날짜</dt>
          <dd>{flight.arrivalDate ? arrivalDate : "도착 날짜 미등록"}</dd>
        </div>
        {flight.memo && (
          <div>
            <dt>예약 정보</dt>
            <dd>
              <MaskedText text={flight.memo} />
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
```

- [ ] **Step 2: 항공 탭 회귀를 확인한다**

Run: `npm --prefix apps/web run test:unit -- FlightTab SharedTripPage OwnerTripViewPage`
Expected: PASS. 실패하면 바뀐 문구에 맞춰 해당 테스트의 기대값을 고친다(단, 접근 가능한 이름을 임의로 바꾸지 말고 실제로 무엇이 깨졌는지 먼저 확인한다).

- [ ] **Step 3: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/FlightTab.tsx
git commit -m "feat(web): 항공편 카드를 보딩패스 구조로 재구성"
```

---

### Task 6: 스타일 + 최종 검증

**Files:**
- Modify: `apps/web/src/styles/travel-components.css`

- [ ] **Step 1: 시트와 보딩패스 스타일을 추가한다**

`apps/web/src/styles/travel-components.css` **맨 끝**에 덧붙인다.

```css
/* ── 장소 상세 시트 (4a단계) ─────────────────────────────────── */
.place-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(24, 26, 32, 0.36);
}

.place-sheet {
  width: min(100%, 390px);
  max-height: 86vh;
  overflow-y: auto;
  padding: 10px 22px calc(30px + env(safe-area-inset-bottom));
  border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
  background: var(--c-surface);
  box-shadow: var(--shadow-overlay);
}

.place-sheet-handle {
  display: block;
  width: 38px;
  height: 5px;
  margin: 0 auto 16px;
  border-radius: 100px;
  background: #e0dcd4;
}

.place-sheet-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.place-sheet-tile {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--c-route-soft);
  color: var(--c-route);
}

.place-sheet-title-copy {
  flex: 1;
  min-width: 0;
}

.place-sheet-title-copy h2 {
  margin: 0;
  font-size: var(--type-headline-size);
  font-weight: var(--font-weight-display);
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.place-sheet-category,
.place-sheet-local {
  margin: 2px 0 0;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
}

.place-sheet-description {
  margin: 14px 0 0;
  color: var(--c-ink-muted);
  font-size: var(--type-body-size);
  line-height: 1.6;
}

.place-sheet-address {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--c-bg);
}

.place-sheet-address-label {
  display: block;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-display);
  letter-spacing: 0.06em;
}

.place-sheet-address p {
  margin: 6px 0 0;
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-medium);
  overflow-wrap: anywhere;
}

.place-sheet-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.place-sheet-action {
  flex: 1 1 140px;
  min-height: 50px;
  border-radius: 15px;
  text-decoration: none;
}

.place-sheet-close {
  width: 100%;
  min-height: 44px;
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
}

.schedule-directions-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 100px;
  background: var(--c-route-soft);
  color: var(--c-route);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
}

/* ── 보딩패스 카드 (4a단계) ─────────────────────────────────── */
.flight-journey-header {
  justify-content: space-between;
}

.flight-journey-header.return {
  background: var(--c-bg);
  color: var(--c-ink-muted);
}

.flight-journey-label {
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-display);
  letter-spacing: 0.04em;
}

.flight-journey-date {
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-strong);
}

.flight-journey-facts {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 14px 18px calc(16px + env(safe-area-inset-bottom, 0px));
  border-top: 1px dashed #e6e2dc;
}

.flight-journey-facts > div {
  display: grid;
  gap: 3px;
}

.flight-journey-facts dt {
  color: var(--c-muted);
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-display);
  letter-spacing: 0.04em;
}

.flight-journey-facts dd {
  margin: 0;
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
  overflow-wrap: anywhere;
}
```

- [ ] **Step 2: 전체 검증을 돌린다**

Run: `npm --prefix apps/web run test:unit && npm --prefix apps/web run test:dependencies && npm run web:typecheck && npm run web:build`
Expected: 전부 PASS

- [ ] **Step 3: 브라우저에서 실제 렌더를 확인한다**

`/demo`에서 아래를 **컨테이너 기준으로** 실측한다(body 가로 스크롤만 보면 내부 이탈을 놓친다).

1. 375×812 일정 탭 — 길찾기 칩을 눌러 시트가 열리는지 스크린샷.
2. 시트에서 Escape로 닫히는지, 닫은 뒤 포커스가 칩으로 돌아오는지.
3. 항공 탭 보딩패스 카드 스크린샷.
4. 195×700에서 아래 실행 — 전부 true / 44 이상이어야 한다.
   ```js
   (() => {
     const sheet = document.querySelector('.place-sheet');
     const close = document.querySelector('.place-sheet-close');
     const actions = [...document.querySelectorAll('.place-sheet-action')];
     const overflow = (el) => el.scrollWidth > el.clientWidth + 1;
     return JSON.stringify({
       sheetNoHOverflow: sheet ? !overflow(sheet) : null,
       closeMinHeight: close && Math.round(close.getBoundingClientRect().height),
       actionsInside: sheet ? actions.every((a) => a.getBoundingClientRect().right <= sheet.getBoundingClientRect().right + 0.5) : null,
       bodyNoHScroll: document.body.scrollWidth <= document.body.clientWidth,
     });
   })();
   ```

- [ ] **Step 4: 커밋한다**

```bash
git add apps/web/src/styles/travel-components.css
git commit -m "feat(web): 장소 상세 시트와 보딩패스 카드 스타일 적용"
```

---

## 최종 확인

- [ ] `npm run check` 전체 통과(Go 백엔드 포함)
- [ ] `git push` 후 PR 생성 — 제목 `feat(web): iOS 리디자인 4a단계 — 항공 탭 + 장소 상세 시트`
- [ ] PR 본문에 이 플랜과 로드맵 경로를 링크하고 "확정된 설계 결정"·"의도적인 스펙 편차"를 옮긴다
- [ ] CI `frontend build` 통과 확인
- [ ] 로드맵 4단계 행에 4a 완료 / 4b 예정을 표시
