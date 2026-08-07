# iOS 리디자인 4b단계 — 지도 탭 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지도 탭의 인라인 펼침을 4a에서 만든 `PlaceDetailSheet`로 교체하고, 지도 프레임과 핀을 새 팔레트·스펙에 맞춘다.

**Architecture:** 4a에서 시트를 만들어 일정 탭에 연결했다. 4b는 그 시트가 지도 탭의 장소 관련 행동(길찾기 · 주소 복사 · 기사님께 보기)을 전부 흡수하게 하고, 지도 탭에서 중복 UI(`SelectedDestinationPanel` 상세부, `SavedPlaceDisclosure` 펼침)를 걷어낸다.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, lucide-react(신규 의존성 금지), 순수 CSS.

## Global Constraints

- API · DB · Go 백엔드 · 여행 데이터 스키마 · 국가별 분기 로직은 **변경하지 않는다**.
- 라우팅과 훅 계약은 **변경하지 않는다**.
- 터치 영역 최소 **44px**, 글자 최소 **12px**, 대비 **4.5:1 이상**. `apps/web/scripts/mobile-ui-foundations.test.mjs`가 CI에서 강제한다. 스펙의 10.5px·12.5px는 12px 이상으로 올린다.
- **읽기 전용(공유 보기)에서는 상태를 바꾸는 버튼을 렌더하지 않는다.**
- 아래 기존 계약을 깨지 않는다:
  - `apps/web/src/features/share/SharedTripPage.test.tsx:178` — 지도 탭에 `저장 장소 지도` 라벨이 보인다.
  - `apps/web/src/features/share/SharedTripPage.test.tsx:179` — 지도 탭을 열면 **현지어(`人民广场`)가 바로 보인다.** 시트를 열지 않아도 보여야 하므로 저장 장소 행의 부제에 현지어를 남긴다(스펙의 "현지어 · 주소" 부제와 일치).
  - `apps/web/src/features/share/SharedTripPage.test.tsx:219` — 지도 탭을 다시 열어도 Google 지도 객체를 중복 생성하지 않는다.
- 각 태스크는 끝에서 다음을 전부 통과시킨 뒤 커밋한다:
  - `npm --prefix apps/web run test:unit`
  - `npm --prefix apps/web run test:dependencies`
  - `npm run web:typecheck`

## 확정된 설계 결정 (사용자 확인 완료, 2026-08-06)

| 항목 | 결정 |
| --- | --- |
| 인라인 패널의 주소 복사 · 기사님께 보기 | **시트 안으로 함께 옮긴다.** 시트가 장소 관련 행동을 전부 갖게 되어, 일정 탭에서 열어도 같은 기능을 쓴다. |
| 지도 핀 색 · 지도 프레임 | **둘 다 고친다.** 핀을 새 팔레트로 바꾸고 지도 영역도 스펙 비율로 정리한다. |

## 1단계에서 놓친 버그 (이번에 함께 고침)

`TravelMap.tsx:180, 198`이 핀 색을 **옛 Pocket Atlas 팔레트로 하드코딩**하고 있다 — `#C94F3D`(옛 코랄), `#0B6F6A`(옛 청록), `#17333D`(옛 잉크). CSS 변수가 아니라 JS 문자열이라 1단계 토큰 교체 때 바뀌지 않았고 4a까지 그대로 남아 있었다. 지도만 옛 색으로 보이는 상태다.

## 의도적인 스펙 편차

- **커스텀 HTML 핀 미도입.** 스펙은 30px 원형 + 흰 아이콘 + 라벨을 요구하지만, 현재 핀은 Google Maps의 `PinElement`/`LegacyMarker`로 그린다. 임의 HTML 핀으로 바꾸면 두 렌더 경로(Advanced/Legacy 폴백)를 모두 다시 만들어야 해 위험 대비 이득이 적다. **색만 새 팔레트로 맞춘다.**
- **지도 컨트롤 2개 미도입.** 스펙의 우상단 사각 버튼 2개(내 위치 / 레이어) 중 내 위치는 이미 툴바에 있고, 레이어 전환은 대응하는 기능이 없다. 기존 툴바를 유지한다.
- **핀 탭은 시트를 바로 열지 않는다.** 스펙은 "핀 탭 → 장소 시트"지만, 핀 탭은 지금 지도 중심 이동과 동선 정류장 선택을 함께 담당한다. 지도를 훑는 동안 탭할 때마다 시트가 덮이면 오히려 방해가 되므로, 핀 탭은 기존대로 선택만 하고 선택된 목적지 카드의 버튼으로 시트를 연다(탭 두 번).

## 파일 구조

**수정**

| 파일 | 변경 |
| --- | --- |
| `apps/web/src/shared/map/mapModel.ts` | 핀 색을 토큰 값으로 돌려주도록 확장. |
| `apps/web/src/shared/map/mapModel.test.ts` | 핀 색 계약 검증(신규 케이스). |
| `apps/web/src/shared/components/TravelMap.tsx` | 하드코딩된 옛 색 제거. |
| `apps/web/src/shared/components/PlaceDetailSheet.tsx` | 주소 복사 · 기사님께 보기 흡수. |
| `apps/web/src/shared/components/PlaceDetailSheet.test.tsx` | 복사·기사님 모드 케이스 추가. |
| `apps/web/src/features/trip/components/tabs/MapTab.tsx` | 인라인 펼침 제거, 시트 연결. |
| `apps/web/src/styles/map.css` | 지도 프레임 · 저장 장소 행 스타일. |

---

### Task 1: 핀 색을 새 팔레트로

**Files:**
- Modify: `apps/web/src/shared/map/mapModel.ts:38-45`
- Modify: `apps/web/src/shared/map/mapModel.test.ts`
- Modify: `apps/web/src/shared/components/TravelMap.tsx:180, 198`

**Interfaces:**
- Consumes: 없음.
- Produces: `getMarkerAppearance`가 `color: string`(hex)을 추가로 돌려준다. `MARKER_COLORS` 상수도 내보낸다.

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`apps/web/src/shared/map/mapModel.test.ts` 끝에 덧붙인다. 파일이 없으면 아래 내용으로 만든다(상단 import는 기존 파일에 맞춘다).

```ts
describe("getMarkerAppearance 핀 색", () => {
  it("선택한 핀과 일반 핀에 서로 다른 새 팔레트 색을 준다", () => {
    const selected = getMarkerAppearance("place-1", "place-1");
    const normal = getMarkerAppearance("place-2", "place-1");

    expect(selected.color).toBe(MARKER_COLORS.destination);
    expect(normal.color).toBe(MARKER_COLORS.route);
    expect(selected.color).not.toBe(normal.color);
  });

  it("핀 색에 1단계 이전의 옛 팔레트 값이 남아 있지 않다", () => {
    const legacyPalette = ["#C94F3D", "#0B6F6A", "#17333D"];

    for (const color of Object.values(MARKER_COLORS)) {
      expect(legacyPalette).not.toContain(color.toUpperCase());
    }
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- mapModel`
Expected: FAIL — `MARKER_COLORS`를 찾을 수 없다

- [ ] **Step 3: `mapModel.ts`를 고친다**

`getMarkerAppearance` 위에 상수를 추가하고 반환값에 `color`를 더한다.

```ts
/**
 * 지도 핀은 Google Maps에 문자열로 넘겨야 해서 CSS 변수를 쓸 수 없다.
 * tokens.css의 --c-destination / --c-route / --c-text와 값을 맞춰 둔다.
 * 팔레트를 바꿀 때 여기도 함께 고쳐야 지도만 옛 색으로 남지 않는다.
 */
export const MARKER_COLORS = {
  destination: "#437033",
  route: "#2e4374",
  currentLocation: "#191b1f",
} as const;

export function getMarkerAppearance(placeID: string, selectedPlaceID: string) {
  const selected = placeID === selectedPlaceID;
  return {
    background: selected ? "destination" : "route",
    color: selected ? MARKER_COLORS.destination : MARKER_COLORS.route,
    scale: selected ? 1.15 : 1,
    selected,
  } as const;
}
```

- [ ] **Step 4: `TravelMap.tsx`의 하드코딩을 지운다**

180행을 교체한다:

```tsx
        background: appearance.color,
```

198행을 교체한다:

```tsx
          background: MARKER_COLORS.currentLocation,
```

`mapModel`에서 가져오는 import에 `MARKER_COLORS`를 추가한다.

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- mapModel TravelMap SharedTripPage`
Expected: PASS

- [ ] **Step 6: 커밋한다**

```bash
git add apps/web/src/shared/map/mapModel.ts apps/web/src/shared/map/mapModel.test.ts apps/web/src/shared/components/TravelMap.tsx
git commit -m "fix(web): 지도 핀에 남아 있던 옛 팔레트 색을 새 토큰 값으로 교체"
```

---

### Task 2: 시트가 주소 복사와 기사님께 보기를 흡수

시트가 장소 관련 행동을 전부 갖게 한다. props는 늘리지 않는다 — 복사는 시트가 직접 처리하고, 기사님께 보기는 시트 내부 모드로 만든다(중첩 모달을 만들지 않는다).

**Files:**
- Modify: `apps/web/src/shared/components/PlaceDetailSheet.tsx`
- Modify: `apps/web/src/shared/components/PlaceDetailSheet.test.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: props 변경 없음(`destinationCountry` · `onClose` · `place` 그대로).

- [ ] **Step 1: 실패하는 테스트를 추가한다**

`PlaceDetailSheet.test.tsx` 끝에 덧붙인다.

```tsx
describe("PlaceDetailSheet 장소 행동", () => {
  it("주소 복사 버튼을 누르면 클립보드에 주소를 넣는다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);
    await userEvent.click(screen.getByRole("button", { name: "주소 복사" }));

    expect(writeText).toHaveBeenCalledWith("가고시마시 요시노초 9700-1");
  });

  it("클립보드를 쓸 수 없으면 직접 복사하라고 안내한다", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });

    render(<PlaceDetailSheet onClose={vi.fn()} place={place} />);
    await userEvent.click(screen.getByRole("button", { name: "주소 복사" }));

    expect(screen.getByRole("alert")).toHaveTextContent("길게 눌러");
  });

  it("중국 목적지에서는 기사님께 보여줄 큰 글씨 화면을 시트 안에서 연다", async () => {
    render(
      <PlaceDetailSheet
        destinationCountry="CN"
        onClose={vi.fn()}
        place={{ ...place, chineseName: "仙巌园", chineseAddress: "上海市浦东新区" }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "기사님께 보기" }));

    expect(screen.getByText("택시 기사님께 보여주세요")).toBeVisible();
    expect(screen.getByRole("heading", { name: "仙巌园" })).toBeVisible();
    expect(screen.getByText("上海市浦东新区")).toBeVisible();
  });

  it("기사님께 보기에서 돌아오면 원래 상세로 복귀한다", async () => {
    render(
      <PlaceDetailSheet
        destinationCountry="CN"
        onClose={vi.fn()}
        place={{ ...place, chineseName: "仙巌园" }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "기사님께 보기" }));
    await userEvent.click(screen.getByRole("button", { name: "장소 정보로 돌아가기" }));

    expect(screen.getByRole("link", { name: /Google 지도/ })).toBeVisible();
  });

  it("중국이 아니면 기사님께 보기를 넣지 않는다", () => {
    render(<PlaceDetailSheet destinationCountry="JP" onClose={vi.fn()} place={place} />);

    expect(screen.queryByRole("button", { name: "기사님께 보기" })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- PlaceDetailSheet`
Expected: FAIL — `주소 복사` 버튼을 찾을 수 없다

- [ ] **Step 3: 시트를 고친다**

`PlaceDetailSheet.tsx`에서 import와 상태를 늘리고, 본문을 두 모드로 나눈다.

import에 아이콘과 `useState`를 추가한다:

```tsx
import { useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Map, Maximize2, X } from "lucide-react";
```

컴포넌트 안, `useDialogFocusTrap` 호출 아래에 추가한다:

```tsx
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [isPhraseMode, setIsPhraseMode] = useState(false);
```

기존 값 계산부 아래에 복사 핸들러를 넣는다:

```tsx
  const copyTarget = place.chineseAddress || place.address || "";

  const handleCopyAddress = async () => {
    if (!navigator.clipboard) {
      setCopyError("이 브라우저에서는 주소 복사를 지원하지 않습니다. 주소를 길게 눌러 직접 복사해 주세요.");
      return;
    }
    try {
      await navigator.clipboard.writeText(copyTarget);
      setCopyError("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("주소를 복사하지 못했습니다. 주소를 길게 눌러 직접 복사해 주세요.");
    }
  };
```

`<span className="place-sheet-handle" />` 다음부터 닫기 버튼 앞까지를, 모드에 따라 갈라지도록 바꾼다. **기사님 모드**일 때:

```tsx
        {isPhraseMode ? (
          <div className="place-sheet-phrase">
            <p className="place-sheet-phrase-label">택시 기사님께 보여주세요</p>
            <h2 className="place-sheet-phrase-title">{place.chineseName || place.name}</h2>
            <p className="place-sheet-phrase-label">현지 주소</p>
            <p className="place-sheet-phrase-address">
              {place.chineseAddress || place.address || "주소 정보 없음"}
            </p>
            <button
              className="secondary-button place-sheet-action"
              onClick={() => setIsPhraseMode(false)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              장소 정보로 돌아가기
            </button>
          </div>
        ) : (
          <>
```

기존 본문(heading · description · address · actions)을 이 `<>` 안에 그대로 두고, `actions` 블록 **뒤에** 아래를 넣은 다음 `</>`{`}`}로 닫는다:

```tsx
            <div className="place-sheet-utilities">
              {copyTarget && (
                <button className="secondary-button place-sheet-action" onClick={() => void handleCopyAddress()} type="button">
                  {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
                  주소 복사
                </button>
              )}
              {isChina && (
                <button
                  className="secondary-button place-sheet-action"
                  onClick={() => setIsPhraseMode(true)}
                  type="button"
                >
                  <Maximize2 aria-hidden="true" size={16} />
                  기사님께 보기
                </button>
              )}
            </div>

            {copyError && (
              <p className="place-sheet-copy-error" role="alert">
                {copyError}
              </p>
            )}
          </>
        )}
```

> `주소 복사` 버튼의 접근 가능한 이름은 복사 성공 후에도 `주소 복사`로 유지한다(아이콘만 바뀐다). 이름이 바뀌면 화면 읽기 프로그램 사용자가 같은 버튼을 잃어버린다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- PlaceDetailSheet`
Expected: PASS (12 tests — 기존 7 + 신규 5)

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/shared/components/PlaceDetailSheet.tsx apps/web/src/shared/components/PlaceDetailSheet.test.tsx
git commit -m "feat(web): 장소 시트가 주소 복사와 기사님께 보기를 함께 제공"
```

---

### Task 3: 지도 탭을 시트로 전환

`SelectedDestinationPanel`의 상세부와 `SavedPlaceDisclosure`의 펼침을 걷어내고, 두 곳 모두 시트를 열게 한다.

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/MapTab.tsx`

**Interfaces:**
- Consumes: Task 2의 `PlaceDetailSheet`.
- Produces: 없음.

- [ ] **Step 1: 더 이상 쓰지 않는 조각을 지운다**

`MapTab.tsx`에서 아래를 **삭제**한다.

- `PlaceUtilityActions` 함수 전체
- `SelectedDestinationPanel` 함수 전체
- `SavedPlaceDisclosure` 함수 전체
- `phraseModal` 상태와 `closePhraseModal` · `showPhrase` · `handleCopyAddress` · `copiedPlaceID` · `copyError` 상태
- `useDialogFocusTrap` 호출과 `dialogRef` · `closeButtonRef`
- 파일 끝의 `taxi-phrase-overlay` 블록 전체
- `.map-copy-error` 문단

`PlaceEssentials`는 계속 쓰므로 **남긴다**.

- [ ] **Step 2: 시트 상태를 추가한다**

`const [selectedPlaceID, setSelectedPlaceID] = useState("");` 아래에 넣는다.

```tsx
  const [sheetPlace, setSheetPlace] = useState<Place | null>(null);
```

import를 정리한다(지워진 아이콘 제거, 시트 추가):

```tsx
import { useState } from "react";
import { CalendarDays, CheckCircle2, ChevronRight, MapPin } from "lucide-react";
import { PlaceDetailSheet } from "../../../../shared/components/PlaceDetailSheet";
```

`AlertTriangle` · `Train`은 `PlaceEssentials`가 계속 쓰므로 남긴다. `Check` · `Copy` · `Maximize2` · `ChevronDown` · `X` · `useCallback` · `useRef` · `MapDirectionsChoice` · `useDialogFocusTrap`은 지운다. `npm run web:typecheck`가 남은 미사용 import를 잡아 준다.

- [ ] **Step 3: 선택한 목적지 패널을 요약 카드로 바꾼다**

`{selectedRouteItem && (<SelectedDestinationPanel ... />)}` 블록을 아래로 교체한다.

```tsx
            {selectedRouteItem && (
              <article className="map-destination-panel">
                <div className="map-destination-heading">
                  <div>
                    <span className="map-destination-kicker">
                      <MapPin aria-hidden="true" size={14} />
                      {selectedLabel}
                    </span>
                    <h2>{selectedRouteItem.place.name}</h2>
                    {selectedRouteItem.place.chineseName && (
                      <p className="map-local-name">{selectedRouteItem.place.chineseName}</p>
                    )}
                  </div>
                  <span className="map-destination-time">{selectedRouteItem.schedule.time}</span>
                </div>

                <PlaceEssentials place={selectedRouteItem.place} />

                <button
                  aria-label={`${selectedRouteItem.place.name} 상세 보기`}
                  className="primary-button map-destination-open"
                  onClick={() => setSheetPlace(selectedRouteItem.place)}
                  type="button"
                >
                  길찾기와 주소 보기
                </button>
              </article>
            )}
```

- [ ] **Step 4: 저장한 장소 목록을 시트 여는 행으로 바꾼다**

`{places.map((place) => (<SavedPlaceDisclosure ... />))}` 블록을 아래로 교체한다.

```tsx
              {places.map((place) => (
                <button
                  aria-label={`${place.name} 상세 보기`}
                  className="map-saved-place"
                  key={place.id}
                  onClick={() => setSheetPlace(place)}
                  type="button"
                >
                  <span className="map-saved-marker" aria-hidden="true">
                    <MapPin size={15} />
                  </span>
                  <span className="map-saved-copy">
                    <small>{placeCategoryLabels[place.category]}</small>
                    <strong>{place.name}</strong>
                    <span className="map-saved-sub">
                      {[place.chineseName, place.subwayExit || place.address].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              ))}
```

> 현지어(`chineseName`)를 부제에 남기는 것은 스펙의 "현지어 · 주소" 부제와 일치하며, `SharedTripPage.test.tsx:179`가 이를 검증한다.

`.map-saved-heading` 안의 안내 문구도 바뀐 동작에 맞춘다.

```tsx
            <p>장소를 누르면 주소와 길찾기를 볼 수 있어요.</p>
```

- [ ] **Step 5: 시트를 렌더한다**

`<section className="screen map-screen">`의 닫는 태그 바로 앞에 넣는다.

```tsx
      {sheetPlace && (
        <PlaceDetailSheet
          destinationCountry={trip.destinationCountry}
          onClose={() => setSheetPlace(null)}
          place={sheetPlace}
        />
      )}
```

- [ ] **Step 6: 타입 검사와 전체 테스트를 돌린다**

Run: `npm run web:typecheck && npm --prefix apps/web run test:unit`
Expected: 타입 오류 없음, 전부 PASS. `SharedTripPage`의 지도 관련 3개 단언이 계속 통과해야 한다.

- [ ] **Step 7: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/MapTab.tsx
git commit -m "feat(web): 지도 탭 인라인 펼침을 장소 상세 시트로 교체"
```

---

### Task 4: 지도 프레임 · 저장 장소 행 스타일

**Files:**
- Modify: `apps/web/src/styles/map.css`

- [ ] **Step 1: 지도 프레임을 스펙 비율로 맞춘다**

`map.css`의 `.travel-map-stage`와 `.travel-map-canvas`(300-312행)에서 `min-height`를 바꾸고 radius를 스펙값으로 올린다.

```css
.travel-map-stage {
  position: relative;
  min-height: clamp(246px, 66vw, 300px);
  overflow: hidden;
  border: 0;
  border-radius: 22px;
  background: var(--c-surface-cool);
}

.travel-map-canvas {
  width: 100%;
  min-height: clamp(246px, 66vw, 300px);
}
```

- [ ] **Step 2: 새 클래스 스타일을 파일 끝에 덧붙인다**

```css
/* ── 지도 탭 (4b단계) ────────────────────────────────────────── */
.map-destination-open {
  width: 100%;
  margin-top: 14px;
}

.map-saved-place {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 14px;
  border: 0;
  border-radius: 18px;
  background: var(--c-surface);
  color: var(--c-text);
  text-align: left;
}

.map-saved-place > svg {
  flex: 0 0 auto;
  color: var(--c-muted);
}

.map-saved-marker {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--c-route-soft);
  color: var(--c-route);
}

.map-saved-copy {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.map-saved-copy small {
  color: var(--c-muted);
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-strong);
}

.map-saved-copy strong {
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: var(--tracking-title);
  overflow-wrap: anywhere;
}

.map-saved-sub {
  color: var(--c-muted);
  font-size: var(--type-label-size);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 시트 안 유틸리티 행과 기사님 모드 */
.place-sheet-utilities {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.place-sheet-copy-error {
  margin: 10px 0 0;
  color: var(--c-danger);
  font-size: var(--type-supporting-size);
}

.place-sheet-phrase {
  padding: 8px 0 4px;
  text-align: center;
}

.place-sheet-phrase-label {
  margin: 0;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-display);
  letter-spacing: 0.06em;
}

.place-sheet-phrase-title {
  margin: 8px 0 18px;
  font-size: 2rem;
  font-weight: var(--font-weight-display);
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.place-sheet-phrase-address {
  margin: 8px 0 20px;
  font-size: 1.25rem;
  font-weight: var(--font-weight-medium);
  line-height: 1.5;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 3: 전체 검증을 돌린다**

Run: `npm --prefix apps/web run test:unit && npm --prefix apps/web run test:dependencies && npm run web:typecheck && npm run web:build`
Expected: 전부 PASS

- [ ] **Step 4: 브라우저에서 실제 렌더를 확인한다**

`/demo`의 지도 탭에서 **컨테이너 기준으로** 실측한다.

1. 375×812 — 지도 프레임, 저장 장소 행, 행을 눌러 시트가 열리는지 스크린샷.
2. 시트에서 `주소 복사` · `기사님께 보기`(데모는 중국이라 노출됨) 동작, `장소 정보로 돌아가기`로 복귀.
3. **핀 색이 새 팔레트인지** 확인:
   ```js
   (() => {
     const imgs = [...document.querySelectorAll('.travel-map-canvas img, .travel-map-canvas [role="img"]')];
     return JSON.stringify({ markerNodes: imgs.length, note: '지도 로드 실패 시 폴백 프레임이면 색 확인 불가' });
   })();
   ```
   지도가 로드되지 않는 환경이면 스크린샷으로 폴백 프레임만 확인하고, 핀 색은 `mapModel` 테스트로 검증했음을 기록한다.
4. 195×700에서 아래를 실행 — 전부 true / 44 이상이어야 한다.
   ```js
   (() => {
     const row = document.querySelector('.map-saved-place');
     const sheet = document.querySelector('.place-sheet');
     const overflow = (el) => el.scrollWidth > el.clientWidth + 1;
     return JSON.stringify({
       rowNoOverflow: row ? !overflow(row) : null,
       rowHeight: row && Math.round(row.getBoundingClientRect().height),
       sheetNoOverflow: sheet ? !overflow(sheet) : null,
       bodyNoHScroll: document.body.scrollWidth <= document.body.clientWidth,
     });
   })();
   ```

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/styles/map.css
git commit -m "feat(web): 지도 프레임과 저장 장소 행 스타일 적용"
```

---

## 최종 확인

- [ ] `npm run check` 전체 통과(Go 백엔드 포함)
- [ ] `git push` 후 PR 생성 — 제목 `feat(web): iOS 리디자인 4b단계 — 지도 탭`
- [ ] PR 본문에 이 플랜과 로드맵 경로를 링크하고, "1단계에서 놓친 버그"와 "의도적인 스펙 편차"를 옮긴다
- [ ] CI `frontend build` 통과 확인
- [ ] 로드맵 4b 행을 **완료**로 갱신
