import type { FormEvent } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getCurrentUser, logout } from "../../api/auth";
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
    endDate: "2026-08-03",
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
        newTripEndDate: "",
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
        tripEditEmergencyContactName: "",
        tripEditEmergencyContactPhone: "",
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

  expect(vi.mocked(createTrip).mock.calls[0]?.[1]).toEqual(
    expect.objectContaining({
      startDate: "2026-08-03",
      endDate: "2026-08-03",
    }),
  );
  expect(navigateToManageTripEditor).toHaveBeenCalledWith("trip-created");
});

it("서버 로그아웃이 끝난 뒤에만 로그인 화면으로 전환한다", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    user: { id: "owner-1", email: "owner@example.com" },
  });
  let finishLogout: (() => void) | undefined;
  vi.mocked(logout).mockImplementation(
    () => new Promise<void>((resolve) => { finishLogout = resolve; }),
  );

  const { result } = renderHook(() =>
    useTripManageSessionTrips({
      currentPath: "/manage",
      isLegacyOwnerRoute: false,
      isManageRoute: true,
      tripCreateForm: {
        newTripEndDate: "",
        newTripMemo: "",
        newTripStartDate: "",
        newTripTitle: "",
        newTripTravelers: "",
        newTripDestinationCountry: "CN",
        resetTripCreateForm: vi.fn(),
        setTripCreateError: vi.fn(),
        setTripCreateSubmitting: vi.fn(),
      },
      tripEditForm: {
        setTripEditError: vi.fn(),
        setTripEditSubmitting: vi.fn(),
        tripEditEndDate: "",
        tripEditEmergencyContactName: "",
        tripEditEmergencyContactPhone: "",
        tripEditMemo: "",
        tripEditStartDate: "",
        tripEditTitle: "",
        tripEditTravelers: "",
        tripEditDestinationCountry: "",
      },
    }),
  );

  await waitFor(() => expect(result.current.ownerAuth).not.toBeNull());
  let pendingLogout: Promise<void> | undefined;
  act(() => {
    pendingLogout = result.current.logoutOwnerSession();
  });

  expect(result.current.ownerAuth).not.toBeNull();
  await act(async () => {
    finishLogout?.();
    await pendingLogout;
  });
  expect(result.current.ownerAuth).toBeNull();
});

it("서버 로그아웃 실패 시 현재 세션을 유지해 다시 시도할 수 있다", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue({
    user: { id: "owner-1", email: "owner@example.com" },
  });
  vi.mocked(logout).mockRejectedValue(new Error("network unavailable"));

  const { result } = renderHook(() =>
    useTripManageSessionTrips({
      currentPath: "/manage",
      isLegacyOwnerRoute: false,
      isManageRoute: true,
      tripCreateForm: {
        newTripEndDate: "",
        newTripMemo: "",
        newTripStartDate: "",
        newTripTitle: "",
        newTripTravelers: "",
        newTripDestinationCountry: "CN",
        resetTripCreateForm: vi.fn(),
        setTripCreateError: vi.fn(),
        setTripCreateSubmitting: vi.fn(),
      },
      tripEditForm: {
        setTripEditError: vi.fn(),
        setTripEditSubmitting: vi.fn(),
        tripEditEndDate: "",
        tripEditEmergencyContactName: "",
        tripEditEmergencyContactPhone: "",
        tripEditMemo: "",
        tripEditStartDate: "",
        tripEditTitle: "",
        tripEditTravelers: "",
        tripEditDestinationCountry: "",
      },
    }),
  );

  await waitFor(() => expect(result.current.ownerAuth).not.toBeNull());
  await expect(result.current.logoutOwnerSession()).rejects.toThrow(
    "network unavailable",
  );
  expect(result.current.ownerAuth).not.toBeNull();
});
