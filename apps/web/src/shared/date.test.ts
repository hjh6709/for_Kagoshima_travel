import { describe, expect, it } from "vitest";
import { getTripDateRange } from "./date";

describe("getTripDateRange", () => {
  it("여행의 시작일부터 종료일까지 빠짐없이 반환한다", () => {
    expect(getTripDateRange("2026-08-17", "2026-08-20")).toEqual([
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
    ]);
  });

  it("잘못된 범위는 날짜를 만들지 않는다", () => {
    expect(getTripDateRange("2026-08-20", "2026-08-17")).toEqual([]);
    expect(getTripDateRange("invalid", "2026-08-17")).toEqual([]);
    expect(getTripDateRange("2026-02-30", "2026-03-02")).toEqual([]);
  });
});
