import { describe, expect, it } from "vitest";
import { getPlaceCategoryLabel } from "./travelOptions";

describe("getPlaceCategoryLabel", () => {
  it("알려진 분류는 한국어 이름을 돌려준다", () => {
    expect(getPlaceCategoryLabel("sightseeing")).toBe("관광");
    expect(getPlaceCategoryLabel("hotel")).toBe("숙소");
  });

  it.each(["unknown", "", "__proto__", "constructor", "toString", "hasOwnProperty"])(
    "알 수 없거나 상속된 이름(%j)은 문자열 기본값 '장소'로 돌려준다",
    (category) => {
      expect(getPlaceCategoryLabel(category)).toBe("장소");
    },
  );
});
