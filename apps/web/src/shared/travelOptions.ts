import type { ChecklistItem, PlaceCategory, ScheduleItem } from "../types/travel";

export const scheduleTypeLabels: Record<ScheduleItem["type"], string> = {
  move: "이동",
  meal: "식사",
  golf: "골프",
  sightseeing: "관광",
  hotel: "숙소",
  shopping: "쇼핑",
  etc: "기타",
};

export const scheduleTypeOptions = Object.entries(scheduleTypeLabels) as Array<[ScheduleItem["type"], string]>;

export function getScheduleTypeLabel(type: string) {
  return scheduleTypeLabels[type as ScheduleItem["type"]] ?? "일정";
}

export const placeCategoryLabels = {
  hotel: "숙소",
  meal: "식사",
  golf: "골프",
  cafe: "카페",
  sightseeing: "관광",
  shopping: "쇼핑",
  transport: "이동",
  etc: "기타",
} as const;

export const placeCategoryOptions = Object.entries(placeCategoryLabels) as Array<[PlaceCategory, string]>;

export const flightDirectionLabels = {
  departure: "출국",
  return: "입국",
  domestic: "국내 이동",
  etc: "기타",
} as const;

export type FlightDirection = keyof typeof flightDirectionLabels;

export const flightDirectionOptions = Object.entries(flightDirectionLabels) as Array<[FlightDirection, string]>;

export function getFlightDirectionLabel(direction: string) {
  return flightDirectionLabels[direction as FlightDirection] ?? "항공";
}

export const checklistCategoryLabels = {
  before: "출발 전",
  airport: "공항",
  daily: "여행 중",
  return: "입국 전",
} as const;

export const checklistCategories = Object.entries(checklistCategoryLabels) as Array<[ChecklistItem["category"], string]>;

export const translationLinks = [
  {
    id: "google-translate",
    label: "Google 번역 열기",
    href: "https://translate.google.com/?sl=auto&tl=ja&op=translate",
  },
  {
    id: "papago",
    label: "Papago 열기",
    href: "https://papago.naver.com/",
  },
] as const;
