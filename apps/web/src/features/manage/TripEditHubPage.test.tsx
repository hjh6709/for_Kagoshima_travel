import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTripManageController } from "./useTripManageController";
import { TripEditHubPage } from "./TripEditHubPage";

vi.mock("./useTripManageController", () => ({
  useTripManageController: vi.fn(),
}));

const trip = {
  id: "trip-1",
  title: "상하이 여행",
  startDate: "2026-08-03",
  endDate: "2026-08-06",
  travelers: ["나"],
  destinationCountry: "CN",
};

function createManageResult(
  overrides: Partial<ReturnType<typeof useTripManageController>> = {},
): ReturnType<typeof useTripManageController> {
  return {
    auth: { accessToken: "token", user: { id: "user-1", email: "owner@example.com" } },
    authChecked: true,
    checklistItems: [],
    checklistLoading: false,
    onSelectOwnerTrip: vi.fn(),
    ownerDetailDataError: "",
    ownerDetailDataLoading: false,
    ownerDetailDataTripID: trip.id,
    ownerFlights: [],
    ownerPlaces: [],
    ownerSchedules: [],
    ownerTrips: [trip],
    ownerTripsError: "",
    ownerTripsLoading: false,
    selectedOwnerTrip: trip,
    ...overrides,
  } as ReturnType<typeof useTripManageController>;
}

describe("TripEditHubPage first steps", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/manage/trips/trip-1/edit");
    vi.mocked(useTripManageController).mockReturnValue(createManageResult());
  });

  it("새 여행에는 첫 장소 추가를 가장 중요한 행동으로 보여 준다", () => {
    render(<TripEditHubPage tripId="trip-1" />);

    expect(screen.getByRole("heading", { name: "먼저 여행 장소를 저장하세요" })).toBeVisible();
    expect(screen.getByRole("link", { name: "첫 장소 추가" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit/places",
    );
  });

  it("현재 여행의 상세 데이터가 준비되기 전에는 빈 여행으로 판단하지 않는다", () => {
    vi.mocked(useTripManageController).mockReturnValue(
      createManageResult({ ownerDetailDataTripID: "trip-old" }),
    );

    render(<TripEditHubPage tripId="trip-1" />);

    expect(screen.getByRole("heading", { name: "저장한 여행 내용을 확인하고 있습니다" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "첫 장소 추가" })).not.toBeInTheDocument();
  });

  it("존재하지 않는 ID에서 이전에 선택한 여행을 대신 보여 주지 않는다", () => {
    render(<TripEditHubPage tripId="missing-trip" />);

    expect(screen.getByRole("heading", { name: "여행을 찾을 수 없습니다" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "상하이 여행" })).not.toBeInTheDocument();
  });

  it("여행 목록 조회 실패를 존재하지 않는 여행으로 오인하지 않는다", () => {
    vi.mocked(useTripManageController).mockReturnValue(
      createManageResult({ ownerTrips: [], ownerTripsError: "네트워크 연결을 확인해 주세요." }),
    );

    render(<TripEditHubPage tripId="trip-1" />);

    expect(screen.getByRole("heading", { name: "여행 목록을 불러오지 못했습니다" })).toBeVisible();
    expect(screen.getByText("네트워크 연결을 확인해 주세요.")).toBeVisible();
  });
});
