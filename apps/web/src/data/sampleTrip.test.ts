import { afterEach, describe, expect, it, vi } from "vitest";
import { getAmapDirectionsUrl, getGoogleDirectionsUrl, getPlaceMarkerUrl } from "../utils/mapLinks";

async function loadSampleTripAt(date: Date) {
  vi.useFakeTimers();
  vi.setSystemTime(date);
  vi.resetModules();
  return import("./sampleTrip");
}

describe("상하이 샘플 여행", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("오늘로부터 2주 뒤 시작하는 3박 4일 일정을 만든다", async () => {
    const sample = await loadSampleTripAt(new Date(2026, 6, 30, 12));

    expect(sample.trip).toMatchObject({
      title: "상하이 3박 4일",
      startDate: "2026-08-13",
      endDate: "2026-08-16",
      destinationCountry: "CN",
    });
    expect([...new Set(sample.schedules.map((schedule) => schedule.date))]).toEqual([
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
      "2026-08-16",
    ]);
  });

  it("연말에도 날짜가 다음 해로 넘어가며 3박 4일을 유지한다", async () => {
    const sample = await loadSampleTripAt(new Date(2026, 11, 24, 12));

    expect(sample.trip.startDate).toBe("2027-01-07");
    expect(sample.trip.endDate).toBe("2027-01-10");
  });

  it("카페와 식당을 포함한 실제 상하이 장소를 정확한 지도 좌표로 제공한다", async () => {
    const sample = await loadSampleTripAt(new Date(2026, 6, 30, 12));
    const placesByID = new Map(sample.places.map((place) => [place.id, place]));

    expect(sample.places.every((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude))).toBe(
      true,
    );
    expect(sample.places.map((place) => place.category)).toEqual(expect.arrayContaining(["cafe", "meal"]));
    expect(placesByID.get("place-pudong-airport")).toMatchObject({
      chineseName: "上海浦东国际机场",
      latitude: 31.14333,
      longitude: 121.80528,
    });
    expect(placesByID.get("place-marriott-city-centre")).toMatchObject({
      chineseName: "上海雅居乐万豪侯爵酒店",
      latitude: 31.23669,
      longitude: 121.4734,
    });
    expect(placesByID.get("place-yu-garden")).toMatchObject({
      chineseName: "豫园",
      latitude: 31.22917,
      longitude: 121.4875,
    });
    expect(placesByID.get("place-nanxiang")).toMatchObject({
      category: "meal",
      chineseName: "南翔馒头店",
      latitude: 31.22853,
      longitude: 121.4871,
    });
    expect(placesByID.get("place-starbucks-roastery")).toMatchObject({
      category: "cafe",
      chineseName: "星巴克臻选上海烘焙工坊",
      latitude: 31.23249,
      longitude: 121.45767,
    });
    expect(placesByID.get("place-bund")).toMatchObject({
      chineseName: "外滩",
      latitude: 31.23806,
      longitude: 121.48611,
    });
    expect(placesByID.get("place-shanghai-tower")).toMatchObject({
      chineseName: "上海中心大厦",
      latitude: 31.23562,
      longitude: 121.50127,
    });
  });

  it("WGS84 샘플 좌표는 고덕지도 위치 표시와 Google 길찾기에 안전하게 사용한다", async () => {
    const sample = await loadSampleTripAt(new Date(2026, 6, 30, 12));

    for (const place of sample.places) {
      expect(getAmapDirectionsUrl(place)).toBeUndefined();

      const amapURL = new URL(getPlaceMarkerUrl("amap", place));
      expect(amapURL.pathname).toBe("/marker");
      expect(amapURL.searchParams.get("position")).toBe(`${place.longitude},${place.latitude}`);
      expect(amapURL.searchParams.get("name")).toBe(place.chineseName);
      expect(amapURL.searchParams.get("coordinate")).toBe("wgs84");

      const googleURL = new URL(getGoogleDirectionsUrl(place));
      expect(googleURL.searchParams.get("destination")).toBe(
        `${place.chineseName}, ${place.chineseAddress}`,
      );
      expect(googleURL.searchParams.get("dir_action")).toBe("navigate");
    }
  });

  it("모든 일정과 추천 동선이 저장 장소를 참조하고 임시 개인정보를 포함하지 않는다", async () => {
    const sample = await loadSampleTripAt(new Date(2026, 6, 30, 12));
    const placeIDs = new Set(sample.places.map((place) => place.id));

    expect(sample.schedules.every((schedule) => !schedule.placeId || placeIDs.has(schedule.placeId))).toBe(true);
    expect(sample.routes.every((route) => route.placeIds.every((placeID) => placeIDs.has(placeID)))).toBe(true);
    expect(JSON.stringify(sample)).not.toMatch(/입력 예정|확인 필요|010-0000|00-0000/);
  });
});
