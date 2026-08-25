import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, expectNoHorizontalOverflow, expectTouchTargets, watchConsole } from "./fixtures/assertions";

// 각 탭의 h1은 화면을 특정할 수 있어야 한다. 여러 탭에 공통으로 있는 문구를 쓰면
// 탭 전환이 실패해도 테스트가 통과해 버린다.
// 데모는 sampleTrip이 startDate를 오늘+14로 잡으므로 항상 "여행 전" 상태다.
const TABS = [
  { label: "오늘", heading: "출발 준비" },
  { label: "일정", heading: "일정" },
  { label: "지도", heading: "지도" },
  { label: "항공", heading: "항공편" },
  { label: "긴급", heading: "긴급" },
] as const;

test("데모 화면이 오늘 탭으로 열린다", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();
  await expect(page.getByRole("button", { name: "오늘" })).toHaveAttribute("aria-current", "page");
});

test("데모 화면은 콘솔 에러 없이 뜨고 가로로 넘치지 않는다", async ({ page }) => {
  const consoleWatch = watchConsole(page);

  await page.goto("/demo");
  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expectNoConsoleErrors(consoleWatch.errors);
});

test("일정 화면의 fit·subtle modifier는 테마 기본값보다 우선한다", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "일정", exact: true }).click();

  const dateTabs = page.locator(".date-tabs.fit-tabs");
  await expect(dateTabs).toHaveCSS("display", "grid");
  await expect(dateTabs.locator("button").first()).toHaveCSS("min-width", "0px");

  const scheduleType = page.locator(".schedule-type-pill").first();
  await expect(scheduleType).toHaveCSS("color", "rgb(106, 111, 118)");
  await expect(scheduleType).toHaveCSS("background-color", "rgb(241, 239, 234)");
});

for (const tab of TABS) {
  test(`${tab.label} 탭이 에러 없이 열린다`, async ({ page }) => {
    const consoleWatch = watchConsole(page);
    await page.goto("/demo");

    const tabButton = page.getByRole("button", { name: tab.label, exact: true });
    await tabButton.click();

    await expect(tabButton).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1, name: tab.heading })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page, ".bottom-tabs button", { dimension: "height" });
    expectNoConsoleErrors(consoleWatch.errors);
  });
}
