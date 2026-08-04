import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchTripPlaces } from "../../../../api/trips";
import { ManagePlaceCreateForm } from "./ManagePlaceCreateForm";

vi.mock("../../../../api/trips", async () => ({
  ...(await vi.importActual<typeof import("../../../../api/trips")>("../../../../api/trips")),
  searchTripPlaces: vi.fn(),
}));

const noop = vi.fn();

function placeFormProps(overrides: Partial<React.ComponentProps<typeof ManagePlaceCreateForm>> = {}) {
  return {
    auth: { accessToken: "token", user: { id: "user-1", email: "traveler@example.com" } },
    destinationCountry: "CN",
    newPlaceAddress: "",
    newPlaceCategory: "sightseeing" as const,
    newPlaceChineseAddress: "",
    newPlaceChineseName: "",
    newPlaceGoogleMapsURL: "",
    newPlaceName: "",
    newPlaceRecommendedReason: "",
    newPlaceSubwayExit: "",
    newPlaceTaxiPhrase: "",
    onNewPlaceAddressChange: noop,
    onNewPlaceCategoryChange: noop,
    onNewPlaceChineseAddressChange: noop,
    onNewPlaceChineseNameChange: noop,
    onNewPlaceGoogleMapsURLChange: noop,
    onNewPlaceNameChange: noop,
    onNewPlaceRecommendedReasonChange: noop,
    onNewPlaceSearchSelectionChange: noop,
    onNewPlaceSubwayExitChange: noop,
    onNewPlaceTaxiPhraseChange: noop,
    onSubmitNewPlace: (event: React.FormEvent<HTMLFormElement>) => event.preventDefault(),
    placeCreateError: "",
    placeCreateSubmitting: false,
    selectedOwnerTrip: {
      id: "trip-1",
      title: "상하이 여행",
      startDate: "2026-08-03",
      endDate: "2026-08-06",
      travelers: ["나"],
      destinationCountry: "CN",
    },
    ...overrides,
  };
}

describe("ManagePlaceCreateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("검색 결과를 선택하면 선택한 후보만 남기고 저장 행동을 바로 안내한다", async () => {
    vi.mocked(searchTripPlaces).mockResolvedValue([
      { name: "Cafe One", address: "上海市黄浦区1号", latitude: 31.2, longitude: 121.4, googlePlaceId: "one" },
      { name: "Cafe Two", address: "上海市黄浦区2号", latitude: 31.3, longitude: 121.5, googlePlaceId: "two" },
    ]);
    const user = userEvent.setup();
    render(<ManagePlaceCreateForm {...placeFormProps()} />);

    expect(screen.getByRole("region", { name: "장소 검색" })).toBeVisible();
    await user.type(screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당"), "카페");
    await user.click(screen.getByRole("button", { name: "검색" }));
    await user.click(await screen.findByRole("button", { name: /Cafe One.*선택/ }));

    expect(screen.getByText("Cafe One")).toBeInTheDocument();
    expect(screen.queryByText("Cafe Two")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cafe One.*선택됨/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "선택한 장소 저장" })).toBeInTheDocument();
  });

  it("장소 저장이 성공하면 이전 검색 상태를 비운다", async () => {
    vi.mocked(searchTripPlaces).mockResolvedValue([
      { name: "Cafe One", address: "上海市黄浦区1号", latitude: 31.2, longitude: 121.4, googlePlaceId: "one" },
    ]);
    const user = userEvent.setup();
    const { rerender } = render(<ManagePlaceCreateForm {...placeFormProps()} />);

    const searchInput = screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당");
    await user.type(searchInput, "카페");
    await user.click(screen.getByRole("button", { name: "검색" }));
    await user.click(await screen.findByRole("button", { name: /Cafe One.*선택/ }));

    rerender(<ManagePlaceCreateForm {...placeFormProps({ newPlaceName: "Cafe One", placeCreateSubmitting: true })} />);
    rerender(<ManagePlaceCreateForm {...placeFormProps()} />);

    expect(searchInput).toHaveValue("");
    expect(screen.queryByText("Cafe One")).not.toBeInTheDocument();
  });

  it("같은 검색어의 성공 결과가 보이는 동안 Google 장소 검색을 중복 호출하지 않는다", async () => {
    vi.mocked(searchTripPlaces).mockResolvedValue([
      { name: "Cafe One", address: "上海市黄浦区1号", latitude: 31.2, longitude: 121.4, googlePlaceId: "one" },
    ]);
    const user = userEvent.setup();
    render(<ManagePlaceCreateForm {...placeFormProps()} />);

    await user.type(screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당"), "카페");
    await user.click(screen.getByRole("button", { name: "검색" }));
    expect(await screen.findByText("Cafe One")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "검색됨" })).toBeDisabled();
    await user.click(screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당"));
    await user.keyboard("{Enter}");

    expect(searchTripPlaces).toHaveBeenCalledTimes(1);
  });

  it("성공한 같은 검색어도 30초가 지나면 사용자가 다시 검색할 수 있다", async () => {
    vi.useFakeTimers();
    vi.mocked(searchTripPlaces).mockResolvedValue([
      { name: "Cafe One", address: "上海市黄浦区1号", latitude: 31.2, longitude: 121.4, googlePlaceId: "one" },
    ]);
    render(<ManagePlaceCreateForm {...placeFormProps()} />);

    fireEvent.change(screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당"), {
      target: { value: "카페" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "검색" }));
      await Promise.resolve();
    });

    expect(screen.getByRole("button", { name: "검색됨" })).toBeDisabled();
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole("button", { name: "검색" })).toBeEnabled();
    vi.useRealTimers();
  });

  it("같은 검색어라도 이전 검색이 실패했다면 다시 시도한다", async () => {
    vi.mocked(searchTripPlaces)
      .mockRejectedValueOnce(new Error("지도 검색을 일시적으로 사용할 수 없습니다."))
      .mockResolvedValueOnce([
        { name: "Cafe One", address: "上海市黄浦区1号", latitude: 31.2, longitude: 121.4, googlePlaceId: "one" },
      ]);
    const user = userEvent.setup();
    render(<ManagePlaceCreateForm {...placeFormProps()} />);

    await user.type(screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당"), "카페");
    await user.click(screen.getByRole("button", { name: "검색" }));
    expect(await screen.findByText("지도 검색을 일시적으로 사용할 수 없습니다.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "검색" }));

    expect(await screen.findByText("Cafe One")).toBeInTheDocument();
    expect(searchTripPlaces).toHaveBeenCalledTimes(2);
  });

  it("검색 응답을 기다리는 동안 Enter를 반복해도 Places 요청을 하나만 보낸다", async () => {
    let resolveSearch: (results: Awaited<ReturnType<typeof searchTripPlaces>>) => void = () => undefined;
    vi.mocked(searchTripPlaces).mockReturnValue(new Promise((resolve) => {
      resolveSearch = resolve;
    }));
    const user = userEvent.setup();
    render(<ManagePlaceCreateForm {...placeFormProps()} />);

    const searchInput = screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당");
    await user.type(searchInput, "카페");
    await user.keyboard("{Enter}");
    await user.keyboard("{Enter}");

    expect(searchTripPlaces).toHaveBeenCalledTimes(1);

    resolveSearch([
      { name: "Cafe One", address: "上海市黄浦区1号", latitude: 31.2, longitude: 121.4, googlePlaceId: "one" },
    ]);
    expect(await screen.findByText("Cafe One")).toBeInTheDocument();
  });
});
