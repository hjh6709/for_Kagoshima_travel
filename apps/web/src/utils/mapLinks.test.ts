import { describe, expect, it } from "vitest";
import { getAmapSearchUrl } from "./mapLinks";

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
});
