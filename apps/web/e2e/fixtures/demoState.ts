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
