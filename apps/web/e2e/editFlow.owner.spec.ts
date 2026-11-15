import { expect, test, type APIRequestContext } from "@playwright/test";
import { expectNoConsoleErrors, expectNoHorizontalOverflow, watchConsole } from "./fixtures/assertions";

// playwright.config.ts의 webServer가 띄우는 in-memory API. 운영 데이터와 무관하다.
const API_URL = "http://localhost:8080";
const headers = { Origin: "http://localhost:5173" };

async function createTrip(request: APIRequestContext, title: string): Promise<string> {
  const created = await request.post(`${API_URL}/api/trips`, {
    data: { title, startDate: "2026-11-20", endDate: "2026-11-22", travelers: ["나"], destinationCountry: "JP", memo: "" },
    headers,
  });
  expect(created.status(), await created.text()).toBe(201);
  return (await created.json()).id;
}

// 장소 분류는 API가 빈 값만 거르는 자유 문자열이다. "__proto__" 같은 상속 속성 이름이 저장돼 있어도
// 소유자 장소 편집 화면이 하얗게 죽지 않고 계속 쓸 수 있어야 한다.
test("예상하지 못한 장소 분류가 저장돼 있어도 장소 편집 화면이 열리고 계속 쓸 수 있다", async ({ page }) => {
  const consoleWatch = watchConsole(page);
  const tripId = await createTrip(page.request, "분류 회귀");
  for (const [name, category] of [
    ["프로토 장소", "__proto__"],
    ["생성자 장소", "constructor"],
    ["모르는 장소", "unknown-category"],
  ]) {
    const response = await page.request.post(`${API_URL}/api/trips/${tripId}/places`, {
      data: { name, category, address: "Tokyo", googleMapsUrl: "", recommendedReason: "" },
      headers,
    });
    expect(response.status(), await response.text()).toBe(201);
  }

  await page.goto(`/manage/trips/${tripId}/edit/places`);

  for (const name of ["프로토 장소", "생성자 장소", "모르는 장소"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.locator(".owner-linked-card .muted-label")).toHaveText(["장소", "장소", "장소"]);

  // 화면이 살아 있는지: 같은 폼으로 새 장소를 저장할 수 있어야 한다.
  await page.getByPlaceholder("예: 공항 렌터카 센터").fill("센소지");
  await page.getByRole("button", { name: "장소 추가" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "센소지" })).toBeVisible();

  await expectNoHorizontalOverflow(page);
  expectNoConsoleErrors(consoleWatch.errors);
});

test("첫 장소 → 첫 일정 → 여행 화면으로 편집 항목 화면에서 이어진다", async ({ page }) => {
  const consoleWatch = watchConsole(page);
  const tripId = await createTrip(page.request, "첫 동선");

  await page.goto(`/manage/trips/${tripId}/edit/places`);
  await expect(page.getByRole("link", { name: "편집 목록" })).toHaveAttribute("href", `/manage/trips/${tripId}/edit`);
  await expect(page.getByRole("link", { name: "첫 일정 추가" })).toHaveCount(0);

  await page.getByPlaceholder("예: 공항 렌터카 센터").fill("오사카성");
  await page.getByRole("button", { name: "장소 추가" }).click();

  await expect(page.getByRole("heading", { name: "이제 첫 일정을 연결하세요" })).toBeVisible();
  await page.getByRole("link", { name: "첫 일정 추가" }).click();
  await expect(page).toHaveURL(new RegExp(`/manage/trips/${tripId}/edit/schedules$`));

  await page.getByLabel("시간").fill("13:00");
  await page.getByLabel("연결 장소").selectOption({ label: "오사카성" });
  await expect(page.getByLabel("일정 제목")).toHaveValue("오사카성");
  await page.getByRole("button", { name: "일정 추가" }).click();

  await expect(page.getByRole("heading", { name: "여행 동선을 확인할 준비가 됐어요" })).toBeVisible();
  await page.getByRole("link", { name: "여행 화면 보기" }).click();
  await expect(page.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();

  expectNoConsoleErrors(consoleWatch.errors);
});

test("로그인하지 않은 사용자는 장소 편집 화면에서 여행 데이터 대신 로그인 화면을 본다", async ({ browser, page }) => {
  const tripId = await createTrip(page.request, "비공개 여행");
  const anonymous = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const anonymousPage = await anonymous.newPage();

  await anonymousPage.goto(`/manage/trips/${tripId}/edit/places`);

  await expect(anonymousPage.getByRole("button", { name: "로그인" }).first()).toBeVisible();
  await expect(anonymousPage.getByText("비공개 여행")).toHaveCount(0);
  await expect(anonymousPage.getByRole("link", { name: "편집 목록" })).toHaveCount(0);
  await anonymous.close();
});
