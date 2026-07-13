import { apiRequest } from "./auth";

export type OwnerTrip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  memo?: string;
};

export type CreateTripPayload = {
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  memo?: string;
};

export type UpdateTripPayload = Partial<CreateTripPayload>;

export type CreateSchedulePayload = {
  placeId?: string;
  date: string;
  time: string;
  type: string;
  title: string;
  transportMemo?: string;
  guideMemo?: string;
};

export type UpdateSchedulePayload = Partial<CreateSchedulePayload>;

export type CreatePlacePayload = {
  name: string;
  category: string;
  address?: string;
  googleMapsUrl?: string;
  recommendedReason?: string;
};

export type CreateFlightPayload = {
  direction: string;
  label: string;
  airline?: string;
  flightNumber?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  departureTime: string;
  arrivalDate?: string;
  arrivalTime?: string;
  memo?: string;
};

export type ShareLinkResponse = {
  token: string;
  apiPath: string;
  webPath: string;
  expiresAt?: string;
};

export type PublicTrip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
};

export type SharedSchedule = {
  id: string;
  placeId?: string;
  date: string;
  time: string;
  type: string;
  title: string;
  transportMemo?: string;
  guideMemo?: string;
};

export type SharedPlace = {
  id: string;
  name: string;
  category: string;
  address?: string;
  googleMapsUrl?: string;
  recommendedReason?: string;
};

export type SharedFlight = {
  id: string;
  direction: string;
  label: string;
  airline?: string;
  flightNumber?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDate: string;
  departureTime: string;
  arrivalDate?: string;
  arrivalTime?: string;
  memo?: string;
};

export type SharedRoute = {
  id: string;
  title: string;
  description?: string;
  placeIds: string[];
  transportMemo?: string;
  estimatedDuration?: string;
};

export type SharedTripResponse = {
  trip: PublicTrip;
  schedules: SharedSchedule[];
  places: SharedPlace[];
  flights: SharedFlight[];
  routes: SharedRoute[];
};

export function listMyTrips(accessToken: string) {
  return apiRequest<OwnerTrip[]>("/api/trips", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createTrip(accessToken: string, payload: CreateTripPayload) {
  return apiRequest<OwnerTrip>("/api/trips", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function updateTrip(accessToken: string, tripID: string, payload: UpdateTripPayload) {
  return apiRequest<OwnerTrip>(`/api/trips/${tripID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function createShareLink(accessToken: string, tripID: string) {
  return apiRequest<ShareLinkResponse>(`/api/trips/${tripID}/share`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function listTripSchedules(accessToken: string, tripID: string) {
  return apiRequest<SharedSchedule[]>(`/api/trips/${tripID}/schedules`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createTripSchedule(accessToken: string, tripID: string, payload: CreateSchedulePayload) {
  return apiRequest<SharedSchedule>(`/api/trips/${tripID}/schedules`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function updateTripSchedule(
  accessToken: string,
  tripID: string,
  scheduleID: string,
  payload: UpdateSchedulePayload
) {
  return apiRequest<SharedSchedule>(`/api/trips/${tripID}/schedules/${scheduleID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function deleteTripSchedule(accessToken: string, tripID: string, scheduleID: string) {
  return apiRequest<void>(`/api/trips/${tripID}/schedules/${scheduleID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function listTripPlaces(accessToken: string, tripID: string) {
  return apiRequest<SharedPlace[]>(`/api/trips/${tripID}/places`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createTripPlace(accessToken: string, tripID: string, payload: CreatePlacePayload) {
  return apiRequest<SharedPlace>(`/api/trips/${tripID}/places`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function deleteTripPlace(accessToken: string, tripID: string, placeID: string) {
  return apiRequest<void>(`/api/trips/${tripID}/places/${placeID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function listTripFlights(accessToken: string, tripID: string) {
  return apiRequest<SharedFlight[]>(`/api/trips/${tripID}/flights`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createTripFlight(accessToken: string, tripID: string, payload: CreateFlightPayload) {
  return apiRequest<SharedFlight>(`/api/trips/${tripID}/flights`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function getSharedTrip(token: string) {
  return apiRequest<SharedTripResponse>(`/api/share/${encodeURIComponent(token)}`);
}
