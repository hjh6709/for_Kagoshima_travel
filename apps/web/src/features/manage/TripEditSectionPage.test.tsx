import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useTripManageController } from "./useTripManageController";
import { TripEditSectionPage } from "./TripEditSectionPage";

vi.mock("./useTripManageController", () => ({
  useTripManageController: vi.fn(),
}));

const trip = {
  id: "trip-1",
  title: "도쿄 여행",
  startDate: "2026-11-15",
  endDate: "2026-11-17",
  travelers: ["나"],
  destinationCountry: "JP",
};

beforeEach(() => {
  window.history.replaceState(null, "", "/manage/trips/trip-1/edit/share");
  vi.mocked(useTripManageController).mockReturnValue({
    auth: { accessToken: "token", user: { id: "user-1", email: "owner@example.com" } },
    authChecked: true,
    onSelectOwnerTrip: vi.fn(),
    ownerDetailDataError: "",
    ownerDetailDataLoading: false,
    ownerDetailDataTripID: trip.id,
    ownerPlaces: [],
    ownerSchedules: [],
    ownerTrips: [trip],
    ownerTripsLoading: false,
    selectedOwnerTrip: trip,
  } as unknown as ReturnType<typeof useTripManageController>);
});

it("편집 항목 화면에서 편집 목록으로 돌아가는 링크를 제공한다", () => {
  render(<TripEditSectionPage section="share" tripId="trip-1" />);

  expect(screen.getByRole("link", { name: "편집 목록" })).toHaveAttribute("href", "/manage/trips/trip-1/edit");
  expect(screen.getByRole("link", { name: "여행으로" })).toHaveAttribute("href", "/manage/trips/trip-1#mypage");
});
