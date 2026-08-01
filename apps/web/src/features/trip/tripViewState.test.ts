import { beforeEach, describe, expect, it } from "vitest";
import { trip } from "../../data/sampleTrip";
import { getInitialTripView, getSavedTripDates } from "./tripViewState";

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

  it("관리 화면에서 돌아온 항목의 탭을 바로 연다", () => {
    expect(getInitialTripView("#schedule")).toEqual({ activeTab: "schedule", scheduleView: "itinerary" });
    expect(getInitialTripView("#schedule-checklist")).toEqual({ activeTab: "schedule", scheduleView: "checklist" });
    expect(getInitialTripView("#map")).toEqual({ activeTab: "map", scheduleView: "itinerary" });
    expect(getInitialTripView("#unknown")).toEqual({ activeTab: "today", scheduleView: "itinerary" });
  });
});
