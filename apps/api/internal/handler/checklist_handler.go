package handler

import (
	"encoding/json"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

type ChecklistHandler struct {
	checklistService *service.ChecklistService
}

func NewChecklistHandler(checklistService *service.ChecklistService) *ChecklistHandler {
	return &ChecklistHandler{checklistService: checklistService}
}

func (h *ChecklistHandler) ListChecklist(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	tripID := r.PathValue("tripID")

	items, err := h.checklistService.ListChecklist(tripID, claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, items)
}

func (h *ChecklistHandler) CreateChecklistCustomItem(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	tripID := r.PathValue("tripID")

	var req dto.CreateChecklistItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	item, err := h.checklistService.CreateChecklistCustomItem(tripID, claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, item)
}

func (h *ChecklistHandler) UpdateChecklistItem(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	checklistID := r.PathValue("checklistID")

	var req dto.UpdateChecklistItemRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}

	item, err := h.checklistService.UpdateChecklistItem(checklistID, claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, item)
}

func (h *ChecklistHandler) DeleteChecklistItem(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	checklistID := r.PathValue("checklistID")

	err := h.checklistService.DeleteChecklistItem(checklistID, claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
