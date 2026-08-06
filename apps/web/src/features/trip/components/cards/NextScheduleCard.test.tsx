import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NextScheduleCard } from "./NextScheduleCard";

const nextSchedule = {
  id: "schedule-1",
  date: "2026-08-03",
  time: "10:30",
  type: "sightseeing" as const,
  title: "센간엔 정원",
  placeId: "place-1",
  guideMemo: "입장권은 매표소에서",
};

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
        onToggleComplete={vi.fn()}
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

describe("NextScheduleCard 완료 처리", () => {
  it("완료 버튼을 누르면 해당 일정 ID로 토글을 호출한다", async () => {
    const onToggleComplete = vi.fn();
    render(
      <NextScheduleCard
        focusDate="2026-08-03"
        getDisplayDate={(date) => date}
        getPlace={() => undefined}
        hasSchedules
        nextSchedule={nextSchedule}
        onOpenSchedule={vi.fn()}
        onToggleComplete={onToggleComplete}
        travelPhase="during"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "완료" }));

    expect(onToggleComplete).toHaveBeenCalledWith("schedule-1");
  });

  it("출발 전에는 기준 날짜가 첫날이어도 다음 정류장이 아니라 첫 일정으로 표시한다", () => {
    render(
      <NextScheduleCard
        focusDate="2026-08-03"
        getDisplayDate={(date) => date}
        getPlace={() => undefined}
        hasSchedules
        nextSchedule={nextSchedule}
        onOpenSchedule={vi.fn()}
        onToggleComplete={vi.fn()}
        travelPhase="before"
      />,
    );

    expect(screen.getByText("첫 일정")).toBeVisible();
    expect(screen.queryByText("다음 정류장")).not.toBeInTheDocument();
  });

  it("공유 보기에서는 완료 버튼을 렌더하지 않는다", () => {
    render(
      <NextScheduleCard
        focusDate="2026-08-03"
        getDisplayDate={(date) => date}
        getPlace={() => undefined}
        hasSchedules
        isReadOnly
        nextSchedule={nextSchedule}
        onOpenSchedule={vi.fn()}
        onToggleComplete={vi.fn()}
        travelPhase="during"
      />,
    );

    expect(screen.queryByRole("button", { name: "완료" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "센간엔 정원" })).toBeVisible();
  });
});
