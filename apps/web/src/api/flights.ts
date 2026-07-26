import { apiRequest } from "./auth";

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

export type UpdateFlightPayload = Partial<CreateFlightPayload>;

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

export function updateTripFlight(
  accessToken: string,
  tripID: string,
  flightID: string,
  payload: UpdateFlightPayload
) {
  return apiRequest<SharedFlight>(`/api/trips/${tripID}/flights/${flightID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export function deleteTripFlight(accessToken: string, tripID: string, flightID: string) {
  return apiRequest<void>(`/api/trips/${tripID}/flights/${flightID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
