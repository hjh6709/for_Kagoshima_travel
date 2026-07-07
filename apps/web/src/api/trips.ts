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

export function listTripPlaces(accessToken: string, tripID: string) {
  return apiRequest<SharedPlace[]>(`/api/trips/${tripID}/places`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function getSharedTrip(token: string) {
  return apiRequest<SharedTripResponse>(`/api/share/${encodeURIComponent(token)}`);
}
