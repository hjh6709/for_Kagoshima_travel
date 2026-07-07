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

export type ShareLinkResponse = {
  token: string;
  apiPath: string;
  webPath: string;
  expiresAt?: string;
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
