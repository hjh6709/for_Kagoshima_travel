import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScheduleCard } from "./ScheduleCard";

describe("ScheduleCard", () => {
  it("일반 여행 안내는 가리지 않고 예약 메모만 민감 정보로 보호한다", () => {
    render(
      <ScheduleCard
        destinationCountry="CN"
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "schedule-yu-garden",
          date: "2026-08-14",
          time: "09:30",
          type: "sightseeing",
          title: "예원 정원과 올드타운",
          reservationMemo: "예약 번호 ABC123",
          guideMemo: "오전 일찍 방문하면 혼잡을 줄일 수 있습니다.",
        }}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
        showGuideMemo
      />,
    );

    expect(screen.getByText("오전 일찍 방문하면 혼잡을 줄일 수 있습니다.")).toBeVisible();
    expect(screen.getByText("예약 ••••")).toBeVisible();
    expect(screen.getByRole("button", { name: "민감 정보 보기" })).toBeVisible();
  });

  it("실제 여행의 안내 메모는 기본적으로 가린다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "owner-schedule",
          date: "2026-08-14",
          time: "09:30",
          type: "sightseeing",
          title: "개인 일정",
          guideMemo: "예약자명과 예약번호 ABC123",
        }}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByText("예약자명과 예약번호 ABC123")).not.toBeInTheDocument();
    expect(screen.getByText("예약자••••")).toBeVisible();
    expect(screen.getByRole("button", { name: "민감 정보 보기" })).toBeVisible();
  });
});
