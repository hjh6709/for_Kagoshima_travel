package dto

// ChecklistItemResponse는 클라이언트로 전달되는 체크리스트 항목의 응답 DTO 규격입니다.
type ChecklistItemResponse struct {
	ID                 string `json:"id"`                           // 준비물 고유 ID
	Category           string `json:"category"`                     // 분류 카테고리
	Title              string `json:"title"`                        // 준비물 타이틀
	IsCompleted        bool   `json:"isCompleted"`                  // 완료 체크 여부
	Custom             bool   `json:"custom"`                       // 커스텀 생성 여부
	DestinationCountry string `json:"destinationCountry,omitempty"` // 목적지 국가 코드 (프리셋 전용 필드)
}

// CreateChecklistItemRequest는 소유자가 수동으로 커스텀 준비물을 생성할 때 전송하는 요청 바디 DTO입니다.
type CreateChecklistItemRequest struct {
	Category string `json:"category"` // 추가할 카테고리 (before, airport, daily, return)
	Title    string `json:"title"`    // 추가할 준비물 이름
}

// UpdateChecklistItemRequest는 기존 체크리스트 항목의 완료 여부나 타이틀을 수정할 때 사용하는 요청 DTO입니다.
// 수정 요청 시 누락된 필드는 업데이트에서 배제하기 위해 포인터 타입을 활용합니다.
type UpdateChecklistItemRequest struct {
	Title       *string `json:"title,omitempty"`       // 변경할 타이틀 (선택 사항)
	IsCompleted *bool   `json:"isCompleted,omitempty"` // 변경할 체크 상태 (선택 사항)
}
