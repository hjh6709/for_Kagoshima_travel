package repository

import "github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"

// ChecklistRepository는 준비물(Checklist) 리소스의 데이터베이스 조작을 담당하는 리포지토리 인터페이스입니다.
// 이 인터페이스는 pgx 기반 PostgreSQL 연동 및 테스트 전용 in-memory DB 구현체에서 공통 구현합니다.
type ChecklistRepository interface {
	Save(item model.ChecklistItem) error                     // 개별 준비물 항목을 신규 등록합니다.
	SaveAll(items []model.ChecklistItem) error               // 여러 개의 준비물 프리셋 항목을 한 번에 벌크 삽입(bulk insert)합니다.
	FindChecklist(id string) (model.ChecklistItem, error)    // ID에 매칭되는 단일 준비물 데이터를 찾아 조회합니다.
	FindByTrip(tripID string) ([]model.ChecklistItem, error) // 특정 여행 ID에 연결되어 등록된 모든 준비물 목록을 조회합니다.
	Update(item model.ChecklistItem) error                   // 준비물 데이터의 정보(완료 여부, 타이틀 등)를 업데이트합니다.
	Delete(id string) error                                  // 특정 ID의 준비물 데이터를 삭제합니다.
}
