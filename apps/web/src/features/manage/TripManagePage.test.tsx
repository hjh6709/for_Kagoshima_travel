import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OwnerTrip } from "../../api/trips";
import type { TripManagePageProps } from "./manageTypes";
import { TripManagePage } from "./TripManagePage";

const existingTrip: OwnerTrip = {
  id: "trip-1",
  title: "상하이 여행",
  startDate: "2026-08-03",
  endDate: "2026-08-06",
  travelers: ["나"],
  destinationCountry: "CN",
};

function createProps(
  ownerTrips: OwnerTrip[],
  overrides: Partial<TripManagePageProps> = {},
): TripManagePageProps {
  return {
    auth: { accessToken: "token", user: { id: "user-1", email: "traveler@example.com" } },
    authChecked: true,
    ownerTrips,
    ownerTripsError: "",
    ownerTripsLoading: false,
    deletingTripID: "",
    onDeleteTrip: vi.fn(),
    newTripTitle: "",
    newTripDestinationCountry: "",
    newTripStartDate: "",
    newTripEndDate: "",
    newTripTravelers: "",
    newTripMemo: "",
    onNewTripTitleChange: vi.fn(),
    onNewTripDestinationCountryChange: vi.fn(),
    onNewTripStartDateChange: vi.fn(),
    onNewTripEndDateChange: vi.fn(),
    onNewTripTravelersChange: vi.fn(),
    onNewTripMemoChange: vi.fn(),
    onSubmitNewTrip: vi.fn(),
    tripCreateError: "",
    tripCreateSubmitting: false,
    ...overrides,
  } as unknown as TripManagePageProps;
}

describe("TripManagePage creation flow", () => {
  it("기존 여행이 있으면 생성 폼을 접고 필요할 때 같은 화면에서 연다", async () => {
    render(<TripManagePage {...createProps([existingTrip])} />);

    const disclosure = screen.getByLabelText("새 여행 만들기 열기").closest("details");
    expect(disclosure).not.toHaveAttribute("open");
    expect(screen.getByRole("heading", { name: "상하이 여행" })).toBeVisible();
    expect(screen.getByRole("link", { name: "여행 열기" })).toBeVisible();

    await userEvent.click(screen.getByLabelText("새 여행 만들기 열기"));

    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByLabelText("여행명")).toBeVisible();
    expect(screen.getByLabelText("여행자")).not.toBeVisible();

    await userEvent.click(screen.getByText(/여행자와 메모/));
    expect(screen.getByLabelText("여행자")).toBeVisible();
  });

  it("첫 사용자에게는 생성 폼을 바로 열고 빈 목록 설명은 반복하지 않는다", async () => {
    render(<TripManagePage {...createProps([])} />);

    await waitFor(() => {
      expect(screen.getByLabelText("새 여행 만들기 닫기").closest("details")).toHaveAttribute("open");
    });
    expect(screen.queryByRole("heading", { name: "여행 목록" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("여행명")).toBeVisible();
  });

  it("여행 목록 오류가 있으면 생성 폼보다 복구 안내를 먼저 보여준다", () => {
    render(<TripManagePage {...createProps([], { ownerTripsError: "여행 목록을 불러오지 못했습니다." })} />);

    expect(screen.getByText("여행 목록을 불러오지 못했습니다.")).toBeVisible();
    expect(screen.getByLabelText("새 여행 만들기 열기").closest("details")).not.toHaveAttribute("open");
  });
});
