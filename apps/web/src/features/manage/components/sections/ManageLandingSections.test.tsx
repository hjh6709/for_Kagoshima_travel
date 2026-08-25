import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OwnerTrip } from "../../../../api/trips";
import { ManageHeader } from "./ManageHeader";
import { sortOwnerTripsByRelevance, TripListSection } from "./TripListSection";

function createTrip(id: string, title: string, startDate: string, endDate: string): OwnerTrip {
  return {
    id,
    title,
    startDate,
    endDate,
    travelers: ["나"],
    destinationCountry: "CN",
  };
}

describe("로그인 후 여행 목록", () => {
  it("제품 설명 카드 대신 간결한 계정 헤더를 표시한다", () => {
    render(
      <ManageHeader
        auth={{ accessToken: "token", user: { id: "user-1", email: "traveler@example.com" } }}
        onCreateTrip={vi.fn()}
        tripCount={2}
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
    expect(screen.getByRole("button", { name: "여행 삭제" })).not.toBeVisible();
  });

  it("여행 중, 가까운 예정 여행, 최근 지난 여행 순으로 정렬한다", () => {
    const sorted = sortOwnerTripsByRelevance(
      [
        createTrip("past-old", "오래된 여행", "2025-01-01", "2025-01-03"),
        createTrip("future-later", "나중 여행", "2026-10-01", "2026-10-04"),
        createTrip("active", "여행 중", "2026-08-01", "2026-08-05"),
        createTrip("past-recent", "최근 여행", "2026-07-01", "2026-07-05"),
        createTrip("future-near", "다음 여행", "2026-08-20", "2026-08-23"),
      ],
      "2026-08-03",
    );

    expect(sorted.map((trip) => trip.id)).toEqual([
      "active",
      "future-near",
      "future-later",
      "past-recent",
      "past-old",
    ]);
  });

  it("삭제는 삭제 메뉴 안에서 경고를 확인한 뒤 실행한다", async () => {
    const onDeleteTrip = vi.fn();

    render(
      <TripListSection
        deletingTripID=""
        onDeleteTrip={onDeleteTrip}
        ownerTrips={[createTrip("trip-1", "상하이 여행", "2026-08-03", "2026-08-06")]}
        ownerTripsError=""
        ownerTripsLoading={false}
      />,
    );

    const card = screen.getByRole("article");
    const deleteButton = within(card).getByRole("button", { name: "여행 삭제" });
    expect(deleteButton).not.toBeVisible();

    await userEvent.click(within(card).getByText("관리 메뉴 열기"));
    expect(deleteButton).toBeVisible();
    expect(within(card).getByText("삭제하면 일정과 장소를 복구할 수 없습니다.")).toBeVisible();

    await userEvent.click(deleteButton);
    // window.confirm 대신 iOS 스타일 alertdialog로 한 번 더 확인한다.
    const alert = screen.getByRole("alertdialog");
    expect(within(alert).getByText("삭제하면 일정과 장소를 복구할 수 없습니다.")).toBeVisible();
    expect(onDeleteTrip).not.toHaveBeenCalled();

    await userEvent.click(within(alert).getByRole("button", { name: "삭제" }));
    expect(onDeleteTrip).toHaveBeenCalledWith("trip-1");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("삭제 알럿에서 취소하면 삭제되지 않는다", async () => {
    const onDeleteTrip = vi.fn();

    render(
      <TripListSection
        deletingTripID=""
        onDeleteTrip={onDeleteTrip}
        ownerTrips={[createTrip("trip-1", "상하이 여행", "2026-08-03", "2026-08-06")]}
        ownerTripsError=""
        ownerTripsLoading={false}
      />,
    );

    const card = screen.getByRole("article");
    await userEvent.click(within(card).getByText("관리 메뉴 열기"));
    await userEvent.click(within(card).getByRole("button", { name: "여행 삭제" }));

    const alert = screen.getByRole("alertdialog");
    await userEvent.click(within(alert).getByRole("button", { name: "취소" }));

    expect(onDeleteTrip).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

describe("여행 카드 하위 개수 스탯", () => {
  function renderList(trip: OwnerTrip) {
    render(
      <TripListSection
        deletingTripID=""
        onDeleteTrip={vi.fn()}
        ownerTrips={[trip]}
        ownerTripsError=""
        ownerTripsLoading={false}
      />,
    );
  }

  it("개수를 받으면 장소·일정·항공을 함께 보여준다", () => {
    renderList({
      ...createTrip("trip-1", "상하이 여행", "2026-07-29", "2026-08-01"),
      placeCount: 7,
      scheduleCount: 12,
      flightCount: 2,
    });

    expect(screen.getByText("장소 7")).toBeVisible();
    expect(screen.getByText("일정 12")).toBeVisible();
    expect(screen.getByText("항공편 2")).toBeVisible();
  });

  it("개수를 아직 못 받았으면 스탯 행을 넣지 않는다", () => {
    renderList(createTrip("trip-1", "상하이 여행", "2026-07-29", "2026-08-01"));

    expect(screen.queryByLabelText(/장소 \d+곳/)).not.toBeInTheDocument();
  });
});
