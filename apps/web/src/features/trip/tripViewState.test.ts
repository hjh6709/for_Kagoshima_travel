import { beforeEach, describe, expect, it } from "vitest";
import { trip } from "../../data/sampleTrip";
import { getSavedTripDates } from "./tripViewState";

describe("demo tripViewState", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it("기존 가고시마 샘플의 저장 날짜를 상하이 샘플에 재사용하지 않는다", () => {
    window.localStorage.setItem(
      "kagoshima-trip-dates",
      JSON.stringify({ startDate: "2026-06-27", endDate: "2026-06-30" }),
    );

    expect(getSavedTripDates()).toEqual({
      startDate: trip.startDate,
      endDate: trip.endDate,
    });
  });
});
