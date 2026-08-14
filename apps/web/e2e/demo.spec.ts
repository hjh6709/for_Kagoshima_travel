import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, expectNoHorizontalOverflow, watchConsole } from "./fixtures/assertions";

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
