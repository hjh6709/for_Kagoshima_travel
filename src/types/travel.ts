export type ScheduleType = "move" | "meal" | "sightseeing" | "hotel" | "shopping" | "etc";

export type PlaceCategory =
  | "hotel"
  | "meal"
  | "cafe"
  | "sightseeing"
  | "shopping"
  | "transport"
  | "etc";

export type Trip = {
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  memo?: string;
};

export type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  type: ScheduleType;
  title: string;
  placeId?: string;
  transportMemo?: string;
  reservationMemo?: string;
  parentMemo?: string;
};

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  address?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  recommendedReason?: string;
  openingMemo?: string;
  budgetMemo?: string;
  cautionMemo?: string;
};

export type RecommendedRoute = {
  id: string;
  title: string;
  description?: string;
  placeIds: string[];
  transportMemo?: string;
  estimatedDuration?: string;
};

export type ChecklistItem = {
  id: string;
  category: "before" | "airport" | "daily" | "return";
  title: string;
  memo?: string;
};

export type EmergencyInfo = {
  id: string;
  title: string;
  description: string;
  phone?: string;
  address?: string;
};

