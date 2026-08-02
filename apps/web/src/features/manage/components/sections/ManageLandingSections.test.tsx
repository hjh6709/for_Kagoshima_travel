import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ManageHeader } from "./ManageHeader";
import { TripListSection } from "./TripListSection";

describe("로그인 후 여행 목록", () => {
  it("제품 설명 카드 대신 간결한 계정 헤더를 표시한다", () => {
    render(
      <ManageHeader
        auth={{ accessToken: "token", user: { id: "user-1", email: "traveler@example.com" } }}
      />,
    );

    expect(screen.getByRole("heading", { name: "내 여행" })).toBeInTheDocument();
    expect(screen.getByText("traveler@example.com")).toBeInTheDocument();
    expect(screen.queryByText("샘플 여행 화면 보기")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "마이페이지" })).toHaveAttribute("href", "/manage/account");
    expect(screen.queryByRole("button", { name: "로그아웃" })).not.toBeInTheDocument();
  });

  it("여행 카드의 기본 행동을 여행 열기로 안내한다", () => {
    render(
      <TripListSection
        deletingTripID=""
        onDeleteTrip={vi.fn()}
        ownerTrips={[
          {
            id: "trip-1",
            title: "상하이 여행",
            startDate: "2026-08-03",
            endDate: "2026-08-06",
            travelers: ["나", "친구"],
            destinationCountry: "CN",
          },
        ]}
        ownerTripsError=""
        ownerTripsLoading={false}
      />,
    );

    expect(screen.getByRole("link", { name: "여행 열기" })).toHaveAttribute("href", "/manage/trips/trip-1");
    expect(screen.queryByRole("link", { name: "관리하기" })).not.toBeInTheDocument();
  });
});
