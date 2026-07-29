import { describe, expect, it } from "vitest";
import { getMapCenter, getMappablePlaces } from "./mapModel";

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
