import type { ChecklistItemResponse } from "../../api/checklist";
import type { SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import { getFlightDirectionLabel } from "../../shared/travelOptions";
import type {
  AccommodationInfo,
  ChecklistItem,
  FlightInfo,
  Place,
  PlaceCategory,
  ScheduleItem,
  ScheduleType,
} from "../../types/travel";
import type { ScheduleOrderByDate } from "./tripViewState";
import type { TripDates } from "../../shared/date";

// --- API 응답 -> 탭 UI가 쓰는 타입으로 변환 (전부 순수 함수) ---

export function mapOwnerFlight(flight: SharedFlight): FlightInfo {
  return {
    id: flight.id,
    label: getFlightDirectionLabel(flight.direction),
    airline: flight.airline,
    flightNumber: flight.flightNumber,
    date: flight.departureDate,
    time: flight.departureTime,
    memo: flight.memo,
  };
}

export function mapOwnerPlace(place: SharedPlace): Place {
  return {
    id: place.id,
    name: place.name,
    category: place.category as PlaceCategory,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    googleMapsUrl: place.googleMapsUrl,
    recommendedReason: place.recommendedReason,
  };
}

export function mapOwnerSchedule(schedule: SharedSchedule): ScheduleItem {
  return {
    id: schedule.id,
    date: schedule.date,
    time: schedule.time,
    type: schedule.type as ScheduleType,
    title: schedule.title,
    placeId: schedule.placeId,
    transportMemo: schedule.transportMemo,
    guideMemo: schedule.guideMemo,
  };
}

export function mapOwnerChecklistItem(item: ChecklistItemResponse): ChecklistItem {
  return {
    id: item.id,
    category: item.category,
    title: item.title,
    destinationCountry: item.destinationCountry,
  };
}

// 숙소 정보는 별도 API가 없고, category가 "hotel"인 장소에서 이름/주소만 가져온다.
// 체크인/체크아웃/전화번호는 백엔드 스키마에 없는 필드라 안내 문구로 대체한다(기존 샘플 데이터와 동일한 관례).
export function deriveAccommodation(places: Place[]): AccommodationInfo {
  const hotel = places.find((place) => place.category === "hotel");
  if (!hotel) {
    return {
      name: "숙소 정보 미입력",
      address: "장소 관리에서 숙소를 등록하면 여기에 표시됩니다.",
      checkIn: "체크인 시간 확인 필요",
      checkOut: "체크아웃 시간 확인 필요",
    };
  }
  return {
    name: hotel.name,
    address: hotel.address || "숙소 주소 미입력",
    checkIn: "체크인 시간 확인 필요",
    checkOut: "체크아웃 시간 확인 필요",
    memo: hotel.recommendedReason,
  };
}

export function getOwnerPlaceById(placeId: string | undefined, places: Place[]): Place | undefined {
  return places.find((place) => place.id === placeId);
}

export function getOwnerSchedulesForDate(
  date: string,
  schedules: ScheduleItem[],
  orderByDate: ScheduleOrderByDate
): ScheduleItem[] {
  const baseSchedules = schedules.filter((item) => item.date === date);
  const order = orderByDate[date];
  if (!order) return baseSchedules;

  const orderIndex = new Map(order.map((id, index) => [id, index]));
  return [...baseSchedules].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

// --- 여행별(namespaced) 로컬 개인 설정 저장소 ---
// 실제 여행 데이터(DB)는 건드리지 않는, 이 브라우저에서만 보이는 표시용 조정값이다.
// /demo가 쓰는 tripViewState.ts의 저장 키와 절대 겹치지 않도록 트립 ID를 접두어로 넣는다.

function isDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function getSavedOwnerTripDates(tripId: string, fallback: TripDates): TripDates {
  const saved = window.localStorage.getItem(`owner-trip-${tripId}-dates`);
  try {
    const parsed = saved ? JSON.parse(saved) : fallback;
    return isDateValue(parsed?.startDate) && isDateValue(parsed?.endDate) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveOwnerTripDates(tripId: string, dates: TripDates) {
  window.localStorage.setItem(`owner-trip-${tripId}-dates`, JSON.stringify(dates));
}

export function getSavedOwnerScheduleCompletions(tripId: string): Record<string, boolean> {
  const saved = window.localStorage.getItem(`owner-trip-${tripId}-schedule-completions`);
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === "boolean")
    );
  } catch {
    return {};
  }
}

export function saveOwnerScheduleCompletions(tripId: string, completions: Record<string, boolean>) {
  window.localStorage.setItem(`owner-trip-${tripId}-schedule-completions`, JSON.stringify(completions));
}

export function getSavedOwnerScheduleOrder(tripId: string): ScheduleOrderByDate {
  const saved = window.localStorage.getItem(`owner-trip-${tripId}-schedule-order`);
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string[]] => Array.isArray(entry[1]))
    );
  } catch {
    return {};
  }
}

export function saveOwnerScheduleOrder(tripId: string, orderByDate: ScheduleOrderByDate) {
  window.localStorage.setItem(`owner-trip-${tripId}-schedule-order`, JSON.stringify(orderByDate));
}
