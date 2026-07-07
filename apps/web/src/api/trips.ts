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
