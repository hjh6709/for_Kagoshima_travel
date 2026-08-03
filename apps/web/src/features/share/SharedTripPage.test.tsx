import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SharedTripResponse } from "../../api/trips";
import { loadGoogleMaps } from "../../shared/map/googleMapsLoader";
import { SharedTripPage } from "./SharedTripPage";

vi.mock("../../shared/map/googleMapsLoader", () => ({
  loadGoogleMaps: vi.fn(),
}));

vi.mock("../../shared/date", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../shared/date")>()),
  getTodayDateString: () => "2026-07-29",
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
  flights: [
    {
      id: "flight-1",
      direction: "outbound",
      label: "가는 편",
      airline: "중국동방항공",
      flightNumber: "MU5042",
      departureAirport: "인천",
      arrivalAirport: "푸동",
      departureDate: "2026-07-29",
      departureTime: "12:55",
      memo: "예약번호 PRIVATE-1234",
    },
  ],
  routes: [],
  checklist: [
    {
      id: "check-1",
      category: "daily",
      title: "보조배터리",
      isCompleted: false,
      custom: false,
      scheduledDate: "2026-07-29",
    },
    {
      id: "check-2",
      category: "before",
      title: "여권 사본",
      isCompleted: false,
      custom: false,
    },
  ],
};

describe("SharedTripPage", () => {
  it("실제 여행 보기와 같은 다섯 개 메뉴를 읽기 전용으로 제공한다", () => {
    render(
      <SharedTripPage
        error=""
        loading={false}
        sharedTrip={sharedTrip}
        warning=""
      />,
    );

    expect(screen.getByRole("navigation", { name: "여행 메뉴" })).toBeVisible();
    expect(screen.getByRole("button", { name: "오늘" })).toBeVisible();
    expect(screen.getByRole("button", { name: "일정" })).toBeVisible();
    expect(screen.getByRole("button", { name: "지도" })).toBeVisible();
    expect(screen.getByRole("button", { name: "항공" })).toBeVisible();
    expect(screen.getByRole("button", { name: "긴급" })).toBeVisible();
    expect(screen.getByText("공유 보기")).toBeVisible();
    expect(screen.queryByRole("button", { name: "마이페이지 열기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "완료" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "보조배터리" })).not.toBeInTheDocument();
  });

  it("오늘 화면에는 기준 날짜 일정만 보여준다", () => {
    render(
      <SharedTripPage
        error=""
        loading={false}
        sharedTrip={sharedTrip}
        warning=""
      />,
    );

    expect(screen.getByRole("button", { name: "오늘" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("인민광장 산책")).toBeVisible();
    expect(screen.queryByText("내일 점심")).not.toBeInTheDocument();
  });

  it("지도와 날짜별 일정을 실제 여행 메뉴에서 전환한다", async () => {
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

    await userEvent.click(screen.getByRole("button", { name: "일정" }));
    expect(screen.getByRole("heading", { name: "일정" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "완료" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "7/30(목)" }));
    expect(screen.getByText("내일 점심")).toBeVisible();
  });

  it("공유 화면에서도 여행 전체와 날짜별 체크리스트를 구분한다", async () => {
    render(
      <SharedTripPage
        error=""
        loading={false}
        sharedTrip={sharedTrip}
        warning=""
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "일정" }));
    await userEvent.click(screen.getByRole("button", { name: "여행 준비" }));
    expect(screen.getByText("보조배터리")).toBeVisible();
    expect(screen.getByText("여권 사본")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "7/29(수)" }));
    expect(screen.getByText("보조배터리")).toBeVisible();
    expect(screen.queryByText("여권 사본")).not.toBeInTheDocument();
  });

  it("항공편은 보여주되 공개 화면에 예약 메모는 노출하지 않는다", async () => {
    render(
      <SharedTripPage
        error=""
        loading={false}
        sharedTrip={sharedTrip}
        warning=""
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "항공" }));
    expect(screen.getByRole("heading", { name: "MU5042" })).toBeVisible();
    expect(screen.queryByText("예약번호 PRIVATE-1234")).not.toBeInTheDocument();
  });
});
