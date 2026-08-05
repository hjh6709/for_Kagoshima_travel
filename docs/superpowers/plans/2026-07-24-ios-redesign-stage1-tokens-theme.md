# iOS 리디자인 — 1단계(토큰 교체 + 리스킨 레이어) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `apps/web/src/styles/tokens.css`를 새 팔레트/타입 스케일로 교체하고, 새 리스킨 오버라이드 레이어
`theme-ios.css`를 최상단 스타일시트(`apps/web/src/styles.css`) 맨 마지막에 얹어서, 마크업을 전혀 바꾸지 않고
전 화면의 색·타이포·라운드·그림자·간격을 iOS 리디자인 방향으로 바꾼다.

**Architecture:** 새 CSS 변수 값과 새 오버라이드 규칙만 추가한다. 컴포넌트 파일(.tsx)은 전혀 건드리지 않는다.
디자인 핸드오프(`~/Downloads/design_handoff_map_planner_ios/`)의 `tokens.css`/`theme-ios.css`를 레포 규칙에
맞게 복사해 넣는 작업이며, 두 파일 모두 이미 grep으로 대상 클래스가 현재 코드베이스에 실존함을 확인했다.

**Tech Stack:** React 19 + TypeScript + Vite (`apps/web`), 순수 CSS(클래스 기반, CSS 변수). Vitest가 이미
설치되어 있다(`apps/web/package.json`의 `test`/`test:unit` 스크립트).

## Global Constraints

- 마크업(.tsx) 변경 금지 — 이 단계는 CSS 레이어 교체로만 끝낸다.
- 새 의존성 추가 금지. 아이콘은 기존 lucide-react만 쓴다(이 단계에서는 아이콘도 안 건드림).
- 다크모드 지원 대상 아님 — `tokens.css`의 `color-scheme: light` 유지.
- 변수 이름은 기존 이름을 유지하되, 핸드오프 쪽 새 변수(`--type-headline-size`, `--type-section-size`,
  `--type-chip-size`, `--tracking-*`, `--font-weight-medium`, `--c-fill-strong`, `--c-hairline`,
  `--radius-card-sm`, `--radius-frame`, `--shadow-hero`, `--shadow-raised`, `--shadow-segment`,
  `--ease-sheet`)도 그대로 함께 도입한다 — 이후 2~6단계 컴포넌트 작업에서 이 변수들을 쓴다.
- 기존 테스트(`apps/web/src/**/*.test.tsx`)는 텍스트/role 기준이라 CSS만 바꾸는 이 단계에서는 전부
  그대로 통과해야 한다. 실패하면 스타일이 DOM 구조/텍스트에 영향을 준 것이므로 되돌리고 원인을 확인한다.
- 커밋 메시지는 Conventional Commits + 한글 설명(`fix(web): ...` / `feat(web): ...`).

## 시작 전

```bash
cd /Users/hanjeonghyun/dev/for_Kagoshima_travel
git fetch origin
git checkout -b feat/web-ios-redesign-stage1-tokens-theme origin/main
```

---

## Task 1: `tokens.css` 교체

**Files:**
- Modify: `apps/web/src/styles/tokens.css` (현재 70줄 → 핸드오프 버전 115줄로 전체 교체)

**Interfaces:**
- Consumes: 없음
- Produces: `--c-route`, `--c-destination`, `--c-bg`, `--c-surface`, `--c-text`, `--radius-card`,
  `--shadow-hero` 등 CSS 변수 전체 — 2~6단계 및 Task 2(`theme-ios.css`)가 이 변수들을 그대로 참조한다.

- [ ] **Step 1: 현재 파일과 교체본 다시 확인**

Run: `diff /Users/hanjeonghyun/Downloads/design_handoff_map_planner_ios/tokens.css apps/web/src/styles/tokens.css`

Expected: 값 차이가 대량으로 나오는 게 정상(팔레트 자체를 바꾸는 작업이므로). `@font-face` 블록(1~7번째 줄)은
양쪽이 동일해야 한다 — 다르면 폰트 경로가 깨진 것이니 진행 전에 알린다.

- [ ] **Step 2: 파일 전체 교체**

`apps/web/src/styles/tokens.css`를 아래 내용으로 완전히 교체한다:

```css
@font-face {
  font-family: "Pretendard Variable";
  font-style: normal;
  font-weight: 45 920;
  font-display: swap;
  src: url("/fonts/PretendardVariable.woff2") format("woff2-variations");
}

:root {
  /* ---------------------------------------------------------------
   * Map Planner — iOS-native redesign
   * 웜 페이퍼 뉴트럴 + 더스크 인디고(선택/이동) + 선셋(지금 할 하나)
   * 변수 이름은 기존과 동일하므로 이 파일만 교체해도 전 화면이 새 팔레트로 전환됩니다.
   * --------------------------------------------------------------- */

  /* Primary = 브랜드/선택/이동 (기존 --c-route 역할) */
  --c-route: #2e4374;
  --c-route-deep: #24345a;
  --c-route-soft: #eaeef6;

  /* Accent = 지금 해야 할 하나 (기존 --c-destination 역할) */
  --c-destination: #d9723f;
  --c-destination-deep: #c4522a;
  --c-destination-soft: #fbede7;

  --c-danger: #c4522a;
  --c-danger-light: #fbede7;
  --c-warning: #8a6a2f;
  --c-warning-light: #f7efe0;
  --c-orange: var(--c-destination);
  --c-success: #2f7a54;
  --c-success-soft: #e4f0e9;

  /* Surfaces */
  --c-bg: #f7f5f2;          /* 앱 배경 */
  --c-page: #eae6e0;        /* 프레임 밖 데스크 */
  --c-surface: #ffffff;     /* 카드 · 리스트 그룹 */
  --c-surface-cool: #f1efea; /* 세컨더리 버튼 · 아이콘 타일 · 칩 */
  --c-fill-strong: #e8e4dd; /* 세그먼트 트랙 · 프로그레스 트랙 */

  /* Text */
  --c-text: #191b1f;
  --c-text-strong: #191b1f;
  --c-ink-muted: #5a5f68;
  --c-muted: #9aa0a8;
  --c-faint: #a7a29a;

  /* Lines */
  --border-color: #efebe4;
  --c-hairline: #f1efea;
  --bg-secondary: var(--c-route-soft);

  /* Shape */
  --radius-card: 20px;
  --radius-card-sm: 18px;
  --radius-control: 14px;
  --radius-chip: 8px;
  --radius-sheet: 26px;
  --radius-frame: 46px;

  /* Elevation — 카드 기본 그림자 없음 */
  --shadow-card: none;
  --shadow-hero: 0 16px 34px rgba(46, 67, 116, 0.26);
  --shadow-raised: 0 10px 26px rgba(24, 26, 32, 0.07);
  --shadow-frame: 0 40px 90px rgba(24, 26, 32, 0.28);
  --shadow-overlay: 0 -12px 40px rgba(24, 26, 32, 0.18);
  --shadow-segment: 0 2px 6px rgba(24, 26, 32, 0.1);

  /* Motion */
  --ease-route: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-sheet: cubic-bezier(0.32, 0.72, 0, 1);

  /* Type scale */
  --type-display-size: 2.0625rem;    /* 33px — 시작 화면 헤드라인 */
  --type-screen-size: 1.8125rem;     /* 29px — 화면 타이틀 */
  --type-headline-size: 1.5rem;      /* 24px — hero 장소명 */
  --type-section-size: 1.1875rem;    /* 19px — 섹션 제목 */
  --type-title-size: 1rem;           /* 16px — 카드 제목 */
  --type-body-size: 0.9375rem;       /* 15px */
  --type-supporting-size: 0.8125rem; /* 13px — 메타 · 현지어 */
  --type-label-size: 0.75rem;        /* 12px — 섹션 라벨 */
  --type-chip-size: 0.71875rem;      /* 11.5px */
  --type-presentation-size: clamp(1.75rem, 8vw, 2.0625rem);

  --type-display-line: 1.24;
  --type-heading-line: 1.3;
  --type-body-line: 1.6;
  --type-supporting-line: 1.45;
  --type-label-line: 1.35;

  --tracking-display: -0.035em;
  --tracking-title: -0.025em;
  --tracking-body: -0.01em;
  --tracking-label: 0.06em;

  --font-weight-body: 500;
  --font-weight-medium: 650;
  --font-weight-strong: 750;
  --font-weight-display: 800;

  color: var(--c-text);
  background: var(--c-page);
  font-family:
    "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
  color-scheme: light;
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-body);
  line-height: var(--type-body-line);
  letter-spacing: var(--tracking-body);
}
```

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/styles/tokens.css
git commit -m "feat(web): iOS 리디자인 디자인 토큰(색·타이포·간격) 교체"
```

(빌드 확인은 Task 2까지 마친 뒤 한 번에 한다 — 토큰만 바꾼 중간 상태에서 빌드해도 되지만, 이 저장소
관례상 관련 있는 두 파일을 같은 타임박스에서 검증하는 편이 낫다.)

---

## Task 2: `theme-ios.css` 추가 + import

**Files:**
- Create: `apps/web/src/styles/theme-ios.css`
- Modify: `apps/web/src/styles.css` (마지막 줄에 import 한 줄 추가)

**Interfaces:**
- Consumes: Task 1에서 정의한 CSS 변수 전체
- Produces: 없음(오버라이드 레이어라 다른 파일이 이 파일을 참조하지 않는다)

- [ ] **Step 1: `apps/web/src/styles.css`의 현재 import 순서 확인**

Run: `grep -n "@import" apps/web/src/styles.css`

Expected:
```
5:@import "./styles/tokens.css";
6:@import "./styles/foundation.css";
7:@import "./styles/manage.css";
8:@import "./styles/place-search.css";
9:@import "./styles/share.css";
10:@import "./styles/trip.css";
11:@import "./styles/map.css";
12:@import "./styles/travel-components.css";
13:@import "./styles/feedback.css";
14:@import "./styles/travel-tools.css";
```

이 순서가 다르면(파일이 추가/삭제됐으면) 그 최신 목록을 기준으로 Step 3을 진행한다 — 핵심은
`theme-ios.css`가 **마지막 줄**에 와야 한다는 것.

- [ ] **Step 2: `apps/web/src/styles/theme-ios.css` 파일 작성**

```css
/* ---------------------------------------------------------------------------
 * theme-ios.css — 기존 클래스 위에 얹는 리스킨 레이어
 *
 * styles.css에서 "가장 마지막"에 import 한다. 마크업을 바꾸지 않고 라운드 ·
 * 간격 · 그림자 · 상태색을 새 디자인으로 맞춘다. 구조 변경(next hero, 보딩패스,
 * 날짜 필 등)은 이후 단계에서 컴포넌트를 수정해 완성한다.
 * ------------------------------------------------------------------------- */

/* ── 프레임 & 화면 ─────────────────────────────────────────────── */
.app-shell {
  background: radial-gradient(120% 90% at 50% 0%, #f3f0ea 0%, #e4dfd7 100%);
}

.phone-frame {
  width: min(100%, 390px);
  border: 0;
  border-radius: var(--radius-frame);
  box-shadow: var(--shadow-frame), 0 0 0 10px #17181c, 0 0 0 11px #33353c;
  background: var(--c-bg);
}

.screen {
  padding: calc(14px + env(safe-area-inset-top)) 22px calc(28px + env(safe-area-inset-bottom));
}

.screen h1 {
  font-size: var(--type-screen-size);
  font-weight: var(--font-weight-display);
  letter-spacing: var(--tracking-display);
  line-height: 1.2;
  margin: 0;
}

.screen h2 {
  font-size: var(--type-section-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: var(--tracking-title);
  margin: 0;
}

.screen-intro,
.section-caption,
.flight-screen-intro,
.muted {
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
  letter-spacing: 0;
}

.screen-title-row {
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}

.section-block {
  margin-top: 24px;
}

.section-block.compact {
  margin-top: 20px;
}

/* ── 카드 / 리스트 그룹 ────────────────────────────────────────── */
.list-card,
.card,
.status-card,
.accommodation-summary,
.emergency-contact,
.mypage-trip-card,
.mypage-demo-card,
.empty-state-card,
.concierge-empty-state {
  border: 0;
  border-radius: var(--radius-card);
  background: var(--c-surface);
  box-shadow: none;
  padding: 17px;
}

.card-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 체크 행은 카드 사이 간격 대신 하나의 그룹 + 헤어라인으로 */
.card-stack:has(> .check-row) {
  gap: 0;
  border-radius: var(--radius-card);
  background: var(--c-surface);
  overflow: hidden;
}

.check-row {
  border: 0;
  border-radius: 0;
  border-bottom: 1px solid var(--c-hairline);
  background: transparent;
  padding: 0;
}

.check-row:last-child {
  border-bottom: 0;
}

.check-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 52px;
  padding: 14px 16px;
  font-size: var(--type-body-size);
  font-weight: 600;
  letter-spacing: -0.015em;
  text-align: left;
  color: var(--c-text);
}

.check-toggle:hover {
  background: #faf9f6;
}

.check-toggle svg {
  color: #c6c2ba;
  flex: 0 0 auto;
}

.check-toggle svg.checked {
  color: var(--c-success);
}

.check-row.completed .check-toggle,
.check-row.completed .check-toggle span {
  color: var(--c-faint);
  text-decoration: line-through;
}

/* ── 버튼 ─────────────────────────────────────────────────────── */
.primary-button,
.secondary-button,
.emergency-call-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 50px;
  border: 0;
  border-radius: var(--radius-control);
  font-size: var(--type-body-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: -0.015em;
}

.primary-button {
  background: var(--c-route);
  color: #ffffff;
}

.primary-button:hover:not(:disabled) {
  background: var(--c-route-deep);
}

.secondary-button {
  background: var(--c-surface-cool);
  color: var(--c-route);
}

.secondary-button:hover:not(:disabled) {
  background: var(--c-fill-strong);
}

.compact-button {
  min-height: 36px;
  padding: 0 13px;
  border-radius: 12px;
  font-size: var(--type-supporting-size);
}

.emergency-call-button {
  background: var(--c-destination-deep);
  color: #ffffff;
  min-height: 40px;
  border-radius: 12px;
}

.text-link {
  color: var(--c-route);
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid rgba(46, 67, 116, 0.28);
  outline-offset: 3px;
}

/* ── 세그먼트 컨트롤 ──────────────────────────────────────────── */
.segment-control-wrapper {
  display: flex;
  gap: 3px;
  padding: 3px;
  border: 0;
  border-radius: 12px;
  background: var(--c-fill-strong);
  margin: 14px 0 0;
}

.segment-btn {
  flex: 1;
  min-height: 34px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #7b8089;
  font-size: var(--type-supporting-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: -0.015em;
}

.segment-btn.active {
  background: var(--c-surface);
  color: var(--c-text);
  box-shadow: var(--shadow-segment);
}

/* ── 날짜 필 ─────────────────────────────────────────────────── */
.date-tabs {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-bottom: 2px;
}

.date-tabs.scroll-tabs {
  overflow-x: auto;
  scrollbar-width: none;
}

.date-tabs.scroll-tabs::-webkit-scrollbar {
  display: none;
}

.date-tabs button {
  flex: 1;
  min-width: 68px;
  min-height: 68px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  background: var(--c-surface);
  color: var(--c-text);
  font-size: 1.25rem;
  font-weight: var(--font-weight-display);
  letter-spacing: -0.03em;
  padding: 11px 4px 12px;
}

.date-tabs button.active {
  border-color: var(--c-route);
  background: var(--c-route);
  color: #ffffff;
}

.schedule-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 18px;
}

.schedule-summary span {
  font-size: 0.875rem;
  font-weight: var(--font-weight-strong);
  letter-spacing: var(--tracking-title);
}

.schedule-summary small {
  color: var(--c-muted);
}

/* ── 타임라인 ────────────────────────────────────────────────── */
.timeline-stack {
  gap: 10px;
  margin-top: 16px;
}

.timeline-stack .list-card {
  border-radius: var(--radius-card-sm);
  padding: 15px;
}

.timeline-stack .list-card.completed {
  background: #fbfaf8;
  border: 1px solid var(--border-color);
}

.pill {
  display: inline-flex;
  align-items: center;
  height: 25px;
  padding: 0 10px;
  border-radius: 100px;
  background: var(--c-route-soft);
  color: var(--c-route);
  font-size: var(--type-chip-size);
  font-weight: var(--font-weight-display);
  letter-spacing: 0.03em;
}

/* ── 항공 ─────────────────────────────────────────────────────── */
.flight-journey-card {
  border: 0;
  border-radius: 22px;
  background: var(--c-surface);
  box-shadow: var(--shadow-raised);
  overflow: hidden;
  padding: 0;
}

.flight-journey-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 18px;
  background: var(--c-route-soft);
  color: var(--c-route);
}

.flight-route {
  display: flex;
  align-items: center;
  padding: 20px 18px 18px;
}

.flight-route-point strong {
  display: block;
  font-size: 1.6875rem;
  font-weight: var(--font-weight-display);
  letter-spacing: -0.02em;
}

.flight-route-point small {
  color: var(--c-muted);
  font-size: 0.75rem;
}

.flight-route-line span {
  display: block;
  height: 1.5px;
  background: repeating-linear-gradient(90deg, #dcd8d0 0 5px, transparent 5px 10px);
}

.flight-memo {
  border-top: 1px dashed #e6e2dc;
  padding: 13px 18px;
}

/* ── 하단 탭바 ───────────────────────────────────────────────── */
.bottom-tabs {
  display: flex;
  align-items: flex-start;
  gap: 0;
  min-height: 84px;
  padding: 9px 6px calc(4px + env(safe-area-inset-bottom));
  border-top: 1px solid #ebe7e0;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18px);
  box-shadow: none;
}

.bottom-tabs button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: var(--c-faint);
  font-size: 0.65625rem;
  font-weight: var(--font-weight-strong);
  letter-spacing: -0.01em;
}

.bottom-tabs button.active {
  color: var(--c-route);
  background: transparent;
}

.bottom-tabs button.active svg {
  stroke-width: 2.4;
}

/* ── 폼 ───────────────────────────────────────────────────────── */
.auth-form input,
.auth-form select,
.auth-form textarea,
.date-form input {
  min-height: 50px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-control);
  background: var(--c-surface);
  font-weight: 600;
}

.auth-form input:focus,
.auth-form select:focus,
.auth-form textarea:focus {
  border-color: var(--c-route);
  box-shadow: 0 0 0 3px rgba(46, 67, 116, 0.16);
}

.auth-card {
  border-top: 0;
}

.form-error {
  background: var(--c-danger-light);
  color: var(--c-danger);
  border-radius: 12px;
}

.form-success {
  background: var(--c-success-soft);
  color: var(--c-success);
  border-radius: 12px;
}

/* ── 빈 상태 ─────────────────────────────────────────────────── */
.empty-state-card,
.concierge-empty-state {
  display: flex;
  gap: 13px;
  align-items: flex-start;
  padding: 18px;
}

.empty-state-card svg,
.concierge-empty-state svg {
  color: #c6c2ba;
  flex: 0 0 auto;
}

.empty-state-card strong,
.concierge-empty-state strong {
  display: block;
  font-size: var(--type-title-size);
  font-weight: var(--font-weight-strong);
  letter-spacing: var(--tracking-title);
}

.empty-state-card p,
.concierge-empty-state p {
  margin: 4px 0 0;
  color: var(--c-muted);
  font-size: var(--type-supporting-size);
}

.empty-state-action {
  margin-top: 12px;
}
```

- [ ] **Step 3: `styles.css` 맨 마지막에 import 추가**

`apps/web/src/styles.css`에서 마지막 `@import` 줄(Step 1에서 확인한 목록의 마지막 줄, 현재는
`@import "./styles/travel-tools.css";`) 바로 다음 줄에 추가한다:

```css
@import "./styles/theme-ios.css";
```

- [ ] **Step 4: 타입체크 + 빌드**

Run: `npm run web:typecheck && npm run web:build`
Expected: 에러 없음. CSS만 바꿨으므로 타입체크는 항상 통과해야 하고, 빌드는 `:has()` 선택자 등 최신 CSS
문법이 Vite/esbuild CSS 처리에서 문제없이 번들링되는지 확인하는 목적이다.

- [ ] **Step 5: 프론트엔드 테스트 실행 (회귀 확인)**

Run: `npm --prefix apps/web run test:unit`
Expected: 기존 테스트(`TripManagePage.test.tsx`, `MyPageTab.test.tsx`, `ScheduleCard.test.tsx`,
`NextScheduleCard.test.tsx`, `ChecklistSection.test.tsx`, `ManageLandingSections.test.tsx` 등) 전부 통과.
CSS 클래스/구조를 안 건드렸으므로 실패하면 원인(예: `:has()` 셀렉터를 jsdom이 다르게 처리)을 확인하고,
필요하면 해당 오버라이드 규칙만 조정한다 — 절대 테스트 문구를 바꿔서 맞추지 않는다(이 단계는 마크업
불변이 전제).

- [ ] **Step 6: 브라우저로 전 화면 시각 확인**

`.claude/launch.json`의 `web` 설정으로 미리보기 서버를 켜고(플랜 A/B 세션에서 쓰던 것과 동일하게
`apps/web/.env`의 `VITE_API_BASE_URL`을 로컬 API 포트에 맞춰 둔다), 모바일 프리셋(375×812)에서
아래 화면을 전부 스크린샷으로 확인한다:

1. `/` 시작 화면
2. `/demo` — 오늘 · 전체 일정 · 지도 · 항공 · 긴급 · 마이페이지 6개 탭 전부
3. `/manage` 로그인 화면 및 (로그인 후) 여행 목록
4. `/manage/trips/:id` 보기 화면 몇 개 탭
5. `/manage/trips/:id/edit` 편집 허브

각 화면에서 다음을 확인한다: 겹치는 요소 없음, 텍스트 잘림 없음, 버튼 터치 영역이 좁아 보이지 않음(최소
44px 규칙), 카드/리스트가 새 라운드·그림자로 바뀌었음, 색이 새 팔레트(다크 인디고 Primary, 선셋 Accent,
웜 페이퍼 배경)로 바뀌었음. 깨진 부분이 있으면 `theme-ios.css`의 해당 규칙을 조정한다(마크업은 여전히
건드리지 않는다).

- [ ] **Step 7: 커밋**

```bash
git add apps/web/src/styles/theme-ios.css apps/web/src/styles.css
git commit -m "feat(web): iOS 리디자인 리스킨 레이어(theme-ios.css) 추가"
```

---

## Task 3: 전체 검증 + PR

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 전체 체크 실행**

Run: `npm run check`
Expected: typecheck, build, go test/race, vet, gofmt 전부 통과. 이 단계에서 백엔드는 건드리지 않았으므로
Go 관련 항목은 항상 그린이어야 한다.

- [ ] **Step 2: 프론트 테스트 재확인**

Run: `npm --prefix apps/web run test:unit`
Expected: 전부 통과(Task 2 Step 5와 동일 — 브랜치 최종 상태 기준으로 한 번 더 확인).

- [ ] **Step 3: 브랜치 push + PR**

```bash
git push -u origin feat/web-ios-redesign-stage1-tokens-theme
gh pr create --title "feat(web): iOS 리디자인 1단계 — 디자인 토큰 교체 + 리스킨 레이어" --body "$(cat <<'EOF'
## 변경 요약
디자인 핸드오프(`design_handoff_map_planner_ios`)의 1~2단계를 적용했습니다.
- `apps/web/src/styles/tokens.css`를 새 팔레트/타입 스케일로 교체했습니다(변수 이름 유지, 값만 교체 + 일부 신규 변수 추가).
- `apps/web/src/styles/theme-ios.css`를 신규 추가하고 `styles.css` 맨 마지막에 import해서, 기존 클래스(.screen, .list-card, .check-row, .date-tabs, .flight-journey-card, .bottom-tabs 등) 위에 새 라운드·간격·그림자·상태색을 얹었습니다.
- **마크업(.tsx) 변경 없음.** 정보 구조, 라우팅, 훅, API 계약 전부 그대로입니다.

## 관련 문서
- 로드맵: `docs/superpowers/specs/2026-07-24-ios-redesign-roadmap.md`
- 이 단계 구현 계획: `docs/superpowers/plans/2026-07-24-ios-redesign-stage1-tokens-theme.md`

## 테스트
- `npm run check` 전체 통과
- `npm --prefix apps/web run test:unit` 전체 통과 (마크업 불변 확인)
- 브라우저 수동 확인: 시작 화면 / demo 6탭 / manage 로그인·목록 / 보기 화면 / 편집 허브에서 겹침·잘림·대비 부족 없음

## 변경 유형
- [x] `feat` 기능

## 영향 영역
- [x] Frontend / PWA

## 체크리스트
- [x] 제목이 Conventional Commits 형식입니다.
EOF
)"
```

---

## Self-Review 메모

- **스펙 커버리지:** 핸드오프 `CLAUDE_CODE_PROMPT.md`의 1~2단계(토큰 교체, 리스킨 레이어 추가 및 import
  순서)를 그대로 구현했다. 3단계 이후(컴포넌트 구조 조정)는 이 플랜의 범위가 아니다(로드맵 문서 참고).
- **플레이스홀더 없음:** 모든 스텝에 실행 가능한 전체 코드/명령이 들어있다.
- **타입 일관성:** 이 단계는 TypeScript 코드를 다루지 않으므로 타입 시그니처 이슈가 발생하지 않는다.
  CSS 변수 이름은 Task 1과 Task 2에서 동일하게 참조된다(`--radius-card`, `--c-route`, `--type-*` 등).
