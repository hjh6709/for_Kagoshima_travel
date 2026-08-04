import type { FormEvent } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { TripCreateSection } from "./TripCreateSection";

it("목적지를 빠뜨려도 제출을 가로막지 않고 앱의 안내 흐름으로 전달한다", async () => {
  const onSubmitNewTrip = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
  const user = userEvent.setup();

  render(
    <TripCreateSection
      isFirstTrip={false}
      isOpen
      newTripEndDate="2026-08-12"
      newTripMemo=""
      newTripStartDate="2026-08-10"
      newTripTitle="상하이 여행"
      newTripTravelers=""
      newTripDestinationCountry=""
      onNewTripEndDateChange={vi.fn()}
      onNewTripMemoChange={vi.fn()}
      onNewTripStartDateChange={vi.fn()}
      onNewTripTitleChange={vi.fn()}
      onNewTripTravelersChange={vi.fn()}
      onNewTripDestinationCountryChange={vi.fn()}
      onSubmitNewTrip={onSubmitNewTrip}
      onOpenChange={vi.fn()}
      tripCreateError=""
      tripCreateSubmitting={false}
    />
  );

  await user.click(screen.getByRole("button", { name: "새 여행 추가하기" }));

  expect(onSubmitNewTrip).toHaveBeenCalledOnce();
});

it("첫 여행은 접이식 없이 필수 입력을 바로 보여 주고 종료일을 선택으로 둔다", () => {
  render(
    <TripCreateSection
      isFirstTrip
      isOpen={false}
      newTripEndDate=""
      newTripMemo=""
      newTripStartDate=""
      newTripTitle=""
      newTripTravelers=""
      newTripDestinationCountry=""
      onNewTripEndDateChange={vi.fn()}
      onNewTripMemoChange={vi.fn()}
      onNewTripStartDateChange={vi.fn()}
      onNewTripTitleChange={vi.fn()}
      onNewTripTravelersChange={vi.fn()}
      onNewTripDestinationCountryChange={vi.fn()}
      onSubmitNewTrip={vi.fn()}
      onOpenChange={vi.fn()}
      tripCreateError=""
      tripCreateSubmitting={false}
    />,
  );

  expect(screen.getByRole("heading", { name: "첫 여행 만들기" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "새 여행 추가 열기" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("여행명")).toBeVisible();
  expect(screen.getByLabelText("목적지 국가")).toBeVisible();
  expect(screen.getByLabelText("시작일")).toBeRequired();
  expect(screen.getByLabelText(/종료일/)).not.toBeRequired();
  expect(screen.getByText("종료일을 비워 두면 당일 여행으로 만듭니다.")).toBeVisible();
});
