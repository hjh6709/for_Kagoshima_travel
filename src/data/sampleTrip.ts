import type {
  ChecklistItem,
  EmergencyInfo,
  Place,
  RecommendedRoute,
  ScheduleItem,
  Trip,
} from "../types/travel";

export const trip: Trip = {
  title: "가고시마 부모님 여행",
  startDate: "2026-06-27",
  endDate: "2026-06-30",
  travelers: ["아버지", "어머니"],
  memo: "샘플 데이터입니다. 실제 항공편, 숙소, 예약 정보로 교체하세요.",
};

export const places: Place[] = [
  {
    id: "place-hotel",
    name: "숙소 이름 입력 예정",
    category: "hotel",
    address: "가고시마 숙소 주소 입력 예정",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kagoshima%20hotel",
    recommendedReason: "체크인, 휴식, 짐 보관 기준 장소입니다.",
  },
  {
    id: "place-senganen",
    name: "센간엔",
    category: "sightseeing",
    address: "9700-1 Yoshinocho, Kagoshima, 892-0871 Japan",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sengan-en%20Kagoshima",
    recommendedReason: "사쿠라지마를 배경으로 볼 수 있는 대표 정원입니다.",
    cautionMemo: "도보 이동이 있을 수 있어 편한 신발을 준비하세요.",
  },
  {
    id: "place-kurobuta",
    name: "흑돼지 맛집 후보",
    category: "meal",
    address: "가고시마 흑돼지 식당 후보 입력 예정",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kagoshima%20kurobuta%20restaurant",
    recommendedReason: "가고시마 대표 음식인 흑돼지를 먹는 후보 장소입니다.",
    budgetMemo: "1인 예산 확인 필요",
  },
];

export const schedules: ScheduleItem[] = [
  {
    id: "schedule-1",
    date: "2026-06-27",
    time: "오전",
    type: "move",
    title: "가고시마 도착",
    placeId: "place-hotel",
    transportMemo: "공항에서 숙소 이동 방법을 확정해야 합니다.",
    parentMemo: "도착 후 무리하지 말고 숙소 체크인부터 확인하세요.",
  },
  {
    id: "schedule-2",
    date: "2026-06-28",
    time: "10:30",
    type: "sightseeing",
    title: "센간엔 관광",
    placeId: "place-senganen",
    transportMemo: "숙소 기준 이동 경로 확인 필요",
    parentMemo: "입장권과 운영시간은 출발 전 다시 확인하세요.",
  },
  {
    id: "schedule-3",
    date: "2026-06-28",
    time: "13:00",
    type: "meal",
    title: "점심 식사",
    placeId: "place-kurobuta",
    parentMemo: "대기 시간이 길면 근처 후보 식당으로 변경하세요.",
  },
];

export const routes: RecommendedRoute[] = [
  {
    id: "route-1",
    title: "둘째 날 천천히 관광 루트",
    description: "센간엔을 보고 흑돼지 점심을 먹는 여유 일정입니다.",
    placeIds: ["place-senganen", "place-kurobuta"],
    transportMemo: "각 장소 사이 이동 시간은 실제 숙소 위치 확정 후 업데이트합니다.",
    estimatedDuration: "반나절",
  },
];

export const checklist: ChecklistItem[] = [
  { id: "check-passport", category: "before", title: "여권" },
  { id: "check-esim", category: "before", title: "로밍 또는 eSIM 확인" },
  { id: "check-battery", category: "before", title: "보조배터리" },
  { id: "check-ticket", category: "airport", title: "항공권과 여권 확인" },
  { id: "check-medicine", category: "daily", title: "상비약 챙기기" },
  { id: "check-souvenir", category: "return", title: "귀국 전 짐과 선물 확인" },
];

export const emergencies: EmergencyInfo[] = [
  {
    id: "emergency-family",
    title: "가족 연락",
    description: "문제가 생기면 가장 먼저 가족에게 연락하세요.",
    phone: "010-0000-0000",
  },
  {
    id: "emergency-hotel",
    title: "숙소 연락",
    description: "숙소 이름과 전화번호를 실제 정보로 교체하세요.",
    phone: "+81-00-0000-0000",
    address: "가고시마 숙소 주소 입력 예정",
  },
  {
    id: "emergency-passport",
    title: "여권 분실",
    description: "가족에게 연락한 뒤 가까운 경찰서와 영사관 안내를 확인하세요.",
  },
];

