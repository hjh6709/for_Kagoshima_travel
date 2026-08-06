import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TodayHeaderSection } from "./TodayHeaderSection";

const trip = {
  title: "가고시마 3박 4일",
  startDate: "2026-11-03",
  endDate: "2026-11-06",
  travelers: ["나"],
  destinationCountry: "JP",
};

const tripDates = { startDate: "2026-11-03", endDate: "2026-11-06" };

const travelStatus = {
  phase: "during" as const,
  label: "여행 2일차",
  description: "오늘 일정과 다음 이동만 확인하면 됩니다.",
};

describe("TodayHeaderSection", () => {
  it("여행 단계와 오늘 날짜를 키커로 묶고 오늘을 타이틀로 쓴다", () => {
    render(
      <TodayHeaderSection
        focusDate="2026-11-04"
        onNavigateToMyPage={vi.fn()}
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
      />,
    );

    expect(screen.getByText("여행 2일차 · 11월 4일(수)")).toBeVisible();
    expect(screen.getByRole("heading", { name: "오늘" })).toBeVisible();
  });

  it("여행 목록으로 돌아가는 링크와 마이페이지 버튼을 유지한다", () => {
    render(
      <TodayHeaderSection
        focusDate="2026-11-04"
        onNavigateToMyPage={vi.fn()}
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
      />,
    );

    expect(screen.getByRole("link", { name: "여행 목록으로 이동" })).toHaveAttribute("href", "/manage");
    expect(screen.getByRole("button", { name: "마이페이지 열기" })).toBeVisible();
  });

  it("공유 보기에서는 홈 링크와 공유 뱃지를 쓰고 마이페이지 버튼을 감춘다", () => {
    render(
      <TodayHeaderSection
        focusDate="2026-11-04"
        isReadOnly
        travelStatus={travelStatus}
        trip={trip}
        tripDates={tripDates}
      />,
    );

    expect(screen.getByRole("link", { name: "서비스 홈으로 이동" })).toHaveAttribute("href", "/");
    expect(screen.getByText("공유 보기")).toBeVisible();
    expect(screen.queryByRole("button", { name: "마이페이지 열기" })).not.toBeInTheDocument();
  });
});
