# E2E 스모크 테스트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실제 브라우저에서 데모 5탭과 로그인 화면을 두 뷰포트로 훑어, 단위 테스트가 구조적으로 잡을 수 없는 레이아웃·런타임 회귀를 CI에서 막는다.

**Architecture:** Playwright + Chromium 하나만 쓴다. 프로덕션 빌드를 `vite preview`로 5173에 띄우고(개발 서버 아님 — CSS 캐스케이드 순서와 번들 결과를 그대로 검증하기 위해), Go API는 in-memory 저장소로 8080에 띄운다. 인증은 HttpOnly 쿠키라 토큰 주입이 불가능하므로, setup 프로젝트가 실제 `/api/auth/register`를 호출해 쿠키를 받고 `storageState`로 저장한 뒤 나머지 테스트가 재사용한다.

**Tech Stack:** Playwright(신규 devDependency), Vite preview, Go API(in-memory), GitHub Actions.

## Global Constraints

- **신규 런타임 의존성 0개.** Playwright는 `apps/web`의 `devDependencies`에만 넣는다. 사용자에게 전송되는 번들에 들어가면 안 된다.
- **브라우저는 Chromium 하나만.** CI 시간과 캐시 용량 때문이다. `webkit`/`firefox`를 설치하지 않는다.
- **뷰포트 2종 고정:** `375×812`(기준 기기), `195×700`(디자인 스펙 최소 폭).
- **통과 조건은 문장이 아니라 측정값이어야 한다.** "보인다/깨지지 않는다"는 금지. 콘솔 에러 개수, 컨테이너 오버플로 픽셀, 요소 박스 크기처럼 숫자로 판정한다.
- **오버플로 판정은 컨테이너 기준.** `.phone-frame`이 `overflow: hidden`이라 `document.body`의 가로 스크롤은 절대 발생하지 않는다. `el.scrollWidth > el.clientWidth`와 자식-부모 박스 비교로 판정한다. (과거에 `body` 기준으로 검사해 195px 오버플로를 세 번 놓쳤다.)
- **로컬/CI 실행 조합 고정:** API는 `8080`, 웹은 `5173`. API의 개발 기본 `ALLOWED_ORIGINS`가 `http://localhost:5173` 하나뿐이라 다른 포트를 쓰면 CORS로 전부 실패한다(`apps/api/internal/server/server.go:218`).
- **API 기동 환경변수:** `DATABASE_URL`을 빈 값으로 두면 in-memory 저장소가 뜬다. `AUTH_TEST_BYPASS=1`은 이메일 인증 코드를 건너뛴다(production에서는 서버가 기동을 거부하므로 안전하다 — `server.go:43`). `JWT_SECRET`은 필수.
- **`VITE_API_BASE_URL`은 빌드 시점에 인라인된다.** `vite preview`용 빌드를 만들 때 반드시 `VITE_API_BASE_URL=http://localhost:8080`을 넣어야 한다. 로컬 `.env`에는 이미 있지만 `.gitignore` 대상이라 CI에는 없다.
- **Google Maps 키가 없다.** CI에는 `VITE_GOOGLE_MAPS_BROWSER_KEY`가 비어 있으므로 지도 탭은 실제 지도를 그리지 못한다. 지도 탭 검증은 컨테이너와 폴백 UI까지만 한다.
- 기존 `npm test`(vitest)와 `npm run test:dependencies`(node --test)는 건드리지 않는다. E2E는 별도 스크립트다.

---

## 배경: 이 테스트가 잡아야 하는 실제 회귀

iOS 리디자인 6단계에서 단위 테스트를 전부 통과한 채로 흘린 버그들이다. 모두 "렌더는 되는데 화면이 틀린" 종류라, 실제 브라우저 없이는 잡히지 않았다.

| # | 증상 | 근본 원인 | 발견 경로 |
| --- | --- | --- | --- |
| 1 | 여행 카드 `⋯` 메뉴가 왼쪽에 붙음 | `inline-flex`는 inline-level이라 `margin-left: auto`가 무시된다 | 사람이 로컬 앱을 보고 |
| 2 | `내 여행` 헤더의 `새 여행`/`마이페이지`가 두 줄로 갈라짐 | 헤더 액션 래핑 | 사람이 로컬 앱을 보고 |
| 3 | 195px에서 길찾기·완료 버튼이 카드 밖으로 | 고정 폭 합계가 뷰포트 초과 | 리뷰어가 |

세 건 모두 **2개 뷰포트 스모크 하나면 잡혔다.** 그래서 Task 5는 이 셋을 명시적 회귀 케이스로 박는다.

---

## File Structure

| 파일 | 책임 |
| --- | --- |
| `apps/web/playwright.config.ts` | 프로젝트(setup/데모/로그인), 뷰포트, webServer 두 개, 리포터 |
| `apps/web/e2e/fixtures/viewport.ts` | 뷰포트 상수와 프로젝트 이름. 매직 넘버를 한 곳에 모은다 |
| `apps/web/e2e/fixtures/assertions.ts` | 측정 기반 공통 단언 — 오버플로 0, 터치 44px, 콘솔 에러 0 |
| `apps/web/e2e/fixtures/consoleGuard.ts` | 콘솔/페이지 에러 수집기와 허용 목록 |
| `apps/web/e2e/fixtures/demoState.ts` | 데모 여행 단계를 강제하는 localStorage 시드 |
| `apps/web/e2e/auth.setup.ts` | 계정 생성 + 여행 시드 + `storageState` 저장 |
| `apps/web/e2e/demo.spec.ts` | 데모 5탭 스모크 |
| `apps/web/e2e/demoPhases.spec.ts` | 여행 전/중/후 3단계 |
| `apps/web/e2e/owner.spec.ts` | 로그인 목록·상세·마이페이지 + 회귀 3건 |
| `.github/workflows/ci.yml` | `e2e` 잡 추가 |
| `apps/web/.gitignore` | `test-results/`, `playwright-report/`, `e2e/.auth/` 제외 |

각 spec은 자기 화면만 책임진다. 공통 단언은 `fixtures/`에 모아 중복을 없앤다.

---

## Task 1: Playwright 도입과 첫 스모크

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/fixtures/viewport.ts`
- Create: `apps/web/e2e/demo.spec.ts`
- Modify: `apps/web/package.json`
- Modify: `apps/web/.gitignore`
- Modify: `apps/web/tsconfig.json`(필요 시 `e2e` 포함 제외)

**Interfaces:**
- Consumes: 없음(첫 태스크)
- Produces: `VIEWPORTS`(`{ name: string; width: number; height: number }[]`), npm 스크립트 `test:e2e`, Playwright 설정에서 참조하는 `baseURL = "http://localhost:5173"`

- [ ] **Step 1: Playwright 설치**

```bash
cd apps/web
npm install --save-dev --save-exact @playwright/test
npx playwright install chromium
```

`--save-exact`를 쓰는 이유: Playwright는 npm 패키지 버전과 브라우저 바이너리가 짝을 이룬다. 캐럿(`^`)으로 두면 CI가 다른 패치를 받아 캐시가 어긋난다.

- [ ] **Step 2: 뷰포트 상수 작성**

`apps/web/e2e/fixtures/viewport.ts`:

```ts
// 375는 기준 기기(iPhone SE/13 mini 급), 195는 디자인 스펙이 요구하는 최소 폭이다.
// 195에서 깨진 적이 세 번 있어 스모크의 기본 축으로 둔다.
export const VIEWPORTS = [
  { name: "375x812", width: 375, height: 812 },
  { name: "195x700", width: 195, height: 700 },
] as const;

export type ViewportName = (typeof VIEWPORTS)[number]["name"];
```

- [ ] **Step 3: 실패하는 첫 테스트 작성**

`apps/web/e2e/demo.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("데모 화면이 오늘 탭으로 열린다", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();
  await expect(page.getByRole("button", { name: "오늘" })).toHaveAttribute("aria-current", "page");
});
```

- [ ] **Step 4: 테스트가 실패하는지 확인**

Run: `cd apps/web && npx playwright test e2e/demo.spec.ts`
Expected: FAIL — `playwright.config.ts`가 없어 `baseURL`이 비었고 `page.goto("/demo")`가 실패한다.

- [ ] **Step 5: Playwright 설정 작성**

`apps/web/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";
import { VIEWPORTS } from "./e2e/fixtures/viewport";

const WEB_PORT = 5173;
const API_PORT = 8080;
const BASE_URL = `http://localhost:${WEB_PORT}`;
const API_URL = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // 레이아웃 측정은 병렬 실행과 무관하게 안정적이지만, CI 러너 1코어에서 흔들리는 것을 막는다.
  fullyParallel: !process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: !!process.env.CI,
  // 재시도는 두지 않는다. 스모크가 불안정하면 테스트를 고쳐야지 재시도로 덮으면 안 된다.
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: VIEWPORTS.map((viewport) => ({
    name: `demo-${viewport.name}`,
    testMatch: /demo.*\.spec\.ts/,
    use: { ...devices["Desktop Chrome"], viewport: { width: viewport.width, height: viewport.height } },
  })),
  webServer: [
    {
      // 프로덕션 빌드를 그대로 검증한다. 개발 서버는 CSS 주입 순서가 달라
      // theme-ios.css 캐스케이드 회귀를 놓칠 수 있다.
      command: `VITE_API_BASE_URL=${API_URL} npm run build && npm run preview -- --port ${WEB_PORT} --strictPort`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      // DATABASE_URL을 비우면 in-memory 저장소가 뜬다(server.go). 매 실행이 깨끗한 상태다.
      command: "go run ./cmd/api",
      cwd: "../api",
      url: `${API_URL}/healthz`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DATABASE_URL: "",
        JWT_SECRET: "e2e-secret-not-for-production-0123456789",
        AUTH_TEST_BYPASS: "1",
        PORT: String(API_PORT),
        LOG_LEVEL: "warn",
      },
    },
  ],
});
```

- [ ] **Step 6: 테스트가 통과하는지 확인**

Run: `cd apps/web && npx playwright test e2e/demo.spec.ts`
Expected: PASS ×2 (프로젝트 `demo-375x812`, `demo-195x700`)

- [ ] **Step 7: npm 스크립트와 gitignore 추가**

`apps/web/package.json`의 `scripts`에 추가:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

`apps/web/.gitignore`에 추가:

```
test-results/
playwright-report/
e2e/.auth/
```

- [ ] **Step 8: 기존 검증이 깨지지 않았는지 확인**

Run: `cd apps/web && npm run typecheck && npm test`
Expected: 통과. 깨지면 `tsconfig.json`의 `include`가 `e2e/`를 삼킨 것이다 — `e2e`를 앱 빌드 대상에서 제외한다.

- [ ] **Step 9: 커밋**

```bash
git add apps/web/playwright.config.ts apps/web/e2e apps/web/package.json apps/web/package-lock.json apps/web/.gitignore
git commit -m "test(web): Playwright 도입과 데모 화면 첫 스모크"
```

---

## Task 2: 측정 기반 공통 단언

**Files:**
- Create: `apps/web/e2e/fixtures/consoleGuard.ts`
- Create: `apps/web/e2e/fixtures/assertions.ts`
- Modify: `apps/web/e2e/demo.spec.ts`

**Interfaces:**
- Consumes: Task 1의 `VIEWPORTS`
- Produces:
  - `watchConsole(page: Page): { errors: string[] }`
  - `expectNoConsoleErrors(errors: string[]): void`
  - `expectNoHorizontalOverflow(page: Page): Promise<void>`
  - `expectTouchTargets(page: Page, selector: string, minPx?: number): Promise<void>`

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/e2e/demo.spec.ts`에 추가:

```ts
import { expectNoConsoleErrors, expectNoHorizontalOverflow, watchConsole } from "./fixtures/assertions";

test("데모 화면은 콘솔 에러 없이 뜨고 가로로 넘치지 않는다", async ({ page }) => {
  const console = watchConsole(page);

  await page.goto("/demo");
  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expectNoConsoleErrors(console.errors);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `cd apps/web && npx playwright test e2e/demo.spec.ts`
Expected: FAIL — `Cannot find module './fixtures/assertions'`

- [ ] **Step 3: 콘솔 수집기 구현**

`apps/web/e2e/fixtures/consoleGuard.ts`:

```ts
import type { Page } from "@playwright/test";

// 키 없이 뜨는 지도 경고처럼, 우리가 고칠 수 없고 회귀와 무관한 것만 넣는다.
// 목록을 늘릴 때는 반드시 이유를 주석으로 남긴다. 여기가 넓어지면 이 테스트는 무의미해진다.
const ALLOWED = [
  // CI에는 VITE_GOOGLE_MAPS_BROWSER_KEY가 없다. 지도 SDK 로드 실패는 예상된 상태다.
  /Google Maps/i,
  /InvalidKeyMapError/i,
  // 프리뷰 서버에는 아이콘 등 PWA 자산 일부가 없을 수 있다.
  /Failed to load resource: the server responded with a status of 404/i,
];

function isAllowed(text: string): boolean {
  return ALLOWED.some((pattern) => pattern.test(text));
}

export function watchConsole(page: Page): { errors: string[] } {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (!isAllowed(text)) errors.push(`console.error: ${text}`);
  });

  // 처리되지 않은 예외는 콘솔 이벤트로 오지 않으므로 따로 받는다.
  page.on("pageerror", (error) => {
    const text = error.message;
    if (!isAllowed(text)) errors.push(`pageerror: ${text}`);
  });

  return { errors };
}
```

- [ ] **Step 4: 레이아웃 단언 구현**

`apps/web/e2e/fixtures/assertions.ts`:

```ts
import { expect, type Page } from "@playwright/test";

export { watchConsole } from "./consoleGuard";

export function expectNoConsoleErrors(errors: string[]): void {
  expect(errors, `브라우저 콘솔 에러 ${errors.length}건:\n${errors.join("\n")}`).toEqual([]);
}

// body 기준으로 검사하면 안 된다 — .phone-frame이 overflow: hidden이라
// 카드가 밖으로 삐져나가도 body에는 가로 스크롤이 생기지 않는다.
// 그래서 실제로 스크롤이 생긴 컨테이너를 직접 찾는다.
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const overflowing = await page.evaluate(() => {
    const offenders: Array<{ selector: string; scrollWidth: number; clientWidth: number }> = [];

    for (const element of document.querySelectorAll<HTMLElement>("body *")) {
      // 가로 스크롤을 의도한 요소는 제외한다(날짜 필 트랙 등).
      const overflowX = window.getComputedStyle(element).overflowX;
      if (overflowX === "auto" || overflowX === "scroll") continue;
      if (element.scrollWidth - element.clientWidth <= 1) continue;

      const selector = element.tagName.toLowerCase() + (element.className ? `.${String(element.className).trim().split(/\s+/).join(".")}` : "");
      offenders.push({ selector, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth });
    }

    return offenders;
  });

  expect(
    overflowing,
    `가로로 넘친 컨테이너 ${overflowing.length}개:\n${overflowing.map((item) => `${item.selector} ${item.scrollWidth}px > ${item.clientWidth}px`).join("\n")}`,
  ).toEqual([]);
}

// 44px는 iOS 휴먼 인터페이스 가이드라인의 최소 터치 영역이며,
// scripts/mobile-ui-foundations.test.mjs가 CSS에서 검사하는 값과 같다.
// 여기서는 CSS 규칙이 아니라 실제로 렌더된 박스를 잰다.
export async function expectTouchTargets(page: Page, selector: string, minPx = 44): Promise<void> {
  const boxes = await page.locator(selector).evaluateAll((elements, min) => {
    return elements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { text: (element.textContent ?? "").trim().slice(0, 20), width: Math.round(rect.width), height: Math.round(rect.height) };
      })
      .filter((box) => box.width > 0 && box.height > 0)
      .filter((box) => box.width < min || box.height < min);
  }, minPx);

  expect(boxes, `${minPx}px 미만 터치 영역 ${boxes.length}개:\n${boxes.map((box) => `"${box.text}" ${box.width}x${box.height}`).join("\n")}`).toEqual([]);
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인**

Run: `cd apps/web && npx playwright test e2e/demo.spec.ts`
Expected: PASS ×4 (테스트 2개 × 뷰포트 2개)

실패하면 **먼저 진짜 버그인지 확인한다.** 허용 목록에 추가해 통과시키는 것은 마지막 수단이며, 반드시 이유를 주석으로 남긴다.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/e2e
git commit -m "test(web): 오버플로·터치영역·콘솔 에러 측정 단언 추가"
```

---

## Task 3: 데모 5탭 스모크

**Files:**
- Modify: `apps/web/e2e/demo.spec.ts`

**Interfaces:**
- Consumes: Task 2의 `watchConsole` / `expectNoConsoleErrors` / `expectNoHorizontalOverflow` / `expectTouchTargets`
- Produces: 없음(테스트만)

탭 정의는 `apps/web/src/features/trip/components/tabs/BottomTabs.tsx`에 있다: `오늘`·`일정`·`지도`·`항공`·`긴급`. 각 버튼은 `aria-current="page"`로 활성 상태를 표시한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/e2e/demo.spec.ts`에 추가:

```ts
import { expectTouchTargets } from "./fixtures/assertions";

const TABS = [
  { label: "오늘", heading: /출발 준비|오늘|여행 마무리/ },
  { label: "일정", heading: /일정/ },
  { label: "지도", heading: /지도|장소/ },
  { label: "항공", heading: /항공/ },
  { label: "긴급", heading: /긴급|도움/ },
] as const;

for (const tab of TABS) {
  test(`${tab.label} 탭이 에러 없이 열린다`, async ({ page }) => {
    const console = watchConsole(page);
    await page.goto("/demo");

    await page.getByRole("button", { name: tab.label }).click();
    await expect(page.getByRole("button", { name: tab.label })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: tab.heading }).first()).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page, ".bottom-tabs button");
    expectNoConsoleErrors(console.errors);
  });
}
```

- [ ] **Step 2: 테스트를 돌려 실제 상태를 확인**

Run: `cd apps/web && npx playwright test e2e/demo.spec.ts --reporter=list`
Expected: 일부 실패. `heading` 정규식은 추정값이므로 실제 화면과 다를 수 있다.

**여기서 정규식을 느슨하게 만들어 통과시키지 말 것.** 실패 메시지에 찍힌 실제 제목을 읽고 정규식을 그 값에 맞춘다. 필요하면 `npx playwright test --debug`로 화면을 직접 본다.

- [ ] **Step 3: 실제 제목에 맞춰 정규식 수정**

Step 2에서 확인한 값으로 `TABS`의 `heading`을 고친다. 각 탭마다 화면을 특정할 수 있는 제목이어야 한다 — 모든 탭에 있는 공통 문구를 쓰면 탭 전환이 실패해도 통과한다.

- [ ] **Step 4: 통과 확인**

Run: `cd apps/web && npx playwright test e2e/demo.spec.ts`
Expected: PASS ×12 (테스트 6개 × 뷰포트 2개)

- [ ] **Step 5: 커밋**

```bash
git add apps/web/e2e/demo.spec.ts
git commit -m "test(web): 데모 5탭을 두 뷰포트로 훑는 스모크 추가"
```

---

## Task 4: 여행 전·중·후 3단계

**Files:**
- Create: `apps/web/e2e/fixtures/demoState.ts`
- Create: `apps/web/e2e/demoPhases.spec.ts`

**Interfaces:**
- Consumes: Task 2의 단언들
- Produces: `seedDemoPhase(page: Page, phase: "before" | "during" | "after"): Promise<void>`

**왜 필요한가:** `apps/web/src/data/sampleTrip.ts:14`가 `startDate = shiftDate(getTodayDateString(), 14)`로 계산하므로, 데모는 **항상 여행 전(D-14)** 상태다. 여행 중·후 화면은 브라우저에서 한 번도 검증된 적이 없다. 1단계에서 "여행 전인데 헤더가 '오늘'이라고 표시"되는 버그가 나왔던 화면이 정확히 여기다.

시계를 조작할 필요는 없다. `useTripPageController`가 `getSavedTripDates()`로 localStorage에서 여행 기간을 읽으므로(`tripViewState.ts:57`), 키 `map-planner-shanghai-demo-v1-trip-dates`에 값을 심으면 단계를 강제할 수 있다.

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/e2e/demoPhases.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, expectNoHorizontalOverflow, watchConsole } from "./fixtures/assertions";
import { seedDemoPhase } from "./fixtures/demoState";

const PHASES = [
  { phase: "before", title: "출발 준비" },
  { phase: "during", title: "오늘" },
  { phase: "after", title: "여행 마무리" },
] as const;

for (const { phase, title } of PHASES) {
  test(`여행 ${phase} 단계에서 오늘 탭 제목이 "${title}"이다`, async ({ page }) => {
    const console = watchConsole(page);

    await seedDemoPhase(page, phase);
    await page.goto("/demo");

    await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    expectNoConsoleErrors(console.errors);
  });
}
```

문구의 출처는 `apps/web/src/features/trip/todayCopy.ts`의 `getTodayTabCopy`다. 단위 테스트는 함수만 검증하지만, 이 테스트는 그 값이 실제로 화면에 도달하는지를 본다.

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `cd apps/web && npx playwright test e2e/demoPhases.spec.ts`
Expected: FAIL — `Cannot find module './fixtures/demoState'`

- [ ] **Step 3: 시드 헬퍼 구현**

`apps/web/e2e/fixtures/demoState.ts`:

```ts
import type { Page } from "@playwright/test";

// apps/web/src/features/trip/tripViewState.ts:32와 같은 값이어야 한다.
const TRIP_DATES_KEY = "map-planner-shanghai-demo-v1-trip-dates";

function shift(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// 데모 샘플 데이터는 startDate를 오늘+14로 계산하므로 기본 상태가 항상 "여행 전"이다.
// 컨트롤러가 localStorage의 여행 기간을 우선하므로, 시계를 건드리지 않고 단계를 바꿀 수 있다.
const RANGES = {
  before: { startDate: shift(14), endDate: shift(17) },
  during: { startDate: shift(-1), endDate: shift(2) },
  after: { startDate: shift(-10), endDate: shift(-7) },
} as const;

export type DemoPhase = keyof typeof RANGES;

export async function seedDemoPhase(page: Page, phase: DemoPhase): Promise<void> {
  // 앱 스크립트가 localStorage를 읽기 전에 심어야 한다.
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [TRIP_DATES_KEY, JSON.stringify(RANGES[phase])] as const,
  );
}
```

- [ ] **Step 4: 프로젝트 매칭 확인**

`playwright.config.ts`의 `testMatch: /demo.*\.spec\.ts/`가 `demoPhases.spec.ts`도 잡는다. 안 잡히면 정규식을 고친다.

- [ ] **Step 5: 통과 확인**

Run: `cd apps/web && npx playwright test e2e/demoPhases.spec.ts`
Expected: PASS ×6 (3단계 × 뷰포트 2개)

`during`이 실패하면 시드한 기간이 아니라 실제 오늘 날짜 기준으로 판정됐다는 뜻이다. `addInitScript`가 `goto` **이전에** 호출됐는지 확인한다.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/e2e
git commit -m "test(web): 여행 전·중·후 세 단계 화면 검증 추가"
```

---

## Task 5: 로그인 화면과 회귀 3건

**Files:**
- Create: `apps/web/e2e/auth.setup.ts`
- Create: `apps/web/e2e/owner.spec.ts`
- Modify: `apps/web/playwright.config.ts`

**Interfaces:**
- Consumes: Task 2의 단언들
- Produces: `storageState` 파일 `e2e/.auth/owner.json`, 시드된 여행 1건

**인증 구조:** 세션은 **HttpOnly 쿠키**(`map_planner_session`)다(`apps/api/internal/server/auth_session_test.go:47`). localStorage에 토큰을 넣는 방식은 통하지 않는다. `POST /api/auth/register`가 201과 함께 쿠키를 내려주고, `AUTH_TEST_BYPASS=1`이면 인증 코드가 필요 없다.

- [ ] **Step 1: setup 프로젝트 작성**

`apps/web/e2e/auth.setup.ts`:

```ts
import { expect, test as setup } from "@playwright/test";

const API_URL = "http://localhost:8080";
const STORAGE_STATE = "e2e/.auth/owner.json";

setup("계정을 만들고 여행 하나를 시드한다", async ({ page, request }) => {
  // in-memory 저장소는 매 실행이 비어 있지만, reuseExistingServer로 서버가 살아있을 수 있어
  // 이메일을 매번 다르게 만든다.
  const email = `e2e-${Date.now()}@example.com`;

  const registered = await request.post(`${API_URL}/api/auth/register`, {
    data: { email, password: "password123" },
    headers: { Origin: "http://localhost:5173" },
  });
  expect(registered.status(), await registered.text()).toBe(201);

  const created = await request.post(`${API_URL}/api/trips`, {
    data: {
      title: "상하이 여행",
      startDate: today(0),
      endDate: today(3),
      travelers: ["나"],
      destinationCountry: "CN",
      memo: "",
    },
    headers: { Origin: "http://localhost:5173" },
  });
  expect(created.status(), await created.text()).toBe(201);
  const trip = await created.json();

  const place = await request.post(`${API_URL}/api/trips/${trip.id}/places`, {
    data: { name: "예원", category: "attraction", address: "황푸구", googleMapsUrl: "", recommendedReason: "" },
    headers: { Origin: "http://localhost:5173" },
  });
  expect(place.status(), await place.text()).toBe(201);
  const savedPlace = await place.json();

  const schedule = await request.post(`${API_URL}/api/trips/${trip.id}/schedules`, {
    data: {
      placeId: savedPlace.id,
      date: today(0),
      time: "10:00",
      type: "attraction",
      title: "예원 산책",
      transportMemo: "",
      guideMemo: "",
    },
    headers: { Origin: "http://localhost:5173" },
  });
  expect(schedule.status(), await schedule.text()).toBe(201);

  // request 컨텍스트의 쿠키를 브라우저 컨텍스트로 옮긴다.
  const cookies = await request.storageState();
  await page.context().addCookies(cookies.cookies);
  await page.context().storageState({ path: STORAGE_STATE });
});

function today(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
```

**주의:** 위 요청 본문은 `apps/api/internal/dto/travel.go`의 DTO에서 가져온 것이지만, `category`/`type`에 서버가 허용하는 값 집합이 있을 수 있다. 401이 아닌 400이 나오면 응답 본문(`await created.text()`)에 이유가 찍히므로 그 값을 보고 맞춘다.

- [ ] **Step 2: 설정에 setup·owner 프로젝트 추가**

`playwright.config.ts`의 `projects` 배열을 다음으로 교체:

```ts
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    ...VIEWPORTS.map((viewport) => ({
      name: `demo-${viewport.name}`,
      testMatch: /demo.*\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: viewport.width, height: viewport.height } },
    })),
    ...VIEWPORTS.map((viewport) => ({
      name: `owner-${viewport.name}`,
      testMatch: /owner\.spec\.ts/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: viewport.width, height: viewport.height },
        storageState: "e2e/.auth/owner.json",
      },
    })),
  ],
```

- [ ] **Step 3: 실패하는 회귀 테스트 작성**

`apps/web/e2e/owner.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, expectNoHorizontalOverflow, expectTouchTargets, watchConsole } from "./fixtures/assertions";

test("여행 목록이 뜨고 가로로 넘치지 않는다", async ({ page }) => {
  const console = watchConsole(page);

  await page.goto("/manage");
  await expect(page.getByRole("heading", { name: "내 여행", level: 1 })).toBeVisible();
  await expect(page.getByText("상하이 여행")).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expectNoConsoleErrors(console.errors);
});

// 회귀 1 — inline-flex는 inline-level이라 margin-left: auto가 무시된다.
// 이 버그로 ⋯ 메뉴가 카드 왼쪽에 붙어 있었다.
test("여행 카드의 관리 메뉴는 카드 오른쪽 끝에 붙는다", async ({ page }) => {
  await page.goto("/manage");

  const menu = page.getByRole("group", { name: "상하이 여행 관리 메뉴" });
  await expect(menu).toBeVisible();

  const menuBox = await menu.boundingBox();
  const cardBox = await page.locator(".owner-trip-card").first().boundingBox();
  expect(menuBox).not.toBeNull();
  expect(cardBox).not.toBeNull();

  // 메뉴 오른쪽 끝이 카드 오른쪽 끝에서 24px 이내여야 한다(패딩 감안).
  const gapFromRight = cardBox!.x + cardBox!.width - (menuBox!.x + menuBox!.width);
  expect(gapFromRight, `메뉴가 카드 오른쪽에서 ${Math.round(gapFromRight)}px 떨어져 있다`).toBeLessThanOrEqual(24);
});

// 회귀 2 — 헤더 액션이 두 줄로 갈라졌다. 375px에서는 반드시 한 줄이어야 한다.
test("375px에서 헤더의 두 버튼은 같은 줄에 있다", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("375"), "375px 전용 회귀 검증이다");

  await page.goto("/manage");

  const createBox = await page.getByRole("button", { name: /새 여행/ }).boundingBox();
  const accountBox = await page.getByRole("link", { name: /마이페이지/ }).boundingBox();
  expect(createBox).not.toBeNull();
  expect(accountBox).not.toBeNull();

  // 같은 줄이면 세로 중심이 거의 일치한다.
  const createCenter = createBox!.y + createBox!.height / 2;
  const accountCenter = accountBox!.y + accountBox!.height / 2;
  expect(Math.abs(createCenter - accountCenter), "헤더 버튼이 두 줄로 갈라졌다").toBeLessThanOrEqual(4);
});

test("여행 상세와 마이페이지가 에러 없이 열린다", async ({ page }) => {
  const console = watchConsole(page);

  await page.goto("/manage");
  await page.getByText("상하이 여행").click();
  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page, ".bottom-tabs button");

  await page.goto("/manage/account");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  expectNoConsoleErrors(console.errors);
});
```

- [ ] **Step 4: 테스트를 돌려 실제 상태 확인**

Run: `cd apps/web && npx playwright test e2e/owner.spec.ts --reporter=list`
Expected: 일부 실패. 셀렉터(`.owner-trip-card`)와 상세 진입 방식은 추정이므로 실제 마크업으로 고친다.

셀렉터 확인:
```bash
grep -n "owner-trip-card\|className" apps/web/src/features/manage/components/sections/TripListSection.tsx | head -20
```

- [ ] **Step 5: 회귀 테스트가 진짜로 버그를 잡는지 검증**

**이 단계를 건너뛰지 말 것.** 통과하는 테스트는 버그를 잡는다는 증거가 아니다. 일부러 회귀를 넣어 실패를 확인한다.

```bash
# apps/web/src/styles/manage.css에서 .owner-trip-manage의 display를 잠시 inline-flex로 되돌린다
# 테스트가 FAIL 하는지 확인한 뒤 되돌린다
```

Expected: "여행 카드의 관리 메뉴는 카드 오른쪽 끝에 붙는다"가 FAIL. 실패하지 않으면 단언이 무의미하므로 다시 설계한다.

헤더 회귀도 같은 방식으로 확인한다 — `.owner-header-actions`의 `flex-wrap`을 `wrap`으로 바꿔 375px에서 FAIL 하는지 본다.

- [ ] **Step 6: 전체 통과 확인**

Run: `cd apps/web && npx playwright test`
Expected: 전부 PASS. 프로젝트별 개수를 리포터에서 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add apps/web/e2e apps/web/playwright.config.ts
git commit -m "test(web): 로그인 화면 스모크와 레이아웃 회귀 3건 고정"
```

---

## Task 6: CI 통합

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Task 1의 `test:e2e` 스크립트
- Produces: `e2e` 잡

- [ ] **Step 1: 잡 추가**

`.github/workflows/ci.yml`의 `frontend` 잡 뒤에 추가:

```yaml
  e2e:
    name: e2e smoke
    runs-on: ubuntu-latest
    timeout-minutes: 20
    defaults:
      run:
        working-directory: apps/web
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: '22'
          cache: npm
          cache-dependency-path: apps/web/package-lock.json

      # Playwright의 webServer가 Go API를 직접 띄우므로 툴체인이 필요하다.
      - uses: actions/setup-go@v7
        with:
          go-version-file: apps/api/go.mod

      - name: Install dependencies
        run: npm ci

      # 브라우저 바이너리는 패키지 버전과 짝을 이루므로 lockfile 해시로 캐시한다.
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        id: playwright-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('apps/web/package-lock.json') }}

      - name: Install Chromium
        if: steps.playwright-cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps chromium

      # 캐시 적중 시에도 OS 의존성은 따로 필요하다.
      - name: Install Chromium system dependencies
        if: steps.playwright-cache.outputs.cache-hit == 'true'
        run: npx playwright install-deps chromium

      - name: Run E2E smoke
        run: npm run test:e2e

      - name: Upload report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 7
```

- [ ] **Step 2: 워크플로 문법 검증**

Run: `cd apps/api && go install github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 && "$(go env GOPATH)/bin/actionlint"`
Expected: 출력 없음

리포지토리의 `actionlint`·`reviewdog` 잡이 같은 검사를 하므로 여기서 미리 잡는다.

- [ ] **Step 3: 액션 핀 정책 확인**

이 리포지토리는 액션을 SHA로 고정하는 정책이 있을 수 있다. 확인:

```bash
grep -n "uses:" .github/workflows/ci.yml | head -20
```

기존 잡이 `@v7` 같은 태그를 쓰면 그대로 맞추고, SHA를 쓰면 새 액션(`actions/cache`, `actions/upload-artifact`)도 SHA로 고정한다.

- [ ] **Step 4: 커밋**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: E2E 스모크 잡 추가"
```

---

## Task 7: 문서와 PR

**Files:**
- Create: `~/dev/docs/travel_app/troubleshooting/e2e-smoke-local-run.md`
- Modify: `apps/web/README.md`(있으면) 또는 루트 `README.md`

- [ ] **Step 1: 실행 방법 문서화**

`~/dev/docs/travel_app/troubleshooting/e2e-smoke-local-run.md`에 다음을 적는다:

- 로컬 실행 명령과 각 환경변수의 이유
- 포트가 5173/8080으로 고정된 이유(CORS 기본값)
- 실패했을 때 리포트 보는 법: `npx playwright show-report`
- 실패 재현: `npx playwright test --debug`, trace 여는 법
- 콘솔 허용 목록을 늘릴 때의 기준

- [ ] **Step 2: 전체 검증**

```bash
cd apps/web && npm run typecheck && npm test && npm run test:e2e
cd ../.. && npm run check
```

Expected: 전부 통과. E2E는 프로젝트 5개(setup + demo×2 + owner×2)가 모두 초록이어야 한다.

- [ ] **Step 3: PR 생성**

`.github/PULL_REQUEST_TEMPLATE.md`의 섹션 구조를 그대로 채운다. 특히:

- **변경 유형:** `test`
- **영향 영역:** `CI / release / dependency`
- **비용:** +$0 (GitHub Actions 무료 한도 내, 잡 1개 약 3–5분 추가)
- **가드레일 · 데이터 계약:** 앱 코드 변경 없음. `AUTH_TEST_BYPASS`는 production에서 서버가 기동을 거부하므로 운영에 영향 없음을 명시한다.

제목: `test(web): 데모·로그인 화면 E2E 스모크 도입`

---

## Self-Review

**스펙 커버리지**

| 요구 | 태스크 |
| --- | --- |
| 데모 5탭 | Task 3 |
| 375px·195px 두 폭 | Task 1(설정) + 전 태스크 |
| 콘솔 에러 0 | Task 2 |
| 오버플로 0 | Task 2 |
| 터치 영역 44px | Task 2 |
| 로그인 목록·상세·마이페이지 | Task 5 |
| 회귀 3건 고정 | Task 5(Step 5에서 실효성 검증) |
| CI 통합 | Task 6 |
| 신규 런타임 의존성 0 | Global Constraints |

**미해결 위험**

1. **Task 5의 API 페이로드는 DTO에서 유도한 값이다.** `category`/`type`의 허용 집합을 검증하지 않았다. 400이 나면 응답 본문을 읽고 맞춘다 — Step 1에 그 지침을 넣어 뒀다.
2. **Task 3의 `heading` 정규식은 추정이다.** Step 2가 "느슨하게 만들어 통과시키지 말 것"을 명시한다.
3. **콘솔 허용 목록이 넓어지면 테스트가 무의미해진다.** Task 2 Step 5에 이 함정을 적어 뒀다.
4. **`reuseExistingServer`가 로컬에서 오래된 빌드를 재사용할 수 있다.** CI에서는 꺼지므로 CI 결과가 기준이다.
