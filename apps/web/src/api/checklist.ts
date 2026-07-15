import { apiRequest } from "./auth";

// ChecklistItemResponse는 서버로부터 전달되는 준비물 데이터 모델의 타입 선언입니다.
export type ChecklistItemResponse = {
  id: string;                                          // 준비물 UUID
  category: "before" | "airport" | "daily" | "return"; // 준비물 노출 탭 분류
  title: string;                                       // 준비물 타이틀
  isCompleted: boolean;                                // 체크박스 완료 완료 여부
  custom: boolean;                                     // 사용자가 추가한 커스텀 준비물 유무
  destinationCountry?: string;                         // 타겟팅 목적지 국가 코드 (JP, CN 등)
};

// listChecklist는 특정 여행 ID의 전체 준비물 목록을 백엔드로부터 실시간으로 가져옵니다.
export function listChecklist(tripID: string, accessToken: string) {
  return apiRequest<ChecklistItemResponse[]>(`/api/trips/${tripID}/checklists`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// createChecklistItem은 수동으로 새로운 커스텀 준비물 항목을 서버 DB에 등록합니다.
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

// updateChecklistItem은 특정 준비물 항목의 완료 체크 여부(isCompleted) 또는 이름을 수정 반영합니다.
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

// deleteChecklistItem은 특정 준비물 항목을 서버 DB에서 완전히 제거합니다.
export function deleteChecklistItem(checklistID: string, accessToken: string) {
  return apiRequest<void>(`/api/trips/checklists/${checklistID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
