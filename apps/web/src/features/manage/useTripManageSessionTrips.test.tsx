import type { FormEvent } from "react";
import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { createTrip } from "../../api/trips";
import { navigateToManageTripEditor } from "../../shared/manageRoute";
import { useTripManageSessionTrips } from "./useTripManageSessionTrips";

vi.mock("../../api/trips", async () => ({
  ...(await vi.importActual<typeof import("../../api/trips")>("../../api/trips")),
  createTrip: vi.fn(),
}));

vi.mock("../../shared/manageRoute", async () => ({
  ...(await vi.importActual<typeof import("../../shared/manageRoute")>("../../shared/manageRoute")),
  navigateToManageTripEditor: vi.fn(),
}));

vi.mock("./ownerAuthStorage", () => ({
  ownerAuthStorageKey: "travel-app-owner-auth",
  getSavedOwnerAuth: () => ({
    accessToken: "owner-token",
    user: { id: "owner-1", email: "owner@example.com" },
  }),
}));

it("여행 생성 성공 후 새 여행의 편집 허브로 이동한다", async () => {
  vi.mocked(createTrip).mockResolvedValue({
    id: "trip-created",
    title: "상하이 여행",
    startDate: "2026-08-03",
    endDate: "2026-08-06",
    travelers: ["나", "친구"],
    destinationCountry: "CN",
    memo: "",
  });

  const { result } = renderHook(() =>
    useTripManageSessionTrips({
      currentPath: "/",
      isLegacyOwnerRoute: false,
      isManageRoute: false,
      tripCreateForm: {
        newTripEndDate: "2026-08-06",
        newTripMemo: "",
        newTripStartDate: "2026-08-03",
        newTripTitle: "상하이 여행",
        newTripTravelers: "나, 친구",
        newTripDestinationCountry: "CN",
        resetTripCreateForm: vi.fn(),
        setTripCreateError: vi.fn(),
        setTripCreateSubmitting: vi.fn(),
      },
      tripEditForm: {
        setTripEditError: vi.fn(),
        setTripEditSubmitting: vi.fn(),
        tripEditEndDate: "",
        tripEditMemo: "",
        tripEditStartDate: "",
        tripEditTitle: "",
        tripEditTravelers: "",
        tripEditDestinationCountry: "",
      },
    })
  );

  await act(async () => {
    await result.current.submitNewTrip({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>);
  });

  expect(navigateToManageTripEditor).toHaveBeenCalledWith("trip-created");
});
