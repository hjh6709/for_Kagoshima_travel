import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSharedTrip, type SharedTripResponse } from "../../api/trips";
import { getLocalCache, isOnline, setLocalCache } from "../../utils/offlineCache";
import { useSharedTripController } from "./useSharedTripController";

vi.mock("../../api/trips", () => ({
  getSharedTrip: vi.fn(),
}));

vi.mock("../../utils/offlineCache", () => ({
  getLocalCache: vi.fn(),
  isOnline: vi.fn(),
  OFFLINE_CACHE_KEYS: {
    SHARED_TRIP: (token: string) => `shared-trip-${token}`,
  },
  setLocalCache: vi.fn(),
}));

function createSharedTrip(title: string): SharedTripResponse {
  return {
    trip: {
      id: "trip-1",
      title,
      startDate: "2026-08-18",
      endDate: "2026-08-20",
      travelers: ["나", "친구"],
      destinationCountry: "CN",
    },
    schedules: [],
    places: [],
    flights: [],
    routes: [],
    checklist: [],
  };
}

describe("useSharedTripController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("오프라인 캐시를 표시한 뒤 연결이 복구되면 최신 공유 여행을 자동으로 불러온다", async () => {
    const cachedTrip = createSharedTrip("오프라인 상하이 여행");
    const latestTrip = createSharedTrip("최신 상하이 여행");
    let resolveLatestTrip: (trip: SharedTripResponse) => void = () => undefined;
    const latestTripRequest = new Promise<SharedTripResponse>((resolve) => {
      resolveLatestTrip = resolve;
    });
    vi.mocked(isOnline).mockReturnValue(false);
    vi.mocked(getLocalCache).mockReturnValue(cachedTrip);
    vi.mocked(getSharedTrip).mockReturnValue(latestTripRequest);

    const { result } = renderHook(() => useSharedTripController({ shareToken: "share-token" }));

    await waitFor(() => expect(result.current.sharedTrip).toEqual(cachedTrip));
    expect(result.current.sharedTripWarning).toContain("오프라인 데이터");
    expect(getSharedTrip).not.toHaveBeenCalled();

    vi.mocked(isOnline).mockReturnValue(true);
    act(() => window.dispatchEvent(new Event("online")));

    await waitFor(() => expect(getSharedTrip).toHaveBeenCalledWith("share-token"));
    expect(result.current.sharedTrip).toEqual(cachedTrip);
    expect(result.current.sharedTripLoading).toBe(false);
    expect(result.current.sharedTripWarning).toContain("오프라인 데이터");

    act(() => resolveLatestTrip(latestTrip));
    await waitFor(() => expect(result.current.sharedTrip).toEqual(latestTrip));
    expect(result.current.sharedTripWarning).toBe("");
    expect(setLocalCache).toHaveBeenCalledWith("shared-trip-share-token", latestTrip);
  });
});
