import { render, screen, waitFor } from "@testing-library/react";
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

const mapInstances: FakeMap[] = [];
const markerInstances: FakeMarker[] = [];
const advancedMarkerInstances: FakeAdvancedMarker[] = [];
const pinInstances: FakePinElement[] = [];
const boundsInstances: FakeLatLngBounds[] = [];

class FakeMap {
  fitBounds = vi.fn();
  readonly options: { mapId?: string };
  setCenter = vi.fn();
  setZoom = vi.fn();

  constructor(_element: HTMLElement, options: FakeMap["options"]) {
    this.options = options;
    mapInstances.push(this);
  }
}

class FakeMarker {
  readonly options: {
    position?: { lat: number; lng: number };
    title?: string;
  };
  private clickListener?: () => void;

  constructor(options: FakeMarker["options"]) {
    this.options = options;
    markerInstances.push(this);
  }

  addListener = vi.fn((eventName: string, listener: () => void) => {
    if (eventName === "click") this.clickListener = listener;
  });
  setMap = vi.fn();

  click() {
    this.clickListener?.();
  }
}

class FakeAdvancedMarker {
  readonly options: {
    gmpClickable?: boolean;
    map?: FakeMap | null;
    position?: { lat: number; lng: number };
    title?: string;
    zIndex?: number;
  };
  private clickListener?: () => void;
  map: FakeMap | null;
  readonly children: FakePinElement[] = [];

  constructor(options: FakeAdvancedMarker["options"]) {
    this.options = options;
    this.map = options.map ?? null;
    advancedMarkerInstances.push(this);
  }

  addListener = vi.fn((eventName: string, listener: () => void) => {
    if (eventName === "click") this.clickListener = listener;
  });

  append(pin: FakePinElement) {
    this.children.push(pin);
  }

  click() {
    this.clickListener?.();
  }
}

class FakePinElement {
  readonly options: {
    background?: string;
    borderColor?: string;
    glyphColor?: string;
    glyphText?: string;
    scale?: number;
  };

  constructor(options: FakePinElement["options"]) {
    this.options = options;
    pinInstances.push(this);
  }
}

class FakeLatLngBounds {
  extend = vi.fn();

  constructor() {
    boundsInstances.push(this);
  }
}

function installLoadedMapRuntime(mapID = "") {
  vi.mocked(loadGoogleMaps).mockResolvedValue({
    AdvancedMarkerElement: FakeAdvancedMarker,
    Map: FakeMap,
    LegacyMarker: FakeMarker,
    LatLngBounds: FakeLatLngBounds,
    PinElement: FakePinElement,
    circleSymbolPath: 0,
    mapID,
  } as never);
}

describe("TravelMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mapInstances.length = 0;
    markerInstances.length = 0;
    advancedMarkerInstances.length = 0;
    pinInstances.length = 0;
    boundsInstances.length = 0;
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
    const getCurrentPosition = vi.fn(
      (_success: PositionCallback, error: PositionErrorCallback) =>
        error({
          code: 1,
          message: "denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        }),
    );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
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
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("저장 장소 지도")).toBeVisible();
  });

  it("고정밀 위치 확인이 일시적으로 실패하면 모바일 친화 설정으로 한 번 더 시도한다", async () => {
    installLoadedMapRuntime();
    const getCurrentPosition = vi
      .fn()
      .mockImplementationOnce((_success: PositionCallback, error: PositionErrorCallback) =>
        error({
          code: 3,
          message: "high accuracy timeout",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        }),
      )
      .mockImplementationOnce((success: PositionCallback) =>
        success({
          coords: {
            accuracy: 42,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            latitude: 31.2304,
            longitude: 121.4737,
            speed: null,
            toJSON: () => ({}),
          },
          timestamp: 0,
          toJSON: () => ({}),
        }),
      );
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    });

    render(
      <TravelMap
        onSelectPlace={() => undefined}
        places={[mappablePlace]}
        selectedPlaceID=""
      />,
    );

    await userEvent.click(await screen.findByRole("button", { name: "현재 위치 표시" }));

    expect(await screen.findByRole("status", { name: "현재 위치 표시 상태" })).toHaveTextContent(
      "현재 위치를 지도에 표시했습니다",
    );
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getCurrentPosition).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, maximumAge: 30_000 }),
    );
    expect(getCurrentPosition).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: false, maximumAge: 300_000 }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("현재 위치를 저장 장소와 같은 지도에 표시하고 성공 상태를 알린다", async () => {
    installLoadedMapRuntime();
    const onSelectPlace = vi.fn();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: {
              accuracy: 8,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              latitude: 37.5665,
              longitude: 126.978,
              speed: null,
              toJSON: () => ({}),
            },
            timestamp: 0,
            toJSON: () => ({}),
          }),
      },
    });

    render(
      <TravelMap
        onSelectPlace={onSelectPlace}
        places={[mappablePlace]}
        selectedPlaceID=""
      />,
    );

    await userEvent.click(await screen.findByRole("button", { name: "현재 위치 표시" }));

    expect(await screen.findByRole("status", { name: "현재 위치 표시 상태" })).toHaveTextContent(
      "현재 위치를 지도에 표시했습니다",
    );
    expect(screen.getByRole("button", { name: "현재 위치 갱신" })).toBeVisible();

    const currentLocationMarker = markerInstances.find(
      (marker) => marker.options.title === "현재 위치",
    );
    expect(currentLocationMarker?.options.position).toEqual({
      lat: 37.5665,
      lng: 126.978,
    });
    const storedPlaceMarker = markerInstances
      .filter((marker) => marker.options.title === "인민광장")
      .at(-1);
    expect(storedPlaceMarker?.options.position).toEqual({
      lat: 31.2304,
      lng: 121.4737,
    });
    storedPlaceMarker?.click();
    expect(onSelectPlace).toHaveBeenCalledWith("people-square");
    expect(boundsInstances.at(-1)?.extend).toHaveBeenCalledWith({
      lat: 31.2304,
      lng: 121.4737,
    });
    expect(boundsInstances.at(-1)?.extend).toHaveBeenCalledWith({
      lat: 37.5665,
      lng: 126.978,
    });
    expect(mapInstances[0]?.fitBounds).toHaveBeenCalledWith(
      boundsInstances.at(-1),
      48,
    );
  });

  it("운영 Map ID가 있으면 접근 가능한 Advanced Marker 핀을 사용한다", async () => {
    installLoadedMapRuntime("travel-map-id");
    const onSelectPlace = vi.fn();

    render(
      <TravelMap
        onSelectPlace={onSelectPlace}
        places={[mappablePlace]}
        selectedPlaceID="people-square"
      />,
    );

    await screen.findByRole("button", { name: "현재 위치 표시" });
    await waitFor(() => expect(advancedMarkerInstances).toHaveLength(1));

    expect(mapInstances[0]?.options.mapId).toBe("travel-map-id");
    expect(markerInstances).toHaveLength(0);
    expect(advancedMarkerInstances[0]?.options).toMatchObject({
      gmpClickable: true,
      position: { lat: 31.2304, lng: 121.4737 },
      title: "인민광장",
      zIndex: 20,
    });
    expect(pinInstances[0]?.options).toMatchObject({
      background: "#C94F3D",
      borderColor: "#FFFFFF",
      glyphColor: "#FFFFFF",
      scale: 1.15,
    });

    advancedMarkerInstances[0]?.click();
    expect(onSelectPlace).toHaveBeenCalledWith("people-square");
  });
});
