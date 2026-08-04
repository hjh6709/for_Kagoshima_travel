import { describe, expect, it } from "vitest";
import {
  getAmapDirectionsUrl,
  getAmapSearchUrl,
  getGoogleDirectionsUrl,
  getPlaceMarkerUrl,
} from "./mapLinks";

describe("mapLinks", () => {
  it("중국 장소 검색을 상하이 도시 코드로 제한하지 않는다", () => {
    const url = getAmapSearchUrl({
      name: "광저우 타워",
      chineseName: "广州塔",
    });

    expect(url).toBeDefined();
    const parsed = new URL(url!);
    expect(parsed.hostname).toBe("uri.amap.com");
    expect(parsed.pathname).toBe("/search");
    expect(parsed.searchParams.get("keyword")).toBe("广州塔");
    expect(parsed.searchParams.has("city")).toBe(false);
  });

  it("고덕지도 검색은 현지 장소명과 주소를 함께 전달해 동명 장소를 구분한다", () => {
    const url = getAmapSearchUrl({
      name: "상하이 푸둥 국제공항",
      chineseName: "上海浦东国际机场",
      address: "Yingbin Expy, Pudong, Shanghai",
      chineseAddress: "上海市浦东新区启航路900号",
    });

    expect(url).toBeDefined();
    expect(new URL(url!).searchParams.get("keyword")).toBe(
      "上海浦东国际机场 上海市浦东新区启航路900号",
    );
  });

  it("좌표 체계를 모르는 장소는 고덕지도 좌표 길찾기에 넘기지 않는다", () => {
    expect(
      getAmapDirectionsUrl({
        name: "상하이 타워",
        chineseName: "上海中心大厦",
        latitude: 31.23562,
        longitude: 121.50127,
      }),
    ).toBeUndefined();
  });

  it("GCJ-02로 확인된 좌표만 고덕지도 좌표 길찾기에 사용한다", () => {
    const url = getAmapDirectionsUrl({
      name: "상하이 타워",
      chineseName: "上海中心大厦",
      coordinateSystem: "gcj02",
      latitude: 31.23351,
      longitude: 121.505366,
    });

    expect(url).toBeDefined();
    expect(new URL(url!).searchParams.get("to")).toBe("121.505366,31.23351,上海中心大厦");
  });

  it("Google Places의 WGS84 좌표는 고덕지도 장소 표시에 좌표계를 명시해 전달한다", () => {
    const url = getPlaceMarkerUrl("amap", {
      name: "상하이 푸둥 국제공항",
      chineseName: "上海浦东国际机场",
      coordinateSystem: "wgs84",
      latitude: 31.14333,
      longitude: 121.80528,
    });

    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/marker");
    expect(parsed.searchParams.get("position")).toBe("121.80528,31.14333");
    expect(parsed.searchParams.get("name")).toBe("上海浦东国际机场");
    expect(parsed.searchParams.get("coordinate")).toBe("wgs84");
  });

  it("Place ID가 없는 Google 길찾기는 좌표보다 장소명과 주소를 우선해 목적지를 구분한다", () => {
    const url = getGoogleDirectionsUrl({
      name: "상하이 푸둥 국제공항",
      chineseName: "上海浦东国际机场",
      chineseAddress: "上海市浦东新区启航路900号",
      latitude: 31.14333,
      longitude: 121.80528,
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("destination")).toBe(
      "上海浦东国际机场, 上海市浦东新区启航路900号",
    );
    expect(parsed.searchParams.has("destination_place_id")).toBe(false);
    expect(parsed.searchParams.get("dir_action")).toBe("navigate");
  });
});
