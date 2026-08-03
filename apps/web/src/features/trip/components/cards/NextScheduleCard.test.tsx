import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NextScheduleCard } from "./NextScheduleCard";

describe("NextScheduleCard empty state", () => {
  it("여행 중 등록된 일정이 하나도 없으면 완료가 아니라 추가 안내를 보여준다", () => {
    render(
      <NextScheduleCard
        editSchedulesHref="/manage/trips/trip-1/edit/schedules"
        focusDate="2026-08-03"
        getDisplayDate={(date) => date}
        getPlace={() => undefined}
        hasSchedules={false}
        nextSchedule={null}
        onOpenSchedule={vi.fn()}
        travelPhase="during"
      />,
    );

    expect(screen.getByRole("heading", { name: "아직 일정이 없습니다" })).toBeVisible();
    expect(screen.getByRole("link", { name: "일정 추가" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit/schedules",
    );
  });
});
