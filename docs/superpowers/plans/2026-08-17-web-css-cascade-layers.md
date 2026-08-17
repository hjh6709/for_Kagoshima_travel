# Web CSS Cascade Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the global stylesheet priority explicit with Cascade Layers without changing the current mobile UI or user behavior.

**Architecture:** Keep `apps/web/src/styles.css` as the only application style entry. Declare one stable layer order, assign every existing stylesheet import to exactly one layer, and add a source-level contract that fails if a future global stylesheet bypasses that order. Verify the change against the production build and the existing 375px, 320px, and 195px mobile E2E matrix.

**Tech Stack:** CSS Cascade Layers, Node.js test runner, Vite 8, React 19.2.8, Playwright 1.62.1

## Global Constraints

- Preserve the current DOM, copy, user behavior, accessibility semantics, colors, typography, spacing, and responsive layout.
- Keep `styles.css` as the only stylesheet imported by the React application entry.
- Use the fixed order `tokens, foundation, features, feedback, theme`.
- Assign all current global stylesheet imports to a named layer; do not leave an unlayered import that would outrank the named layers.
- Do not add dependencies, CSS Modules, selector rewrites, or feature changes.
- Keep 44px minimum touch targets and prevent horizontal overflow at 375px, 320px, and 195px.
- Treat the production build as authoritative because development-mode CSS injection can use a different order.

---

### Task 1: Lock the global layer topology with a failing contract

**Files:**
- Create: `apps/web/scripts/cascade-layers.test.mjs`
- Test: `apps/web/scripts/cascade-layers.test.mjs`

**Interfaces:**
- Consumes: `apps/web/src/styles.css`
- Produces: a contract requiring one declared layer order and one named layer for every global CSS import

- [x] **Step 1: Add the expected import-to-layer mapping**

```js
const expectedImports = [
  ["tokens.css", "tokens"],
  ["foundation.css", "foundation"],
  ["manage.css", "features"],
  ["place-search.css", "features"],
  ["share.css", "features"],
  ["trip.css", "features"],
  ["map.css", "features"],
  ["travel-components.css", "features"],
  ["feedback.css", "feedback"],
  ["travel-tools.css", "features"],
  ["theme-ios.css", "theme"],
];
```

- [x] **Step 2: Assert the declaration order and reject unlayered imports**

The test must require this exact statement:

```css
@layer tokens, foundation, features, feedback, theme;
```

It must parse every top-level `@import`, compare the ordered file/layer pairs with `expectedImports`, and assert that the parsed import count equals the total import count. This prevents a later stylesheet from silently bypassing the layer contract.

- [x] **Step 3: Run the new test and verify RED**

Run: `node --test apps/web/scripts/cascade-layers.test.mjs`

Expected: FAIL because the current `styles.css` has neither the layer declaration nor layered imports.

- [x] **Step 4: Commit only after Task 2 turns the contract green**

The contract and implementation are one reviewable architecture change.

---

### Task 2: Assign every global stylesheet to the fixed layer order

**Files:**
- Modify: `apps/web/src/styles.css:1-15`
- Test: `apps/web/scripts/cascade-layers.test.mjs`

**Interfaces:**
- Consumes: the existing stylesheet order and files
- Produces: named global cascade priority `tokens < foundation < features < feedback < theme`

- [x] **Step 1: Declare the layer order before imports**

```css
@layer tokens, foundation, features, feedback, theme;
```

- [x] **Step 2: Add a layer to each existing import without reordering files**

```css
@import "./styles/tokens.css" layer(tokens);
@import "./styles/foundation.css" layer(foundation);
@import "./styles/manage.css" layer(features);
@import "./styles/place-search.css" layer(features);
@import "./styles/share.css" layer(features);
@import "./styles/trip.css" layer(features);
@import "./styles/map.css" layer(features);
@import "./styles/travel-components.css" layer(features);
@import "./styles/feedback.css" layer(feedback);
@import "./styles/travel-tools.css" layer(features);
@import "./styles/theme-ios.css" layer(theme);
```

Keep the source order unchanged so rules within `features` retain their current relative order. The named layer order intentionally makes feedback outrank every feature stylesheet even though `travel-tools.css` follows it in source order.

- [x] **Step 3: Run the contract and verify GREEN**

Run: `npm --prefix apps/web run test:dependencies`

Expected: all contracts PASS, including the new layer topology test.

- [x] **Step 4: Run web unit tests and production build**

Run: `npm --prefix apps/web test && npm --prefix apps/web run build`

Expected: 187 unit tests plus all dependency contracts PASS and Vite emits a production build without CSS import warnings.

- [x] **Step 5: Commit the layer contract and entry-point change**

```bash
git add apps/web/src/styles.css apps/web/scripts/cascade-layers.test.mjs
git commit -m "refactor(web): 전역 CSS 우선순위 계층화"
```

---

### Task 3: Prove the production UI did not regress

**Files:**
- Modify: `docs/superpowers/plans/2026-08-17-web-css-cascade-layers.md` only to mark completed checkboxes
- Modify: `apps/web/src/styles/theme-ios.css` to preserve feature modifier semantics across layers
- Test: `apps/web/e2e/demo.spec.ts`
- Test: `apps/web/e2e/owner.spec.ts`

**Interfaces:**
- Consumes: the layered production CSS bundle
- Produces: a reviewable branch with mobile and repository-wide verification evidence

- [x] **Step 1: Inspect the production CSS output**

Run: `npm --prefix apps/web run build`

Expected: Vite emits the five named layer blocks in declared order and no unlayered application stylesheet content introduced by this change. Vite may normalize away the standalone order statement after imports are inlined.

- [x] **Step 2: Run demo E2E at all supported widths**

```bash
npm --prefix apps/web run test:e2e -- \
  --project=demo-375x812 \
  --project=demo-320x700 \
  --project=demo-195x700
```

Expected: Today, Itinerary, Map, Flights, and Emergency open without console errors or horizontal overflow; bottom navigation touch targets remain valid.

- [x] **Step 3: Run owner E2E at all supported widths**

```bash
npm --prefix apps/web run test:e2e -- \
  --project=owner-375x812 \
  --project=owner-320x700 \
  --project=owner-195x700
```

Expected: trip list, trip detail, management, and My Page flows pass at all three widths.

- [x] **Step 4: Run the complete repository check**

Run: `npm run check`

Expected: TypeScript, production build, Go tests, race tests, vet, and gofmt checks all PASS.

- [x] **Step 5: Inspect the final diff**

```bash
git diff origin/main...HEAD --check
git diff origin/main...HEAD -- apps/web/src/styles.css apps/web/scripts/cascade-layers.test.mjs
git status --short --branch
```

Expected: the layer entry, its contract, the schedule modifier regression test/fix, and this completed plan changed; no React, DOM, copy, or feature behavior changed.

- [x] **Step 6: Commit the verification record**

```bash
git add docs/superpowers/plans/2026-08-17-web-css-cascade-layers.md
git commit -m "docs: CSS 계층화 검증 결과 기록"
```

## Verification Record

- Source contract: 19/19 passed.
- Web unit tests: 187/187 passed.
- Playwright: 47 passed, 2 intentionally skipped across 375px, 320px, and 195px.
- Existing `main` versus layered build at 375px: Today, Itinerary, Map, Flights, and Emergency screenshots matched byte-for-byte after preserving `.fit-tabs` and `.pill` modifier semantics.
- Full `npm run check`: passed after rerunning outside the filesystem sandbox so Go `httptest` could bind an ephemeral loopback port.
