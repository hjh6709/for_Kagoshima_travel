import { places, schedules, trip } from "../../data/sampleTrip";
import type { TripDates } from "../../shared/date";
import { checklistCategoryLabels } from "../../shared/travelOptions";
import type { ChecklistItem } from "../../types/travel";

export type Tab = "today" | "schedule" | "flight" | "map" | "concierge" | "mypage";
export type ChecklistCategory = ChecklistItem["category"];
export type CustomChecklistItem = ChecklistItem & { custom: true };
export type ScheduleOrderByDate = Record<string, string[]>;

const tripStorageKeys = {
  tripDates: "kagoshima-trip-dates",
  checklistCompletions: "kagoshima-checklist",
  customChecklist: "kagoshima-custom-checklist",
  hiddenChecklist: "kagoshima-hidden-checklist",
  scheduleCompletions: "kagoshima-schedule-completions",
  scheduleOrder: "kagoshima-schedule-order",
} as const;

export function getPlace(placeId?: string) {
  return places.find((place) => place.id === placeId);
}

export function getMapUrl(place?: ReturnType<typeof getPlace>) {
  const destination = place?.latitude && place?.longitude
    ? `${place.latitude},${place.longitude}`
    : (place?.address || place?.name || "여행지");
  return `https://www.google.com/maps/dir/?api=1&origin=current+location&destination=${encodeURIComponent(destination)}`;
}

function isDateValue(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isChecklistCategory(value: unknown): value is ChecklistCategory {
  return typeof value === "string" && value in checklistCategoryLabels;
}

export function isCustomChecklistItem(item: ChecklistItem): item is CustomChecklistItem {
  return "custom" in item && item.custom === true;
}

// 여행 화면의 로컬 편집 상태는 저장소 값이 깨져도 샘플 데이터 기준으로 안전하게 복구한다.
export function getSavedTripDates(): TripDates {
  const fallback = { startDate: trip.startDate, endDate: trip.endDate };
  const saved = window.localStorage.getItem(tripStorageKeys.tripDates);
  try {
    const parsed = saved ? JSON.parse(saved) : fallback;
    return isDateValue(parsed.startDate) && isDateValue(parsed.endDate) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getSavedCustomChecklist(): CustomChecklistItem[] {
  const saved = window.localStorage.getItem(tripStorageKeys.customChecklist);
  try {
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CustomChecklistItem => {
      return (
        typeof item?.id === "string" &&
        isChecklistCategory(item.category) &&
        typeof item.title === "string" &&
        item.title.trim().length > 0 &&
        item.custom === true
      );
    });
  } catch {
    return [];
  }
}

export function getSavedChecklistCompletions(): Record<string, boolean> {
  const saved = window.localStorage.getItem(tripStorageKeys.checklistCompletions);
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => {
        const [id, completed] = entry;
        return typeof id === "string" && typeof completed === "boolean";
      })
    );
  } catch {
    return {};
  }
}

export function getSavedHiddenChecklistIDs(): string[] {
  const saved = window.localStorage.getItem(tripStorageKeys.hiddenChecklist);
  try {
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function getSavedScheduleCompletions(): Record<string, boolean> {
  const saved = window.localStorage.getItem(tripStorageKeys.scheduleCompletions);
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, boolean] => {
        const [id, completed] = entry;
        return typeof id === "string" && typeof completed === "boolean";
      })
    );
  } catch {
    return {};
  }
}

export function getSavedScheduleOrder(): ScheduleOrderByDate {
  const saved = window.localStorage.getItem(tripStorageKeys.scheduleOrder);
  try {
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string[]] => {
        const [date, ids] = entry;
        return isDateValue(date) && Array.isArray(ids) && ids.every((id) => typeof id === "string");
      })
    );
  } catch {
    return {};
  }
}

// 여행 화면의 로컬 상태 저장은 이 파일을 통해서만 수행해 storage key가 화면 컴포넌트로 퍼지지 않게 한다.
export function saveTripDates(dates: TripDates) {
  window.localStorage.setItem(tripStorageKeys.tripDates, JSON.stringify(dates));
}

export function saveChecklistCompletions(completions: Record<string, boolean>) {
  window.localStorage.setItem(tripStorageKeys.checklistCompletions, JSON.stringify(completions));
}

export function saveCustomChecklistItems(items: CustomChecklistItem[]) {
  window.localStorage.setItem(tripStorageKeys.customChecklist, JSON.stringify(items));
}

export function saveHiddenChecklistIDs(ids: string[]) {
  window.localStorage.setItem(tripStorageKeys.hiddenChecklist, JSON.stringify(ids));
}

export function saveScheduleCompletions(completions: Record<string, boolean>) {
  window.localStorage.setItem(tripStorageKeys.scheduleCompletions, JSON.stringify(completions));
}

export function saveScheduleOrder(orderByDate: ScheduleOrderByDate) {
  window.localStorage.setItem(tripStorageKeys.scheduleOrder, JSON.stringify(orderByDate));
}

export function getOrderedSchedulesForDate(date: string, orderByDate: ScheduleOrderByDate) {
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
