import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SharedTripResponse } from "../../api/trips";
import { loadGoogleMaps } from "../../shared/map/googleMapsLoader";
import { SharedTripPage } from "./SharedTripPage";

vi.mock("../../shared/map/googleMapsLoader", () => ({
  loadGoogleMaps: vi.fn(),
}));

const sharedTrip: SharedTripResponse = {
  trip: {
    id: "trip-1",
    title: "상하이 여행",
    startDate: "2026-07-29",
    endDate: "2026-07-31",
    travelers: ["나", "친구"],
    destinationCountry: "CN",
  },
  schedules: [
    {
      id: "schedule-today",
      date: "2026-07-29",
      time: "10:00",
      type: "sightseeing",
      title: "인민광장 산책",
      placeId: "place-1",
    },
    {
      id: "schedule-later",
      date: "2026-07-30",
      time: "11:00",
      type: "meal",
      title: "내일 점심",
    },
  ],
  places: [
    {
      id: "place-1",
      name: "인민광장",
      category: "sightseeing",
      address: "People's Square, Shanghai",
      latitude: 31.2304,
      longitude: 121.4737,
      chineseName: "人民广场",
    },
  ],
  flights: [],
  routes: [],
  checklist: [
    {
      id: "check-1",
      category: "daily",
      title: "보조배터리",
      isCompleted: false,
      custom: false,
    },
  ],
};

describe("SharedTripPage", () => {
  it("오늘 화면에는 기준 날짜 일정만 보여준다", () => {
    render(
      <SharedTripPage
        error=""
        loading={false}
        sharedTrip={sharedTrip}
        warning=""
      />,
    );

    expect(screen.getByRole("button", { name: "오늘" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("인민광장 산책")).toBeVisible();
    expect(screen.queryByText("내일 점심")).not.toBeInTheDocument();
  });

  it("지도와 여행정보를 한 화면 안에서 전환한다", async () => {
    vi.mocked(loadGoogleMaps).mockRejectedValue(new Error("map unavailable"));
    render(
      <SharedTripPage
        error=""
        loading={false}
        sharedTrip={sharedTrip}
        warning=""
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "지도" }));
    expect(screen.getByLabelText("저장 장소 지도")).toBeVisible();
    expect(screen.getByText("人民广场")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "여행정보" }));
    expect(screen.getByRole("heading", { name: "전체 일정" })).toBeVisible();
    expect(screen.getByText("내일 점심")).toBeVisible();
  });
});
