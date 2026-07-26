import type { ChecklistItem, PlaceCategory, ScheduleItem } from "../types/travel";

export const destinationCountryOptions = [
  ["KR", "대한민국"],
  ["JP", "일본"],
  ["CN", "중국"],
  ["TW", "대만"],
  ["HK", "홍콩"],
  ["SG", "싱가포르"],
  ["TH", "태국"],
  ["VN", "베트남"],
  ["PH", "필리핀"],
  ["ID", "인도네시아"],
  ["MY", "말레이시아"],
  ["US", "미국"],
  ["CA", "캐나다"],
  ["MX", "멕시코"],
  ["GB", "영국"],
  ["FR", "프랑스"],
  ["DE", "독일"],
  ["IT", "이탈리아"],
  ["ES", "스페인"],
  ["PT", "포르투갈"],
  ["NL", "네덜란드"],
  ["BE", "벨기에"],
  ["CH", "스위스"],
  ["AT", "오스트리아"],
  ["CZ", "체코"],
  ["HU", "헝가리"],
  ["GR", "그리스"],
  ["TR", "튀르키예"],
  ["AU", "호주"],
  ["NZ", "뉴질랜드"],
  ["AE", "아랍에미리트"],
  ["OTHER", "기타 국가·지역"],
] as const;

export function getDestinationCountryLabel(countryCode?: string) {
  return destinationCountryOptions.find(([code]) => code === countryCode)?.[1] ?? countryCode ?? "목적지";
}

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
    href: "https://translate.google.com/?sl=auto&op=translate",
  },
  {
    id: "papago",
    label: "Papago 열기",
    href: "https://papago.naver.com/",
  },
] as const;
