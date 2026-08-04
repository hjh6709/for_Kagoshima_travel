import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TripEditHubOverview, getTripEditNextStep } from "./TripEditHubOverview";

it("장소가 없으면 첫 장소 추가를 가장 먼저 추천한다", () => {
  const nextStep = getTripEditNextStep("trip/상하이", 0, 0);

  expect(nextStep.actionLabel).toBe("첫 장소 추가");
  expect(nextStep.href).toBe("/manage/trips/trip%2F%EC%83%81%ED%95%98%EC%9D%B4/edit/places");
});

it("장소가 있고 일정이 없으면 첫 일정 연결을 추천한다", () => {
  const nextStep = getTripEditNextStep("trip-1", 2, 0);

  expect(nextStep.actionLabel).toBe("첫 일정 추가");
  expect(nextStep.href).toBe("/manage/trips/trip-1/edit/schedules");
});

it("장소와 일정이 있으면 여행 화면 확인을 추천하고 전체 편집 상태를 보여 준다", () => {
  render(
    <TripEditHubOverview
      checklistCount={3}
      flightCount={2}
      placeCount={4}
      scheduleCount={5}
      tripId="trip-1"
    />,
  );

  expect(screen.getByRole("link", { name: "여행 화면 보기" })).toHaveAttribute("href", "/manage/trips/trip-1");
  expect(screen.getByRole("link", { name: /장소지도 핀과 길찾기 기준4곳/ })).toHaveAttribute(
    "href",
    "/manage/trips/trip-1/edit/places",
  );
  expect(screen.getByRole("link", { name: /일정날짜별 시간과 장소5개/ })).toBeVisible();
  expect(screen.getByRole("link", { name: /체크리스트전체·날짜별 준비물3개/ })).toBeVisible();
});
