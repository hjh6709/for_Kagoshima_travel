import type {
  AccommodationInfo,
  ChecklistItem,
  EmergencyInfo,
  ExpenseSummary,
  FlightInfo,
  Place,
  RecommendedRoute,
  ScheduleItem,
  Trip,
  UsefulPhrase,
} from "../types/travel";

export const trip: Trip = {
  title: "가고시마 부모님 여행",
  startDate: "2026-06-27",
  endDate: "2026-06-30",
  travelers: ["아버지", "어머니"],
  memo: "샘플 데이터입니다. 실제 항공편, 숙소, 예약 정보로 교체하세요.",
};

export const flights: FlightInfo[] = [
  {
    id: "flight-departure",
    label: "출국",
    airline: "항공사 입력 예정",
    flightNumber: "편명 입력 예정",
    date: "출발일 확인 필요",
    time: "출발 시간 확인 필요",
    memo: "공항 도착은 출발 2시간 전을 권장합니다.",
  },
  {
    id: "flight-return",
    label: "귀국",
    airline: "항공사 입력 예정",
    flightNumber: "편명 입력 예정",
    date: "귀국일 확인 필요",
    time: "출발 시간 확인 필요",
  },
];

export const accommodation: AccommodationInfo = {
  name: "숙소 이름 입력 예정",
  address: "가고시마 숙소 주소 입력 예정",
  phone: "+81-00-0000-0000",
  checkIn: "체크인 시간 확인 필요",
  checkOut: "체크아웃 시간 확인 필요",
  memo: "예약 확인서의 예약자명과 바우처 번호를 출발 전 다시 확인하세요.",
};

export const phrases: UsefulPhrase[] = [
  {
    id: "phrase-address",
    situation: "택시나 기사님께 목적지를 보여줄 때",
    korean: "이 주소까지 가주세요",
    japanese: "この住所までお願いします。",
  },
  {
    id: "phrase-help",
    situation: "도움이 필요할 때",
    korean: "도와주세요",
    japanese: "助けてください。",
  },
];

export const places: Place[] = [
  {
    id: "place-airport",
    name: "가고시마 공항",
    category: "transport",
    address: "822 Mizobecho Fumoto, Kirishima, Kagoshima 899-6404 Japan",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kagoshima%20Airport",
    recommendedReason: "입국과 귀국 기준 장소입니다.",
  },
  {
    id: "place-hotel",
    name: "숙소 이름 입력 예정",
    category: "hotel",
    address: "가고시마 숙소 주소 입력 예정",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kagoshima%20hotel",
    recommendedReason: "체크인, 휴식, 짐 보관 기준 장소입니다.",
  },
  {
    id: "place-golf",
    name: "골프장 이름 입력 예정",
    category: "golf",
    address: "가고시마 골프장 주소 입력 예정",
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Kagoshima%20golf%20course",
    recommendedReason: "라운딩 장소입니다. 티오프 시간과 클럽하우스 연락처를 확인하세요.",
    cautionMemo: "여권, 현금, 장갑, 골프화, 우비를 전날 밤에 확인하세요.",
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
    placeId: "place-airport",
    transportMemo: "공항에서 숙소까지 이동합니다. 렌터카/택시/버스 중 실제 이동수단을 확정하세요.",
    parentMemo: "도착 후 무리하지 말고 숙소 체크인부터 확인하세요.",
  },
  {
    id: "schedule-2",
    date: "2026-06-28",
    time: "오전",
    type: "golf",
    title: "골프 라운딩 1일차",
    placeId: "place-golf",
    transportMemo: "숙소에서 골프장까지 이동합니다. 출발 시간은 티오프 기준 최소 60분 여유를 두세요.",
    reservationMemo: "티오프 시간, 예약자명, 카트 포함 여부 확인 필요",
    parentMemo: "전날 밤 장갑, 골프화, 모자, 우비를 먼저 챙겨두세요.",
  },
  {
    id: "schedule-3",
    date: "2026-06-28",
    time: "저녁",
    type: "meal",
    title: "라운딩 후 저녁 식사",
    placeId: "place-kurobuta",
    parentMemo: "무리하지 말고 숙소 근처 식당 후보로 편하게 이동하세요.",
  },
  {
    id: "schedule-4",
    date: "2026-06-29",
    time: "오전",
    type: "golf",
    title: "골프 라운딩 2일차",
    placeId: "place-golf",
    transportMemo: "숙소에서 골프장까지 다시 이동합니다. 전날과 다른 골프장이라면 장소를 교체하세요.",
    reservationMemo: "티오프 시간과 예약자명 확인 필요",
    parentMemo: "컨디션을 보고 라운딩 후 일정은 가볍게 조정하세요.",
  },
  {
    id: "schedule-5",
    date: "2026-06-30",
    time: "오전",
    type: "hotel",
    title: "체크아웃",
    placeId: "place-hotel",
    transportMemo: "체크아웃 후 공항으로 이동합니다.",
    parentMemo: "여권, 지갑, 휴대폰, 충전기, 골프용품을 다시 확인하세요.",
  },
  {
    id: "schedule-6",
    date: "2026-06-30",
    time: "출국 전",
    type: "move",
    title: "공항 이동과 귀국",
    placeId: "place-airport",
    transportMemo: "항공편 출발 시간 기준 최소 2시간 전 공항 도착을 권장합니다.",
    parentMemo: "공항에서 식사와 선물 구매 시간을 여유 있게 잡으세요.",
  },
];

export const routes: RecommendedRoute[] = [
  {
    id: "route-1",
    title: "공항에서 숙소까지 기본 이동",
    description: "도착 후 바로 숙소로 이동해 체크인과 짐 정리를 먼저 하는 루트입니다.",
    placeIds: ["place-airport", "place-hotel"],
    transportMemo: "렌터카/택시/버스 중 실제 이동수단 확정 후 업데이트합니다.",
    estimatedDuration: "도착 당일",
  },
  {
    id: "route-2",
    title: "숙소에서 골프장 왕복 루트",
    description: "라운딩 당일 가장 자주 눌러야 하는 이동 루트입니다.",
    placeIds: ["place-hotel", "place-golf"],
    transportMemo: "출발 시간과 골프장 주차/클럽하우스 위치를 확인하세요.",
    estimatedDuration: "라운딩 당일",
  },
];

export const expenseSummaries: ExpenseSummary[] = [
  {
    id: "expense-meals-transport",
    label: "식비·교통비 예상 경비",
    currency: "JPY",
    amount: 42000,
    note: "식당, 편의점, 택시 등 현지에서 바로 확인할 기준 금액입니다.",
    updatedAt: "2026-06-24T21:10:00+09:00",
  },
  {
    id: "expense-emergency",
    label: "비상 예비 경비",
    currency: "JPY",
    amount: 10000,
    note: "예상보다 이동비나 식비가 늘어날 때 쓰는 예비 금액입니다.",
    updatedAt: "2026-06-24T21:10:00+09:00",
  },
  {
    id: "expense-krw",
    label: "국내 정산 참고 금액",
    currency: "KRW",
    amount: 120000,
    note: "귀국 후 정산이나 비상 연락 시 참고하는 금액입니다.",
    updatedAt: "2026-06-24T21:10:00+09:00",
  },
];

export const checklist: ChecklistItem[] = [
  { id: "check-passport", category: "before", title: "여권" },
  { id: "check-esim", category: "before", title: "로밍 또는 eSIM 확인" },
  { id: "check-battery", category: "before", title: "보조배터리" },
  { id: "check-golf-shoes", category: "before", title: "골프화와 장갑" },
  { id: "check-golf-rain", category: "before", title: "우비 또는 바람막이" },
  { id: "check-ticket", category: "airport", title: "항공권과 여권 확인" },
  { id: "check-tee-time", category: "daily", title: "티오프 시간 확인" },
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
