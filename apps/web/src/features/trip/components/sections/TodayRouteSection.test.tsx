import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TodayRouteSection } from "./TodayRouteSection";

const schedules = [
  {
    id: "schedule-1",
    date: "2026-11-04",
    time: "10:30",
    type: "sightseeing" as const,
    title: "센간엔 정원",
  },
  {
    id: "schedule-2",
    date: "2026-11-04",
    time: "13:00",
    type: "meal" as const,
    title: "구로부타 점심",
  },
];

describe("TodayRouteSection", () => {
  it("오늘 일정을 시간과 함께 순서대로 보여준다", () => {
    render(
      <TodayRouteSection completedSchedules={{}} onOpenSchedule={vi.fn()} schedules={schedules} travelPhase="during" />,
    );

    expect(screen.getByText("10:30")).toBeVisible();
    expect(screen.getByText("센간엔 정원")).toBeVisible();
    expect(screen.getByText("13:00")).toBeVisible();
    expect(screen.getByText("구로부타 점심")).toBeVisible();
  });

  it("완료한 일정은 완료 상태로 표시한다", () => {
    render(
      <TodayRouteSection
        completedSchedules={{ "schedule-1": true }}
        onOpenSchedule={vi.fn()}
        schedules={schedules}
        travelPhase="during"
      />,
    );

    expect(screen.getByText("센간엔 정원").closest("li")).toHaveClass("completed");
    expect(screen.getByText("구로부타 점심").closest("li")).not.toHaveClass("completed");
  });

  it("완료 여부를 색이 아니라 글자로도 알려 준다", () => {
    render(
      <TodayRouteSection
        completedSchedules={{ "schedule-1": true }}
        onOpenSchedule={vi.fn()}
        schedules={schedules}
        travelPhase="during"
      />,
    );

    const completedRow = screen.getByText("센간엔 정원").closest("li");
    const pendingRow = screen.getByText("구로부타 점심").closest("li");

    expect(completedRow).toHaveTextContent("완료");
    expect(pendingRow).toHaveTextContent("미완료");
  });

  it("출발 전에는 제목을 오늘이 아니라 첫날 기준으로 쓴다", () => {
    render(
      <TodayRouteSection
        completedSchedules={{}}
        onOpenSchedule={vi.fn()}
        schedules={schedules}
        travelPhase="before"
      />,
    );

    expect(screen.getByRole("heading", { name: "첫날 동선" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "오늘의 동선" })).not.toBeInTheDocument();
  });

  it("전체 일정 버튼을 누르면 일정 탭으로 보낸다", async () => {
    const onOpenSchedule = vi.fn();
    render(
      <TodayRouteSection
        completedSchedules={{}}
        onOpenSchedule={onOpenSchedule}
        schedules={schedules}
        travelPhase="during"
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "전체 일정" }));

    expect(onOpenSchedule).toHaveBeenCalledTimes(1);
  });

  it("오늘 일정이 없으면 섹션 자체를 렌더하지 않는다", () => {
    const { container } = render(
      <TodayRouteSection completedSchedules={{}} onOpenSchedule={vi.fn()} schedules={[]} travelPhase="during" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
