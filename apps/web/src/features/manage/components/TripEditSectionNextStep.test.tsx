import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TripEditSectionNextStep } from "./TripEditSectionNextStep";

it("첫 장소를 저장하면 장소 편집 화면에서 바로 첫 일정 연결로 안내한다", () => {
  render(<TripEditSectionNextStep placeCount={1} scheduleCount={0} section="places" tripId="trip-1" />);

  expect(screen.getByRole("heading", { name: "이제 첫 일정을 연결하세요" })).toBeVisible();
  expect(screen.getByRole("link", { name: "첫 일정 추가" })).toHaveAttribute(
    "href",
    "/manage/trips/trip-1/edit/schedules",
  );
});

it("장소를 아직 저장하지 않았으면 장소 편집 화면에 다음 단계를 띄우지 않는다", () => {
  const { container } = render(
    <TripEditSectionNextStep placeCount={0} scheduleCount={0} section="places" tripId="trip-1" />,
  );

  expect(container).toBeEmptyDOMElement();
});

it("일정이 이미 있으면 장소 편집 화면에서 다시 첫 일정을 권하지 않는다", () => {
  const { container } = render(
    <TripEditSectionNextStep placeCount={2} scheduleCount={3} section="places" tripId="trip-1" />,
  );

  expect(container).toBeEmptyDOMElement();
});

it("첫 일정을 저장하면 일정 편집 화면에서 여행 화면 확인으로 안내한다", () => {
  render(<TripEditSectionNextStep placeCount={1} scheduleCount={1} section="schedules" tripId="trip-1" />);

  expect(screen.getByRole("heading", { name: "여행 동선을 확인할 준비가 됐어요" })).toBeVisible();
  expect(screen.getByRole("link", { name: "여행 화면 보기" })).toHaveAttribute("href", "/manage/trips/trip-1");
});

it("일정이 없으면 일정 편집 화면에 다음 단계를 띄우지 않는다", () => {
  const { container } = render(
    <TripEditSectionNextStep placeCount={1} scheduleCount={0} section="schedules" tripId="trip-1" />,
  );

  expect(container).toBeEmptyDOMElement();
});

it("장소·일정 외 편집 화면에는 다음 단계를 띄우지 않는다", () => {
  const { container } = render(
    <TripEditSectionNextStep placeCount={1} scheduleCount={0} section="flights" tripId="trip-1" />,
  );

  expect(container).toBeEmptyDOMElement();
});

// 허브의 추천 규칙(getTripEditNextStep)은 저장 장소가 없으면 일정이 있어도 첫 장소를 먼저 권한다.
// 편집 항목 화면도 같은 우선순위를 따른다 — 바꾸려면 별도 UX 결정이 필요하다.
it("장소 없이 일정만 있으면 일정 편집 화면에서도 첫 장소 추가를 먼저 권한다", () => {
  render(<TripEditSectionNextStep placeCount={0} scheduleCount={1} section="schedules" tripId="trip-1" />);

  expect(screen.getByRole("heading", { name: "먼저 여행 장소를 저장하세요" })).toBeVisible();
  expect(screen.getByRole("link", { name: "첫 장소 추가" })).toHaveAttribute(
    "href",
    "/manage/trips/trip-1/edit/places",
  );
  expect(screen.queryByRole("link", { name: "여행 화면 보기" })).not.toBeInTheDocument();
});
