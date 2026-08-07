import { describe, expect, it } from "vitest";
import { MARKER_COLORS, getMapCenter, getMappablePlaces, getMarkerAppearance } from "./mapModel";

describe("getMappablePlaces", () => {
  it("유효 범위의 위도와 경도를 가진 장소만 지도에 표시한다", () => {
    const places = [
      { id: "valid", name: "인민광장", latitude: 31.2304, longitude: 121.4737 },
      { id: "missing", name: "좌표 없음" },
      { id: "invalid", name: "잘못된 좌표", latitude: 95, longitude: 200 },
      { id: "zero", name: "영점", latitude: 0, longitude: 0 },
    ];

    expect(getMappablePlaces(places).map((place) => place.id)).toEqual(["valid", "zero"]);
  });
});

describe("getMapCenter", () => {
  it("표시할 장소가 없으면 중심점을 만들지 않는다", () => {
    expect(getMapCenter([])).toBeNull();
  });

  it("여러 장소의 산술 중심을 반환한다", () => {
    expect(
      getMapCenter([
        { id: "a", name: "A", latitude: 30, longitude: 120 },
        { id: "b", name: "B", latitude: 32, longitude: 122 },
      ]),
    ).toEqual({ latitude: 31, longitude: 121 });
  });
});

describe("getMarkerAppearance", () => {
  it("선택된 장소 핀은 색상과 크기를 함께 강조한다", () => {
    expect(getMarkerAppearance("people-square", "people-square")).toEqual({
      background: "destination",
      color: MARKER_COLORS.destination,
      scale: 1.15,
      selected: true,
    });
    expect(getMarkerAppearance("museum", "people-square")).toEqual({
      background: "route",
      color: MARKER_COLORS.route,
      scale: 1,
      selected: false,
    });
  });
});

describe("getMarkerAppearance 핀 색", () => {
  it("선택한 핀과 일반 핀에 서로 다른 새 팔레트 색을 준다", () => {
    const selected = getMarkerAppearance("place-1", "place-1");
    const normal = getMarkerAppearance("place-2", "place-1");

    expect(selected.color).toBe(MARKER_COLORS.destination);
    expect(normal.color).toBe(MARKER_COLORS.route);
    expect(selected.color).not.toBe(normal.color);
  });

  it("핀 색에 1단계 이전의 옛 팔레트 값이 남아 있지 않다", () => {
    const legacyPalette = ["#C94F3D", "#0B6F6A", "#17333D"];

    for (const color of Object.values(MARKER_COLORS)) {
      expect(legacyPalette).not.toContain(color.toUpperCase());
    }
  });
});
