import { describe, expect, it } from "vitest";
import { getTodayTabCopy } from "./todayCopy";

describe("getTodayTabCopy", () => {
  it("여행 중에만 오늘이라는 표현을 쓴다", () => {
    const copy = getTodayTabCopy("during");

    expect(copy.screenTitle).toBe("오늘");
    expect(copy.scheduleStatLabel).toBe("오늘 일정");
    expect(copy.routeHeading).toBe("오늘의 동선");
  });

  it("출발 전에는 첫날 기준 문구를 쓴다", () => {
    const copy = getTodayTabCopy("before");

    expect(copy.screenTitle).toBe("출발 준비");
    expect(copy.dayLabel).toBe("첫날");
    expect(copy.scheduleStatLabel).toBe("첫날 일정");
    expect(copy.routeHeading).toBe("첫날 동선");
  });

  it("여행이 끝난 뒤에는 마지막 날 기준 문구를 쓴다", () => {
    const copy = getTodayTabCopy("after");

    expect(copy.screenTitle).toBe("여행 마무리");
    expect(copy.dayLabel).toBe("마지막 날");
    expect(copy.scheduleStatLabel).toBe("마지막 날 일정");
    expect(copy.routeHeading).toBe("마지막 날 동선");
  });

  it("여행 전·후 문구에는 오늘이라는 표현이 들어가지 않는다", () => {
    for (const phase of ["before", "after"] as const) {
      const values = Object.values(getTodayTabCopy(phase));
      expect(values.some((value) => value.includes("오늘"))).toBe(false);
    }
  });
});
