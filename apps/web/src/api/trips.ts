import { apiRequest } from "./auth";
import type { ChecklistItemResponse } from "./checklist";
import type { SharedFlight } from "./flights";
import type { SharedPlace } from "./places";
import type { SharedSchedule } from "./schedules";

export type OwnerTrip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  destinationCountry: string;
  memo?: string;
};

export type CreateTripPayload = {
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  destinationCountry?: string;
  memo?: string;
};

export type UpdateTripPayload = Partial<CreateTripPayload>;

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
  destinationCountry: string;
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
  checklist: ChecklistItemResponse[];
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

export function deleteTrip(accessToken: string, tripID: string) {
  return apiRequest<void>(`/api/trips/${tripID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
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

export function getSharedTrip(token: string) {
  return apiRequest<SharedTripResponse>(`/api/share/${encodeURIComponent(token)}`);
}

// Re-export sub-module API functions and types for backwards compatibility
export * from "./places";
export * from "./schedules";
export * from "./flights";
