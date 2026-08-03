import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTripManageController } from "../manage/useTripManageController";
import { OwnerTripViewPage } from "./OwnerTripViewPage";

vi.mock("../manage/useTripManageController", () => ({
  useTripManageController: vi.fn(),
}));

vi.mock("../../shared/date", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../shared/date")>()),
  getTodayDateString: () => "2026-08-01",
}));

function createManageResult(
  overrides: Partial<ReturnType<typeof useTripManageController>> = {},
): ReturnType<typeof useTripManageController> {
  return {
    auth: { accessToken: "test-token", user: { email: "owner@example.com" } },
    authChecked: true,
    ownerTrips: [],
    ownerTripsLoading: false,
    selectedOwnerTrip: {
      id: "trip-1",
      title: "상하이 여행",
      startDate: "2026-08-03",
      endDate: "2026-08-06",
      travelers: ["나"],
      destinationCountry: "CN",
    },
    onSelectOwnerTrip: vi.fn(),
    ownerDetailDataLoading: false,
    ownerDetailDataError: "",
    ownerSchedules: [],
    ownerPlaces: [],
    ownerFlights: [],
    checklistItems: [],
    checklistLoading: false,
    newChecklistTitle: "",
    newChecklistCategory: "before",
    onNewChecklistTitleChange: vi.fn(),
    onNewChecklistCategoryChange: vi.fn(),
    onAddChecklistItem: vi.fn(),
    onToggleChecklistItem: vi.fn(),
    onDeleteChecklistItem: vi.fn(),
    onLogout: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useTripManageController>;
}

describe("OwnerTripViewPage management flow", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/manage/trips/trip-1");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
    });
    vi.mocked(useTripManageController).mockReturnValue(createManageResult());
  });

  it("비어 있는 핵심 화면에서 해당 관리 페이지로 한 번에 이동한다", async () => {
    render(<OwnerTripViewPage tripId="trip-1" />);

    expect(screen.getByRole("link", { name: "첫 일정 추가" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit/schedules",
    );

    await userEvent.click(screen.getByRole("button", { name: "일정" }));
    expect(screen.getByRole("link", { name: "일정 추가" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit/schedules",
    );

    await userEvent.click(screen.getByRole("button", { name: "지도" }));
    expect(screen.getByRole("link", { name: "장소 추가" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit/places",
    );

    await userEvent.click(screen.getByRole("button", { name: "항공" }));
    expect(screen.getByRole("link", { name: "항공편 추가" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1/edit/flights",
    );
  });

  it("장소 관리 후에는 지도 탭으로 바로 돌아온다", () => {
    window.history.replaceState(null, "", "/manage/trips/trip-1#map");

    render(<OwnerTripViewPage tripId="trip-1" />);

    expect(screen.getByRole("heading", { name: "지도" })).toBeVisible();
    expect(screen.getByRole("button", { name: "지도" })).toHaveAttribute("aria-current", "page");
  });

  it("상세 조회가 실패하면 같은 여행을 다시 시도할 수 있다", () => {
    vi.mocked(useTripManageController).mockReturnValue(
      createManageResult({
        ownerDetailDataError: "네트워크 연결을 확인해 주세요.",
      }),
    );

    render(<OwnerTripViewPage tripId="trip-1" />);

    expect(screen.getByRole("link", { name: "다시 시도" })).toHaveAttribute(
      "href",
      "/manage/trips/trip-1",
    );
    expect(screen.getByRole("link", { name: "여행 목록으로" })).toHaveAttribute("href", "/manage");
  });
});
