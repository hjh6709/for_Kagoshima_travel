package model

import "time"

// ChecklistItem은 데이터베이스 checklists 테이블과 매핑되는 도메인 모델 구조체입니다.
// 각 여행(Trip)별 준비물 항목의 상태와 속성을 보관합니다.
type ChecklistItem struct {
	ID                 string    `db:"id"`                  // 준비물 항목의 고유 ID (UUID)
	TripID             string    `db:"trip_id"`             // 연결된 여행 ID (UUID)
	Category           string    `db:"category"`            // 준비물 분류 (before: 출발 전, airport: 공항에서, daily: 여행 중, return: 귀국 시)
	Title              string    `db:"title"`               // 준비물 명칭 (예: "여권", "돼지코")
	IsCompleted        bool      `db:"is_completed"`        // 준비 완료 여부 (체크박스 체크 상태)
	Custom             bool      `db:"custom"`              // 사용자가 직접 추가한 커스텀 항목인지 여부
	DestinationCountry string    `db:"destination_country"` // 프리셋의 경우 타겟 목적지 국가 코드 (JP, CN 등. 공통 항목은 빈 문자열)
	CreatedAt          time.Time `db:"created_at"`          // 항목 생성 시각
}
