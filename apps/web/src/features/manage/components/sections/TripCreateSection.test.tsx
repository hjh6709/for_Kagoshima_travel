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

  await user.click(screen.getByRole("button", { name: "새 여행 만들기" }));

  expect(onSubmitNewTrip).toHaveBeenCalledOnce();
});
