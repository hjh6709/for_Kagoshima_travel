import { describe, expect, it } from "vitest";
import {
  getSharedChecklistForPhase,
  getSharedFocusDate,
  getSharedSchedulesForDate,
} from "./sharedTripView";

describe("getSharedFocusDate", () => {
  it("여행 중이면 오늘 날짜를 선택한다", () => {
    expect(getSharedFocusDate("2026-08-03", "2026-08-06", "2026-08-04")).toBe("2026-08-04");
  });

  it("출발 전이면 첫날을 선택한다", () => {
    expect(getSharedFocusDate("2026-08-03", "2026-08-06", "2026-07-29")).toBe("2026-08-03");
  });

  it("여행 후면 마지막 날을 선택한다", () => {
    expect(getSharedFocusDate("2026-08-03", "2026-08-06", "2026-08-10")).toBe("2026-08-06");
  });
});

describe("getSharedSchedulesForDate", () => {
  it("기준 날짜의 일정만 시간순으로 반환한다", () => {
    const schedules = [
      { id: "late", date: "2026-08-04", time: "18:30", type: "meal", title: "저녁" },
      { id: "other", date: "2026-08-05", time: "09:00", type: "move", title: "이동" },
      { id: "early", date: "2026-08-04", time: "09:30", type: "cafe", title: "카페" },
    ];

    expect(getSharedSchedulesForDate(schedules, "2026-08-04").map((schedule) => schedule.id)).toEqual([
      "early",
      "late",
    ]);
  });
});

describe("getSharedChecklistForPhase", () => {
  const checklist = [
    { id: "before", category: "before", title: "여권", isCompleted: false, custom: false },
    { id: "daily", category: "daily", title: "보조배터리", isCompleted: true, custom: false },
    { id: "return", category: "return", title: "짐 확인", isCompleted: false, custom: false },
  ] as const;

  it("여행 중에는 매일 확인할 항목만 반환한다", () => {
    expect(getSharedChecklistForPhase(checklist, "during").map((item) => item.id)).toEqual(["daily"]);
  });

  it("여행 전과 여행 후에는 해당 단계의 항목만 반환한다", () => {
    expect(getSharedChecklistForPhase(checklist, "before").map((item) => item.id)).toEqual(["before"]);
    expect(getSharedChecklistForPhase(checklist, "after").map((item) => item.id)).toEqual(["return"]);
  });
});
