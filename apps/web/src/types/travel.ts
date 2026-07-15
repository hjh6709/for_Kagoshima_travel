export type ScheduleType = "move" | "meal" | "golf" | "sightseeing" | "hotel" | "shopping" | "etc";

export type PlaceCategory =
  | "hotel"
  | "meal"
  | "golf"
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
  destinationCountry?: string;
  memo?: string;
};

export type FlightInfo = {
  id: string;
  label: string;
  airline?: string;
  flightNumber?: string;
  date?: string;
  time?: string;
  memo?: string;
};

export type AccommodationInfo = {
  name: string;
  address: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  memo?: string;
};

export type UsefulPhrase = {
  id: string;
  situation: string;
  korean: string;
  japanese?: string;
  chinese?: string;
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
  guideMemo?: string;
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
  destinationCountry?: string;
  memo?: string;
};

export type EmergencyInfo = {
  id: string;
  title: string;
  description: string;
  phone?: string;
  address?: string;
};
