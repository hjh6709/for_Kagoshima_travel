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

  it("API 일시 장애로 캐시를 표시한 뒤 화면에 돌아오면 최신 공유 여행을 다시 확인한다", async () => {
    const cachedTrip = createSharedTrip("서버 장애 중인 상하이 여행");
    const latestTrip = createSharedTrip("복구된 상하이 여행");
    vi.mocked(isOnline).mockReturnValue(true);
    vi.mocked(getLocalCache).mockReturnValue(cachedTrip);
    vi.mocked(getSharedTrip)
      .mockRejectedValueOnce(new Error("temporary gateway failure"))
      .mockResolvedValueOnce(latestTrip);

    const { result } = renderHook(() => useSharedTripController({ shareToken: "share-token" }));

    await waitFor(() => expect(result.current.sharedTrip).toEqual(cachedTrip));
    expect(result.current.sharedTripWarning).toContain("API 서버");
    expect(getSharedTrip).toHaveBeenCalledTimes(1);

    act(() => window.dispatchEvent(new Event("focus")));

    await waitFor(() => expect(result.current.sharedTrip).toEqual(latestTrip));
    expect(result.current.sharedTripWarning).toBe("");
    expect(getSharedTrip).toHaveBeenCalledTimes(2);
  });

  it("정상적으로 불러온 공유 여행은 화면에 돌아올 때 중복 조회하지 않는다", async () => {
    const sharedTrip = createSharedTrip("정상 상하이 여행");
    vi.mocked(isOnline).mockReturnValue(true);
    vi.mocked(getSharedTrip).mockResolvedValue(sharedTrip);

    const { result } = renderHook(() => useSharedTripController({ shareToken: "share-token" }));

    await waitFor(() => expect(result.current.sharedTrip).toEqual(sharedTrip));
    expect(getSharedTrip).toHaveBeenCalledTimes(1);

    act(() => window.dispatchEvent(new Event("focus")));

    expect(getSharedTrip).toHaveBeenCalledTimes(1);
  });
});
