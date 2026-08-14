import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors, expectNoHorizontalOverflow, watchConsole } from "./fixtures/assertions";
import { seedDemoPhase, type DemoPhase } from "./fixtures/demoState";

// 문구의 출처는 apps/web/src/features/trip/todayCopy.ts의 getTodayTabCopy다.
// 단위 테스트는 그 함수만 검증하지만, 여기서는 값이 실제로 화면까지 도달하는지 본다.
const PHASES: Array<{ phase: DemoPhase; title: string }> = [
  { phase: "before", title: "출발 준비" },
  { phase: "during", title: "오늘" },
  { phase: "after", title: "여행 마무리" },
];

for (const { phase, title } of PHASES) {
  test(`여행 ${phase} 단계에서 오늘 탭 제목이 "${title}"이다`, async ({ page }) => {
    const consoleWatch = watchConsole(page);

    await seedDemoPhase(page, phase);
    await page.goto("/demo");

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    expectNoConsoleErrors(consoleWatch.errors);
  });
}
