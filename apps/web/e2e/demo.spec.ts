import { expect, test } from "@playwright/test";

test("데모 화면이 오늘 탭으로 열린다", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();
  await expect(page.getByRole("button", { name: "오늘" })).toHaveAttribute("aria-current", "page");
});
