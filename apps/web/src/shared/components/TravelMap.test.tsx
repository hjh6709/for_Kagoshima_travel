import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadGoogleMaps } from "../map/googleMapsLoader";
import { TravelMap } from "./TravelMap";

vi.mock("../map/googleMapsLoader", () => ({
  loadGoogleMaps: vi.fn(),
}));

const mappablePlace = {
  id: "people-square",
  name: "인민광장",
  latitude: 31.2304,
  longitude: 121.4737,
};

const placeWithoutCoordinates = {
  id: "missing",
  name: "좌표 없는 장소",
};

class FakeMap {
  fitBounds = vi.fn();
  setCenter = vi.fn();
  setZoom = vi.fn();
}

class FakeMarker {
  addListener = vi.fn();
  setMap = vi.fn();
}

class FakeLatLngBounds {
  extend = vi.fn();
}

function installLoadedMapRuntime() {
  vi.mocked(loadGoogleMaps).mockResolvedValue({
    Map: FakeMap,
    Marker: FakeMarker,
    LatLngBounds: FakeLatLngBounds,
    circleSymbolPath: 0,
  } as never);
}

describe("TravelMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("지도 SDK를 불러오지 못해도 장소 목록과 길찾기를 계속 쓸 수 있다고 안내한다", async () => {
    vi.mocked(loadGoogleMaps).mockRejectedValue(new Error("missing browser key"));

    render(
      <TravelMap
        onSelectPlace={() => undefined}
        places={[mappablePlace]}
        selectedPlaceID=""
      />,
    );

    expect(await screen.findByText("지도를 준비하지 못했습니다")).toBeVisible();
    expect(screen.getByText("저장한 장소 목록과 길찾기는 계속 사용할 수 있습니다.")).toBeVisible();
  });

  it("좌표가 없는 장소는 숨기지 않고 지도 표시 제외 개수를 안내한다", async () => {
    installLoadedMapRuntime();

    render(
      <TravelMap
        onSelectPlace={() => undefined}
        places={[mappablePlace, placeWithoutCoordinates]}
        selectedPlaceID=""
      />,
    );

    expect(await screen.findByText("지도에 표시할 수 없는 장소 1개")).toBeVisible();
  });

  it("위치 권한이 거부되어도 저장 장소 지도는 유지한다", async () => {
    installLoadedMapRuntime();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) =>
          error({
            code: 1,
            message: "denied",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          }),
      },
    });

    render(
      <TravelMap
        onSelectPlace={() => undefined}
        places={[mappablePlace]}
        selectedPlaceID=""
      />,
    );

    await userEvent.click(await screen.findByRole("button", { name: "현재 위치 표시" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("위치 권한을 허용하지 않았습니다");
    expect(screen.getByLabelText("저장 장소 지도")).toBeVisible();
  });
});
