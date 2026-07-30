import { describe, expect, it } from "vitest";
import { getAmapDirectionsUrl, getAmapSearchUrl } from "./mapLinks";

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
});
