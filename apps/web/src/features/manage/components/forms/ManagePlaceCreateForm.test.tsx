import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
  it("검색 결과를 선택하면 선택한 후보만 남기고 저장 행동을 바로 안내한다", async () => {
    vi.mocked(searchTripPlaces).mockResolvedValue([
      { name: "Cafe One", address: "上海市黄浦区1号", latitude: 31.2, longitude: 121.4, googlePlaceId: "one" },
      { name: "Cafe Two", address: "上海市黄浦区2号", latitude: 31.3, longitude: 121.5, googlePlaceId: "two" },
    ]);
    const user = userEvent.setup();
    render(<ManagePlaceCreateForm {...placeFormProps()} />);

    await user.type(screen.getByPlaceholderText("장소·종류 예: 신천지, 카페, 식당"), "카페");
    await user.click(screen.getByRole("button", { name: "검색" }));
    await user.click(await screen.findByRole("button", { name: /Cafe One.*선택/ }));

    expect(screen.getByText("Cafe One")).toBeInTheDocument();
    expect(screen.queryByText("Cafe Two")).not.toBeInTheDocument();
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
});
