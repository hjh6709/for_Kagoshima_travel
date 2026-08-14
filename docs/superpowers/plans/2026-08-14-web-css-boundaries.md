# Web CSS Boundaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the 1,845-line trip stylesheet into ordered responsibility files without changing rendered UI or runtime behavior.

**Architecture:** Keep `apps/web/src/styles/trip.css` as the only entry imported by `styles.css`. Turn it into an ordered list of five local imports whose concatenated contents are byte-for-byte equal to the current stylesheet, then update CSS contract tests to read the whole trip style bundle rather than one implementation file.

**Tech Stack:** CSS, Node.js test runner, Vite 8, React 19.2.8, Playwright 1.62.1

## Global Constraints

- Preserve the current selector, declaration, comment, media-query, and cascade order exactly.
- Do not change React DOM, copy, colors, typography, spacing, responsive values, or user behavior.
- Keep `styles.css` importing only `./styles/trip.css` for trip styles.
- Do not introduce Cascade Layers or CSS Modules in this PR.
- Keep 44px minimum touch targets and all existing accessibility semantics.
- Verify 195px, 320px, and 375px without horizontal overflow.
- Do not add dependencies or external API calls.

---

### Task 1: Make CSS behavior tests consume the real trip entry

**Files:**
- Create: `apps/web/scripts/style-test-utils.mjs`
- Modify: `apps/web/scripts/mobile-ui-foundations.test.mjs:1-24`
- Modify: `apps/web/scripts/mobile-empty-state-layout.test.mjs:1-5`

**Interfaces:**
- Produces: `readStyleEntry(fileName: string): string`
- Consumes: a CSS entry file and its local `@import "./..."` graph under `apps/web/src/styles/`

- [x] **Step 1: Add a shared test-only entry resolver**

```js
import { readFileSync } from "node:fs";

const stylesDirectory = new URL("../src/styles/", import.meta.url);
const localImportPattern = /@import\s+["']\.\/([^"']+)["'];/g;

export function readStyleEntry(fileName, stack = []) {
  if (stack.includes(fileName)) {
    throw new Error(`순환 CSS import: ${[...stack, fileName].join(" -> ")}`);
  }

  const css = readFileSync(new URL(fileName, stylesDirectory), "utf8");
  return css.replace(localImportPattern, (_statement, importedFile) =>
    readStyleEntry(importedFile, [...stack, fileName]),
  );
}
```

This helper follows the same ordered local imports as the browser-facing entry instead of hard-coding the new file names in tests.

- [x] **Step 2: Point existing trip CSS contracts at the real entry resolver**

In `mobile-ui-foundations.test.mjs`:

```js
import { readStyleEntry } from "./style-test-utils.mjs";

const tripStyles = readStyleEntry("trip.css");
```

In `mobile-empty-state-layout.test.mjs`:

```js
import { readStyleEntry } from "./style-test-utils.mjs";

const tripCSS = readStyleEntry("trip.css");
```

Remove `readFileSync` from the second file because it has no other filesystem reads. Keep every behavior assertion unchanged.

- [x] **Step 3: Run the characterization tests before changing production CSS**

Run: `npm --prefix apps/web run test:dependencies`

Expected: all 17 existing contracts PASS against the current monolithic `trip.css`. These tests are the behavior-preserving refactor safety net; do not add tests that only inspect file names or source markers.

- [x] **Step 4: Do not commit yet**

The test-only entry resolver and split files form one reviewable change and are committed together in Task 2.

---

### Task 2: Split `trip.css` without changing one byte of rule order

**Files:**
- Create: `apps/web/src/styles/trip-core.css`
- Create: `apps/web/src/styles/trip-mypage.css`
- Create: `apps/web/src/styles/trip-narrow.css`
- Create: `apps/web/src/styles/trip-today.css`
- Create: `apps/web/src/styles/trip-schedule.css`
- Modify: `apps/web/src/styles/trip.css:1-1845`
- Test: `apps/web/scripts/mobile-ui-foundations.test.mjs`
- Test: `apps/web/scripts/mobile-empty-state-layout.test.mjs`

**Interfaces:**
- Consumes: the exact pre-change contents of `trip.css`
- Produces: five ordered CSS implementation files consumed through `trip.css`
- Produces: unchanged external import `@import "./styles/trip.css";` in `styles.css`

- [x] **Step 1: Split at the existing contiguous boundaries**

Use the pre-change `trip.css` content and preserve all characters within each range:

- `trip-core.css`: beginning through the rule immediately before `/* My page: account, active trip, and security settings rail. */`
- `trip-mypage.css`: that My page comment through the rule immediately before the first `@media (max-width: 360px)` after `.mypage-delete-submit`
- `trip-narrow.css`: that `@media (max-width: 360px)` through the closing brace immediately before `/* ── 오늘 탭 (2단계)`
- `trip-today.css`: the Today tab comment through the closing brace immediately before `/* ── 일정 탭 (3단계)`
- `trip-schedule.css`: the Schedule tab comment through end of file

- [x] **Step 2: Replace `trip.css` with the ordered entry imports**

```css
/*
 * Trip screen style entry point.
 * Keep imports in source order: shared rules first, narrow and screen refinements last.
 */
@import "./trip-core.css";
@import "./trip-mypage.css";
@import "./trip-narrow.css";
@import "./trip-today.css";
@import "./trip-schedule.css";
```

- [x] **Step 3: Prove that the five files exactly reproduce the previous stylesheet**

Before committing, run:

```bash
git show HEAD:apps/web/src/styles/trip.css > /tmp/trip-before.css
node -e 'const fs=require("fs"); const names=["trip-core.css","trip-mypage.css","trip-narrow.css","trip-today.css","trip-schedule.css"]; fs.writeFileSync("/tmp/trip-after.css", names.map(n=>fs.readFileSync(`apps/web/src/styles/${n}`,"utf8")).join(""));'
cmp /tmp/trip-before.css /tmp/trip-after.css
```

Expected: `cmp` exits 0 with no output.

- [x] **Step 4: Run CSS contract tests**

Run: `npm --prefix apps/web run test:dependencies`

Expected: all dependency and accessibility contracts PASS, including the new boundary tests.

- [x] **Step 5: Run the web unit suite and production build**

Run: `npm --prefix apps/web test && npm --prefix apps/web run build`

Expected: all Vitest tests PASS and Vite completes a production build.

- [x] **Step 6: Commit the mechanical split**

```bash
git add apps/web/src/styles/trip.css \
  apps/web/src/styles/trip-core.css \
  apps/web/src/styles/trip-mypage.css \
  apps/web/src/styles/trip-narrow.css \
  apps/web/src/styles/trip-today.css \
  apps/web/src/styles/trip-schedule.css \
  apps/web/scripts/style-test-utils.mjs \
  apps/web/scripts/mobile-ui-foundations.test.mjs \
  apps/web/scripts/mobile-empty-state-layout.test.mjs
git commit -m "refactor(web): 여행 화면 CSS 책임 분리"
```

---

### Task 3: Add the missing 320px E2E viewport and verify rendered behavior

**Files:**
- Modify: `apps/web/e2e/fixtures/viewport.ts:1-9`
- Test: `apps/web/e2e/demo.spec.ts`
- Test: `apps/web/e2e/owner.spec.ts`

**Interfaces:**
- Consumes: `VIEWPORTS` from `apps/web/e2e/fixtures/viewport.ts`
- Produces: Playwright project `demo-320x700` and `owner-320x700`

- [x] **Step 1: Add 320px between the existing 375px and 195px viewports**

```ts
export const VIEWPORTS = [
  { name: "375x812", width: 375, height: 812 },
  { name: "320x700", width: 320, height: 700 },
  { name: "195x700", width: 195, height: 700 },
] as const;
```

Update the adjacent comment so it names all three verification roles: normal compact phone, narrow phone, and minimum specification width.

- [x] **Step 2: Run demo E2E at all three widths**

Run:

```bash
npm --prefix apps/web run test:e2e -- \
  --project=demo-375x812 \
  --project=demo-320x700 \
  --project=demo-195x700
```

Expected: Today, Schedule, Map, Flights, and Concierge tabs open without console errors, horizontal overflow, or bottom-tab touch-target failures at 375px, 320px, and 195px.

- [x] **Step 3: Run owner E2E at all three widths**

Run:

```bash
npm --prefix apps/web run test:e2e -- \
  --project=owner-375x812 \
  --project=owner-320x700 \
  --project=owner-195x700
```

Expected: list, trip detail, and My Page tests pass. The same-row header assertion runs only at 375px; it remains skipped at 320px and 195px because that assertion documents the 375px layout contract.

- [x] **Step 4: Commit the viewport coverage**

```bash
git add apps/web/e2e/fixtures/viewport.ts
git commit -m "test(web): 320px 모바일 회귀 검증 추가"
```

---

### Task 4: Complete repository verification and handoff

**Files:**
- Modify: `docs/superpowers/plans/2026-08-14-web-css-boundaries.md` only to mark completed checkboxes

**Interfaces:**
- Consumes: all changes from Tasks 1-3
- Produces: a clean branch ready for review

- [x] **Step 1: Run the complete repository check**

Run: `npm run check`

Expected: TypeScript, production build, Go tests, race tests, vet, and gofmt checks all PASS.

- [x] **Step 2: Inspect the final diff for accidental visual changes**

Run:

```bash
git diff origin/main...HEAD --stat
git diff origin/main...HEAD -- apps/web/src/styles.css apps/web/src/styles/trip.css apps/web/src/styles/trip-*.css
git diff --check
```

Expected: `styles.css` is unchanged; child CSS concatenation still equals the original `trip.css`; no declarations were edited.

- [x] **Step 3: Confirm the branch is clean**

Run: `git status --short --branch`

Expected: no unstaged or uncommitted source changes after the plan checklist update is committed.

- [x] **Step 4: Commit the completed plan record**

```bash
git add docs/superpowers/plans/2026-08-14-web-css-boundaries.md
git commit -m "docs: 웹 CSS 분리 검증 결과 기록"
```
