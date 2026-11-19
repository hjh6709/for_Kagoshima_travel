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
    checklistSubmitting: false,
    newChecklistTitle: "",
    newChecklistCategory: "before",
    newChecklistDate: "",
    onNewChecklistTitleChange: vi.fn(),
    onNewChecklistCategoryChange: vi.fn(),
    onNewChecklistDateChange: vi.fn(),
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

  it("여행 중 일정 탭을 열면 여행 첫날이 아니라 오늘 날짜를 선택한다", async () => {
    vi.mocked(useTripManageController).mockReturnValue(
      createManageResult({
        selectedOwnerTrip: {
          id: "trip-1",
          title: "상하이 여행",
          startDate: "2026-07-30",
          endDate: "2026-08-03",
          travelers: ["나"],
          destinationCountry: "CN",
        },
      }),
    );

    render(<OwnerTripViewPage tripId="trip-1" />);
    await userEvent.click(screen.getByRole("button", { name: "일정" }));

    expect(screen.getByRole("button", { name: "8/1(토)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "7/30(목)" })).toHaveAttribute("aria-pressed", "false");
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
  it("일정에서 고른 날짜를 지도 왕복에도 유지하고 오늘에서 시작하면 오늘로 초기화한다", async () => {
    vi.mocked(useTripManageController).mockReturnValue(
      createManageResult({
        selectedOwnerTrip: {
          id: "trip-1",
          title: "상하이 여행",
          startDate: "2026-07-30",
          endDate: "2026-08-03",
          travelers: ["나"],
          destinationCountry: "CN",
        },
        ownerPlaces: [
          { id: "place-1", name: "오늘 관광지", category: "sightseeing" },
          { id: "place-2", name: "선택일 관광지", category: "sightseeing" },
        ],
        ownerSchedules: [
          { id: "schedule-1", placeId: "place-1", date: "2026-08-01", time: "10:00", type: "sightseeing", title: "오늘 일정" },
          { id: "schedule-2", placeId: "place-2", date: "2026-08-02", time: "11:00", type: "sightseeing", title: "선택일 일정" },
        ],
      }),
    );

    render(<OwnerTripViewPage tripId="trip-1" />);

    // Today (8/1) -> schedule initially uses the trip's current travel day.
    await userEvent.click(screen.getByRole("button", { name: "일정" }));
    expect(screen.getByRole("button", { name: "8/1(토)" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "8/2(일)" }));
    expect(screen.getByRole("button", { name: "8/2(일)" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "지도" }));
    expect(screen.getByRole("heading", { name: "선택한 날짜 동선" })).toBeVisible();
    expect(screen.getByText("선택일 관광지")).toBeVisible();
    expect(screen.queryByText("오늘 관광지")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "일정" }));
    expect(screen.getByRole("button", { name: "8/2(일)" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(screen.getByRole("button", { name: "오늘" }));
    await userEvent.click(screen.getByRole("button", { name: "지도" }));
    expect(screen.getByRole("heading", { name: "오늘 동선" })).toBeVisible();
    expect(screen.getByText("오늘 관광지")).toBeVisible();
    expect(screen.queryByText("선택일 관광지")).not.toBeInTheDocument();
  });

});
