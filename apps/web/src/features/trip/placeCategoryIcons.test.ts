import { describe, expect, it } from "vitest";
import { placeCategoryLabels } from "../../shared/travelOptions";
import { placeCategoryIcons } from "./placeCategoryIcons";

describe("placeCategoryIcons", () => {
  it("모든 장소 범주에 아이콘이 있다", () => {
    for (const category of Object.keys(placeCategoryLabels)) {
      expect(placeCategoryIcons[category as keyof typeof placeCategoryIcons]).toBeTruthy();
    }
  });

  it("라벨과 아이콘의 범주 목록이 정확히 일치한다", () => {
    expect(Object.keys(placeCategoryIcons).sort()).toEqual(Object.keys(placeCategoryLabels).sort());
  });
});
