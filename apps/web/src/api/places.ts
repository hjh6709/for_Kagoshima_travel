import { apiRequest } from "./auth";

export type CreatePlacePayload = {
  name: string;
  category: string;
  address?: string;
  googleMapsUrl?: string;
  recommendedReason?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  chineseName?: string;
  chineseAddress?: string;
  subwayExit?: string;
  taxiPhrase?: string;
  phone?: string;
};

export type UpdatePlacePayload = Partial<CreatePlacePayload>;

export type PlaceSearchResult = {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  chineseName?: string;
  chineseAddress?: string;
  subwayExit?: string;
  taxiPhrase?: string;
};

export type PlaceSearchSelection = Pick<PlaceSearchResult, "latitude" | "longitude" | "googlePlaceId">;

export type SharedPlace = {
  id: string;
  name: string;
  category: string;
  address?: string;
  googleMapsUrl?: string;
  recommendedReason?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  chineseName?: string;
  chineseAddress?: string;
  subwayExit?: string;
  taxiPhrase?: string;
  phone?: string;
};

export function listTripPlaces(accessToken: string, tripID: string) {
  return apiRequest<SharedPlace[]>(`/api/trips/${tripID}/places`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function searchTripPlaces(accessToken: string, tripID: string, query: string) {
  return apiRequest<PlaceSearchResult[]>(`/api/trips/${tripID}/places/search?q=${encodeURIComponent(query)}`, {
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

export function updateTripPlace(accessToken: string, tripID: string, placeID: string, payload: UpdatePlacePayload) {
  return apiRequest<SharedPlace>(`/api/trips/${tripID}/places/${placeID}`, {
    method: "PATCH",
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
