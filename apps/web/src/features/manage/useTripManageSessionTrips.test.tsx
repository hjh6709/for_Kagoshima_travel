import type { FormEvent } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getCurrentUser } from "../../api/auth";
import { createTrip } from "../../api/trips";
import { navigateToManageTripEditor } from "../../shared/manageRoute";
import { useTripManageSessionTrips } from "./useTripManageSessionTrips";

vi.mock("../../api/auth", async () => ({
  ...(await vi.importActual<typeof import("../../api/auth")>("../../api/auth")),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../api/trips", async () => ({
  ...(await vi.importActual<typeof import("../../api/trips")>("../../api/trips")),
  createTrip: vi.fn(),
  listMyTrips: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../shared/manageRoute", async () => ({
  ...(await vi.importActual<typeof import("../../shared/manageRoute")>("../../shared/manageRoute")),
  navigateToManageTripEditor: vi.fn(),
}));

vi.mock("./ownerAuthStorage", () => ({
  clearLegacyOwnerAuthStorage: vi.fn(),
}));

it("여행 생성 성공 후 새 여행의 편집 허브로 이동한다", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    user: { id: "owner-1", email: "owner@example.com" },
  });
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
      isManageRoute: true,
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

  await waitFor(() => expect(result.current.ownerAuth).not.toBeNull());

  await act(async () => {
    await result.current.submitNewTrip({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>);
  });

  expect(navigateToManageTripEditor).toHaveBeenCalledWith("trip-created");
});
