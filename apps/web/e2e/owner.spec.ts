import { expect, test } from "@playwright/test";
import {
  expectNoConsoleErrors,
  expectNoHorizontalOverflow,
  expectTouchTargets,
  watchConsole,
} from "./fixtures/assertions";

test("여행 목록이 뜨고 가로로 넘치지 않는다", async ({ page }) => {
  const consoleWatch = watchConsole(page);

  await page.goto("/manage");
  await expect(page.getByRole("heading", { level: 1, name: "내 여행" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "상하이 여행" })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expectNoConsoleErrors(consoleWatch.errors);
});


// 회귀 1 — inline-flex는 inline-level이라 margin-left: auto가 적용되지 않는다.
// 이 버그로 ⋯ 메뉴가 카드 왼쪽에 붙어 있었다.
test("여행 카드의 관리 메뉴는 카드 오른쪽 끝에 붙는다", async ({ page }) => {
  await page.goto("/manage");

  await expect(page.getByRole("group", { name: "상하이 여행 관리 메뉴" })).toBeVisible();

  // details 상자를 재면 안 된다 — 블록이라 내용이 왼쪽에 붙어도 상자의 오른쪽 끝은
  // 늘 카드 끝과 같아서, 버그가 있어도 통과한다(실제로 그렇게 짰다가 놓쳤다).
  // 44px 히트 영역인 summary를 재야 위치가 드러난다.
  const summary = page.locator(".owner-trip-manage > summary").first();
  const summaryBox = await summary.boundingBox();
  const cardBox = await page.locator(".owner-trip-card").first().boundingBox();
  expect(summaryBox).not.toBeNull();
  expect(cardBox).not.toBeNull();

  // 정상: 카드 패딩만큼(약 19px). 왼쪽에 붙는 버그: 약 268px.
  const gapFromRight = cardBox!.x + cardBox!.width - (summaryBox!.x + summaryBox!.width);
  expect(gapFromRight, `관리 메뉴가 카드 오른쪽에서 ${Math.round(gapFromRight)}px 떨어져 있다`).toBeLessThanOrEqual(28);
  expect(gapFromRight, "관리 메뉴가 카드 밖으로 나갔다").toBeGreaterThanOrEqual(0);
});

// 회귀 2 — 헤더 액션이 두 줄로 갈라졌다. 375px에서는 한 줄이어야 한다.
test("375px에서 헤더의 두 버튼은 같은 줄에 있다", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("375"), "320px 이하에서는 두 줄이 정상이다");

  await page.goto("/manage");

  const createBox = await page.getByRole("button", { name: /새 여행/ }).boundingBox();
  const accountBox = await page.getByRole("link", { name: /마이페이지/ }).boundingBox();
  expect(createBox).not.toBeNull();
  expect(accountBox).not.toBeNull();

  const createCenter = createBox!.y + createBox!.height / 2;
  const accountCenter = accountBox!.y + accountBox!.height / 2;
  expect(Math.abs(createCenter - accountCenter), "헤더 버튼이 두 줄로 갈라졌다").toBeLessThanOrEqual(4);
});

test("여행 상세가 에러 없이 열린다", async ({ page }) => {
  const consoleWatch = watchConsole(page);

  await page.goto("/manage");
  await page.getByRole("link", { name: /여행 열기/ }).first().click();

  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  await expectTouchTargets(page, ".bottom-tabs button", { dimension: "height" });
  expectNoConsoleErrors(consoleWatch.errors);
});

test("마이페이지가 에러 없이 열린다", async ({ page }) => {
  const consoleWatch = watchConsole(page);

  await page.goto("/manage/account");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expectNoConsoleErrors(consoleWatch.errors);
});
