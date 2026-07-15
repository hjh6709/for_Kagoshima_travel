import { apiRequest } from "./auth";

export type ChecklistItemResponse = {
  id: string;
  category: "before" | "airport" | "daily" | "return";
  title: string;
  isCompleted: boolean;
  custom: boolean;
  destinationCountry?: string;
};

export function listChecklist(tripID: string, accessToken: string) {
  return apiRequest<ChecklistItemResponse[]>(`/api/trips/${tripID}/checklists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function createChecklistItem(
  tripID: string,
  accessToken: string,
  category: string,
  title: string
) {
  return apiRequest<ChecklistItemResponse>(`/api/trips/${tripID}/checklists`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ category, title }),
  });
}

export function updateChecklistItem(
  checklistID: string,
  accessToken: string,
  updates: { title?: string; isCompleted?: boolean }
) {
  return apiRequest<ChecklistItemResponse>(`/api/trips/checklists/${checklistID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });
}

export function deleteChecklistItem(checklistID: string, accessToken: string) {
  return apiRequest<void>(`/api/trips/checklists/${checklistID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
