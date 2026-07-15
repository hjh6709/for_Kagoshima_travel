package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

// ChecklistHandler는 HTTP 요청을 받아 JSON 바디 디코딩 및 서비스 레이어 호출,
// 그리고 결과를 HTTP JSON으로 응답하는 컨트롤러 핸들러 구조체입니다.
type ChecklistHandler struct {
	checklistService *service.ChecklistService
}

// NewChecklistHandler는 ChecklistHandler의 새로운 생성자 인스턴스를 반환합니다.
func NewChecklistHandler(checklistService *service.ChecklistService) *ChecklistHandler {
	return &ChecklistHandler{checklistService: checklistService}
}

// ListChecklist는 특정 여행 ID의 전체 준비물 목록을 조회하여 JSON으로 반환하는 HTTP 핸들러입니다.
// GET /api/trips/{tripID}/checklists
func (h *ChecklistHandler) ListChecklist(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	tripID := r.PathValue("tripID")

	items, err := h.checklistService.ListChecklist(r.Context(), tripID, claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, items)
}

// CreateChecklistCustomItem은 사용자가 커스텀 준비물을 생성하는 요청을 받아 비즈니스 처리하는 HTTP 핸들러입니다.
// POST /api/trips/{tripID}/checklists
func (h *ChecklistHandler) CreateChecklistCustomItem(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	tripID := r.PathValue("tripID")

	var req dto.CreateChecklistItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	item, err := h.checklistService.CreateChecklistCustomItem(r.Context(), tripID, claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, item)
}

// UpdateChecklistItem은 기존 준비물 레코드의 정보를 부분 업데이트(PATCH)하는 HTTP 핸들러입니다.
// PATCH /api/trips/checklists/{checklistID}
func (h *ChecklistHandler) UpdateChecklistItem(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	checklistID := r.PathValue("checklistID")

	var req dto.UpdateChecklistItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	item, err := h.checklistService.UpdateChecklistItem(r.Context(), checklistID, claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, item)
}

// DeleteChecklistItem은 지정한 준비물 항목을 물리 삭제하는 HTTP 핸들러입니다.
// DELETE /api/trips/checklists/{checklistID}
func (h *ChecklistHandler) DeleteChecklistItem(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	checklistID := r.PathValue("checklistID")

	err := h.checklistService.DeleteChecklistItem(r.Context(), checklistID, claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
