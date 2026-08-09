# iOS 리디자인 5단계 — 긴급 탭 + 하단 탭바 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 긴급 탭의 긴급 통화 · 숙소 · 현지 도구를 스펙 구조로 바꾸고, 현지 도구를 시트로 여는 3행 리스트로 정리한다.

**Architecture:** 4a·4b에서 만든 시트에서 **범용 바텀 시트 셸(`BottomSheet`)을 추출**해 `PlaceDetailSheet`와 현지 도구 시트가 함께 쓴다. 하단 탭바는 1·2단계에서 이미 스펙대로 처리돼 아이콘 크기만 맞춘다.

**Tech Stack:** React 19 + TypeScript, Vitest + @testing-library/react, lucide-react(신규 의존성 금지), 순수 CSS.

## Global Constraints

- API · DB · Go 백엔드 · 여행 데이터 스키마 · 국가별 분기 로직은 **변경하지 않는다**.
- 라우팅과 훅 계약은 **변경하지 않는다**.
- 터치 영역 최소 **44px**, 글자 최소 **12px**, 대비 **4.5:1 이상**. `apps/web/scripts/mobile-ui-foundations.test.mjs`가 CI에서 강제한다. 스펙의 12px·14.5px 아래 수치는 12px 이상으로 올린다.
- **읽기 전용(공유 보기)에서는 상태를 바꾸는 버튼을 렌더하지 않는다.**
- 기존 계약을 깬다: `emergency-call-button`은 1단계 회귀 테스트가 **44px 이상**을 강제한다. 스펙의 "높이 38"은 채택하지 않는다.
- 각 태스크는 끝에서 다음을 전부 통과시킨 뒤 커밋한다:
  - `npm --prefix apps/web run test:unit`
  - `npm --prefix apps/web run test:dependencies`
  - `npm run web:typecheck`

## 확정된 설계 결정 (사용자 확인 완료, 2026-08-06)

| 항목 | 결정 |
| --- | --- |
| 긴급 탭의 2단 서브탭 | **유지한다.** 스펙은 한 화면에 세 섹션을 다 놓지만, 기존 정보 구조를 그대로 두고 각 섹션의 카드 외형만 스펙에 맞춘다. |
| 현지 도구 | **범용 시트 셸을 추출해 3행 리스트로 바꾼다.** 행을 누르면 해당 도구가 시트로 열린다. |

## 의도적인 스펙 편차

- **긴급 통화를 119/영사 콜센터로 고정하지 않는다.** 스펙은 두 항목을 예시로 들지만, 실제 연락처는 여행 데이터(`emergencies`)에서 온다. 하드코딩하면 사용자가 등록한 연락처와 어긋난다.
- **2칸 그리드 대신 한 열로 둔다(구현 중 확정).** 처음에는 스펙대로 2칸으로 만들었으나, 실제 연락처 설명이 "기사나 현지 직원에게 중국어 숙소 이름과 주소를 보여주세요." 같은 여러 문장이라 375px에서 칸 폭이 150px밖에 안 돼 **한 글자씩 세로로 줄바꿈됐다**. 스펙의 2칸은 "119" 같은 짧은 항목을 전제한 배치다. 한 열로 두고 아이콘 타일 · 제목 · 설명 · 통화 버튼이라는 카드 구성만 스펙에 맞춘다.
- **숙소 카드의 "현지어" 미표시.** `AccommodationInfo`에 현지어 필드가 없다(`name` · `address` · `phone` · `checkIn` · `checkOut` · `memo`뿐). 부제는 체크아웃만 쓴다.
- **통화 버튼 높이 38px → 44px.** 1단계 접근성 계약이 강제한다.
- **하단 탭바는 아이콘 크기만 손댄다.** 높이 84px · blur · 활성 인디고 · 라벨 12px는 1·2단계에서 이미 적용됐다. 스펙의 24px 아이콘에 맞춰 21px → 24px만 올린다.

## 파일 구조

**신규**

| 파일 | 책임 |
| --- | --- |
| `apps/web/src/shared/components/BottomSheet.tsx` | 범용 바텀 시트 셸(딤 · 그랩 핸들 · 포커스 트랩 · 닫기). |
| `apps/web/src/shared/components/BottomSheet.test.tsx` | 닫기 · Escape · 제목 검증. |

**수정**

| 파일 | 변경 |
| --- | --- |
| `apps/web/src/shared/components/PlaceDetailSheet.tsx` | `BottomSheet`를 쓰도록 정리(동작 동일). |
| `apps/web/src/features/trip/components/tabs/ConciergeTab.tsx` | 긴급 2칸 그리드 · 숙소 카드 · 현지 도구 3행+시트. |
| `apps/web/src/features/trip/components/tabs/BottomTabs.tsx` | 아이콘 24px. |
| `apps/web/src/styles/travel-tools.css` | 긴급 · 숙소 · 도구 행 스타일. |

---

### Task 1: 범용 바텀 시트 셸 추출

**Files:**
- Create: `apps/web/src/shared/components/BottomSheet.tsx`
- Create: `apps/web/src/shared/components/BottomSheet.test.tsx`
- Modify: `apps/web/src/shared/components/PlaceDetailSheet.tsx`

**Interfaces:**
- Consumes: `useDialogFocusTrap`.
- Produces:
  ```ts
  type BottomSheetProps = {
    ariaLabel: string;
    children: ReactNode;
    onClose: () => void;
  };
  ```
  닫기 버튼은 셸이 그린다(`닫기`). 내용은 `children`으로 받는다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`apps/web/src/shared/components/BottomSheet.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  it("전달한 내용을 대화 상자 안에 보여준다", () => {
    render(
      <BottomSheet ariaLabel="환율 계산" onClose={vi.fn()}>
        <p>내용</p>
      </BottomSheet>,
    );

    expect(screen.getByRole("dialog", { name: "환율 계산" })).toBeVisible();
    expect(screen.getByText("내용")).toBeVisible();
  });

  it("닫기 버튼을 누르면 닫힘을 알린다", async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet ariaLabel="환율 계산" onClose={onClose}>
        <p>내용</p>
      </BottomSheet>,
    );

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape 키로도 닫을 수 있다", async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet ariaLabel="환율 계산" onClose={onClose}>
        <p>내용</p>
      </BottomSheet>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `npm --prefix apps/web run test:unit -- BottomSheet`
Expected: FAIL — `Failed to resolve import "./BottomSheet"`

- [ ] **Step 3: 셸을 만든다**

`apps/web/src/shared/components/BottomSheet.tsx`:

```tsx
import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialogFocusTrap } from "../useDialogFocusTrap";

type BottomSheetProps = {
  ariaLabel: string;
  children: ReactNode;
  onClose: () => void;
};

// 장소 상세와 현지 도구가 함께 쓰는 바텀 시트 껍데기.
// 딤 · 그랩 핸들 · 포커스 트랩 · 닫기 버튼을 한곳에서 책임진다.
export function BottomSheet({ ariaLabel, children, onClose }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ dialogRef, initialFocusRef: closeButtonRef, isOpen: true, onClose });

  return (
    <div className="place-sheet-backdrop">
      <div aria-label={ariaLabel} aria-modal="true" className="place-sheet" ref={dialogRef} role="dialog">
        <span aria-hidden="true" className="place-sheet-handle" />
        {children}
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

Run: `npm --prefix apps/web run test:unit -- BottomSheet`
Expected: PASS (3 tests)

- [ ] **Step 5: `PlaceDetailSheet`이 셸을 쓰게 바꾼다**

`PlaceDetailSheet.tsx`에서 아래를 **삭제**한다:
- `dialogRef` · `closeButtonRef` 선언과 `useDialogFocusTrap` 호출
- 바깥 `<div className="place-sheet-backdrop">` / `<div ... className="place-sheet">` / `<span className="place-sheet-handle" />`
- 맨 아래 `<button className="place-sheet-close">…</button>`
- `useRef` · `X` · `useDialogFocusTrap` import

그 자리를 `BottomSheet`로 감싼다. 최종 형태는 이렇다(중간 내용은 그대로 유지):

```tsx
  return (
    <BottomSheet ariaLabel={`${place.name} 상세`} onClose={onClose}>
      {isPhraseMode ? (
        …기존 기사님 모드…
      ) : (
        <>
          …기존 heading · description · address · actions · utilities · copyError…
        </>
      )}
    </BottomSheet>
  );
```

import에 추가한다:

```tsx
import { BottomSheet } from "./BottomSheet";
```

- [ ] **Step 6: 회귀를 확인한다**

Run: `npm --prefix apps/web run test:unit -- PlaceDetailSheet MapTab ScheduleTab SharedTripPage`
Expected: PASS — 시트 12개 테스트가 전부 그대로 통과해야 한다(껍데기만 바뀌었으므로).

- [ ] **Step 7: 커밋한다**

```bash
git add apps/web/src/shared/components/BottomSheet.tsx apps/web/src/shared/components/BottomSheet.test.tsx apps/web/src/shared/components/PlaceDetailSheet.tsx
git commit -m "refactor(web): 바텀 시트 껍데기를 BottomSheet 공용 컴포넌트로 추출"
```

---

### Task 2: 긴급 통화 2칸 그리드

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/ConciergeTab.tsx`

**Interfaces:**
- Consumes: 없음.
- Produces: 없음.

- [ ] **Step 1: 긴급 연락 목록을 카드 그리드로 바꾼다**

`ConciergeTab.tsx`의 `<div className="emergency-contact-list">` 블록을 아래로 교체한다.

```tsx
              <div className="emergency-contact-grid">
                {emergencies.map((item) => (
                  <article className="emergency-contact" key={item.id}>
                    <span aria-hidden="true" className="emergency-contact-tile">
                      <Phone size={18} />
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    {item.address && (
                      <span className="emergency-contact-address">
                        <MapPin aria-hidden="true" size={14} />
                        {item.address}
                      </span>
                    )}
                    {item.phone ? (
                      <a
                        aria-label={`${item.title} ${item.phone}로 전화`}
                        className="emergency-call-button"
                        href={`tel:${item.phone}`}
                      >
                        <Phone aria-hidden="true" size={17} />
                        <span>{item.phone}</span>
                      </a>
                    ) : (
                      <span className="emergency-unregistered">연락처 미등록</span>
                    )}
                  </article>
                ))}
              </div>
```

- [ ] **Step 2: 회귀를 확인한다**

Run: `npm --prefix apps/web run test:unit -- ConciergeTab SharedTripPage OwnerTripViewPage`
Expected: PASS. 전화 링크의 접근 가능한 이름(`{제목} {번호}로 전화`)은 바뀌지 않았다.

- [ ] **Step 3: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/ConciergeTab.tsx
git commit -m "feat(web): 긴급 연락처를 아이콘 타일 2칸 그리드로 재구성"
```

---

### Task 3: 숙소 카드에 기사님용 주소 블록

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/ConciergeTab.tsx`

- [ ] **Step 1: 숙소 카드를 스펙 구조로 바꾼다**

`<article className="accommodation-summary">` 블록을 아래로 교체한다.

```tsx
              <article className="accommodation-summary">
                <header>
                  <Building2 aria-hidden="true" size={20} />
                  <div>
                    <h3>{accommodation.name || "숙소 이름 미등록"}</h3>
                    <p className="accommodation-subtitle">
                      체크아웃 {accommodation.checkOut || "미등록"}
                    </p>
                  </div>
                </header>

                <dl>
                  <div>
                    <dt>체크인</dt>
                    <dd>{accommodation.checkIn || "미등록"}</dd>
                  </div>
                  <div>
                    <dt>체크아웃</dt>
                    <dd>{accommodation.checkOut || "미등록"}</dd>
                  </div>
                </dl>

                {accommodation.address && (
                  <div className="accommodation-driver-address">
                    <span className="accommodation-driver-label">기사님께 보여주는 주소</span>
                    <p>{accommodation.address}</p>
                  </div>
                )}

                {accommodation.phone && (
                  <a className="accommodation-phone" href={`tel:${accommodation.phone}`}>
                    <Phone aria-hidden="true" size={16} />
                    {accommodation.phone}
                  </a>
                )}
                {accommodation.memo && <p className="accommodation-memo">{accommodation.memo}</p>}
                {accommodation.address && (
                  <button className="secondary-button accommodation-copy" onClick={copyAccommodationAddress} type="button">
                    <Copy aria-hidden="true" size={18} />
                    {addressCopied ? "주소 복사 완료" : "주소 복사"}
                  </button>
                )}
              </article>
```

> 기존 `<span>숙소</span>` 키커는 제목 옆 부제로 대체된다. 주소는 `MapPin` 줄 대신 강조 블록으로 옮긴다.

- [ ] **Step 2: 회귀를 확인한다**

Run: `npm --prefix apps/web run test:unit`
Expected: PASS

- [ ] **Step 3: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/ConciergeTab.tsx
git commit -m "feat(web): 숙소 카드에 기사님께 보여주는 주소 블록 추가"
```

---

### Task 4: 현지 도구를 3행 리스트 + 시트로

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/ConciergeTab.tsx`

**Interfaces:**
- Consumes: Task 1의 `BottomSheet`.
- Produces: 없음.

- [ ] **Step 1: 도구 목록과 시트 상태를 만든다**

import를 늘린다:

```tsx
import { Building2, ChevronRight, Coins, Copy, CreditCard, Languages, MapPin, Phone } from "lucide-react";
import { BottomSheet } from "../../../../shared/components/BottomSheet";
import { getCurrencyConfig } from "../../../../shared/currency";
import { CurrencyExchangeWidget } from "../helpers/CurrencyExchangeWidget";
import { SurvivalPhraseWidget } from "../helpers/SurvivalPhraseWidget";
```

`const [subTab, setSubTab] = useState…` 아래에 추가한다:

```tsx
  const [openTool, setOpenTool] = useState<"currency" | "phrase" | "payment" | null>(null);
  const currency = getCurrencyConfig(trip.destinationCountry);
  const supportsPhrases = trip.destinationCountry === "JP" || trip.destinationCountry === "CN";
  const isChina = trip.destinationCountry === "CN";

  const tools = [
    currency && { id: "currency" as const, icon: Coins, title: "환율 계산", description: `${currency.label} ↔ 원 환산` },
    supportsPhrases && { id: "phrase" as const, icon: Languages, title: "택시 · 식당 문구", description: "상황별 현지어 문장" },
    isChina && { id: "payment" as const, icon: CreditCard, title: "현지 결제 안내", description: "알리페이 · 위챗페이 준비" },
  ].filter((tool): tool is { id: "currency" | "phrase" | "payment"; icon: typeof Coins; title: string; description: string } => Boolean(tool));
```

- [ ] **Step 2: 현지 도구 화면을 3행 리스트로 바꾼다**

`subTab === "tools"`일 때의 `<>…</>` 블록 전체를 아래로 교체한다.

```tsx
        <section className="section-block">
          <div className="section-title-row">
            <div>
              <h2>현지에서 바로</h2>
              <p className="section-caption">필요한 도구만 눌러서 크게 봅니다.</p>
            </div>
          </div>

          {tools.length === 0 ? (
            <article className="concierge-empty-state">
              <MapPinned aria-hidden="true" size={21} />
              <div>
                <strong>이 목적지에는 준비된 도구가 없습니다</strong>
                <p>환전이나 현지어 준비 없이 일정과 지도에 집중할 수 있습니다.</p>
              </div>
            </article>
          ) : (
            <div className="concierge-tool-list">
              {tools.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    className="concierge-tool-row"
                    key={tool.id}
                    onClick={() => setOpenTool(tool.id)}
                    type="button"
                  >
                    <span aria-hidden="true" className="concierge-tool-tile">
                      <ToolIcon size={18} />
                    </span>
                    <span className="concierge-tool-copy">
                      <strong>{tool.title}</strong>
                      <small>{tool.description}</small>
                    </span>
                    <ChevronRight aria-hidden="true" size={18} />
                  </button>
                );
              })}
            </div>
          )}
        </section>
```

`MapPinned`를 lucide import에 추가한다.

- [ ] **Step 3: 시트를 렌더한다**

컴포넌트 최상위 `</section>` 바로 앞에 넣는다.

```tsx
      {openTool === "currency" && currency && (
        <BottomSheet ariaLabel="환율 계산" onClose={() => setOpenTool(null)}>
          <CurrencyExchangeWidget config={currency} />
        </BottomSheet>
      )}
      {openTool === "phrase" && (
        <BottomSheet ariaLabel="택시 · 식당 문구" onClose={() => setOpenTool(null)}>
          <SurvivalPhraseWidget destinationCountry={trip.destinationCountry} />
        </BottomSheet>
      )}
      {openTool === "payment" && (
        <BottomSheet ariaLabel="현지 결제 안내" onClose={() => setOpenTool(null)}>
          <ChinaPaymentHelper />
        </BottomSheet>
      )}
```

`QuickTravelHelper` import는 더 이상 쓰지 않으므로 지운다. `npm run web:typecheck`가 미사용 import를 잡아 준다.

> `QuickTravelHelper` 파일 자체는 지우지 않는다 — 다른 곳에서 쓰는지 먼저 확인해야 하고, 이번 단계의 목적이 아니다. 실제로 아무 데서도 안 쓰면 후속 정리로 남긴다.

- [ ] **Step 4: 회귀를 확인한다**

Run: `npm run web:typecheck && npm --prefix apps/web run test:unit`
Expected: 타입 오류 없음, 전부 PASS

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/ConciergeTab.tsx
git commit -m "feat(web): 현지 도구를 3행 리스트와 시트로 재구성"
```

---

### Task 5: 하단 탭바 아이콘 + 스타일 + 최종 검증

**Files:**
- Modify: `apps/web/src/features/trip/components/tabs/BottomTabs.tsx`
- Modify: `apps/web/src/styles/travel-tools.css`

- [ ] **Step 1: 아이콘을 24px로 올린다**

`BottomTabs.tsx`의 `<Icon size={21} aria-hidden="true" />`를 아래로 바꾼다.

```tsx
            <Icon size={24} aria-hidden="true" />
```

- [ ] **Step 2: 스타일을 추가한다**

`apps/web/src/styles/travel-tools.css` 맨 끝에 덧붙인다.

```css
/* ── 긴급 탭 (5단계) ─────────────────────────────────────────── */
.emergency-contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 10px;
}

.emergency-contact {
  display: grid;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  background: var(--c-surface);
}

.emergency-contact-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--c-destination-soft);
  color: var(--c-destination-deep);
}

.emergency-contact h3 {
  margin: 4px 0 0;
  color: var(--c-text);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-display);
  letter-spacing: var(--tracking-title);
}

.emergency-contact p {
  margin: 0;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  line-height: 1.5;
}

.emergency-contact-address {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  overflow-wrap: anywhere;
}

.emergency-contact .emergency-call-button {
  width: 100%;
  margin-top: 6px;
}

.emergency-unregistered {
  margin-top: 6px;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-strong);
}

.accommodation-subtitle {
  margin: 2px 0 0;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
}

.accommodation-driver-address {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--c-bg);
}

.accommodation-driver-label {
  display: block;
  color: var(--c-muted);
  font-size: var(--type-label-size);
  font-weight: var(--font-weight-display);
  letter-spacing: 0.06em;
}

.accommodation-driver-address p {
  margin: 6px 0 0;
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-strong);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.accommodation-copy {
  width: 100%;
  min-height: 44px;
  margin-top: 14px;
}

.concierge-tool-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.concierge-tool-row {
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

.concierge-tool-row > svg {
  flex: 0 0 auto;
  color: var(--c-muted);
}

.concierge-tool-tile {
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

.concierge-tool-copy {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.concierge-tool-copy strong {
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: var(--tracking-title);
}

.concierge-tool-copy small {
  color: var(--c-muted);
  font-size: var(--type-label-size);
}
```

- [ ] **Step 3: 전체 검증을 돌린다**

Run: `npm --prefix apps/web run test:unit && npm --prefix apps/web run test:dependencies && npm run web:typecheck && npm run web:build`
Expected: 전부 PASS

- [ ] **Step 4: 브라우저에서 실제 렌더를 확인한다**

`/demo`의 긴급 탭에서 **컨테이너 기준으로** 실측한다.

1. 375×812 — 긴급 통화 2칸 그리드, 숙소 카드의 기사님 주소 블록 스크린샷.
2. `현지 도구` 서브탭 → 3행 리스트 → 행을 눌러 시트가 열리는지, Escape로 닫히는지.
3. 195×700에서 아래 실행 — 전부 true / 44 이상이어야 한다.
   ```js
   (() => {
     const cards = [...document.querySelectorAll('.emergency-contact')];
     const grid = document.querySelector('.emergency-contact-grid');
     const rows = [...document.querySelectorAll('.concierge-tool-row')];
     const overflow = (el) => el.scrollWidth > el.clientWidth + 1;
     const calls = [...document.querySelectorAll('.emergency-call-button')];
     return JSON.stringify({
       gridColumns: grid && getComputedStyle(grid).gridTemplateColumns,
       cardsNoOverflow: cards.every((c) => !overflow(c)),
       callHeights: calls.map((c) => Math.round(c.getBoundingClientRect().height)),
       rowsNoOverflow: rows.every((r) => !overflow(r)),
       bodyNoHScroll: document.body.scrollWidth <= document.body.clientWidth,
     });
   })();
   ```
   `callHeights`가 전부 44 이상이어야 한다.

- [ ] **Step 5: 커밋한다**

```bash
git add apps/web/src/features/trip/components/tabs/BottomTabs.tsx apps/web/src/styles/travel-tools.css
git commit -m "feat(web): 긴급 탭 스타일과 하단 탭바 아이콘 크기 적용"
```

---

## 최종 확인

- [ ] `npm run check` 전체 통과(Go 백엔드 포함)
- [ ] `git push` 후 PR 생성 — 제목 `feat(web): iOS 리디자인 5단계 — 긴급 탭 + 하단 탭바`
- [ ] PR 본문에 이 플랜과 로드맵 경로를 링크하고 "확정된 설계 결정"·"의도적인 스펙 편차"를 옮긴다
- [ ] CI `frontend build` 통과 확인
- [ ] 로드맵 5단계 행을 **완료**로 갱신
