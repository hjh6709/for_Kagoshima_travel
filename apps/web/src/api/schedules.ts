import { apiRequest } from "./auth";

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
