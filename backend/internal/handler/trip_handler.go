package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/httpjson"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/service"
)

type TripHandler struct {
	tripService *service.TripService
}

func NewTripHandler(tripService *service.TripService) *TripHandler {
	return &TripHandler{tripService: tripService}
}

func (h *TripHandler) GetTrip(w http.ResponseWriter, r *http.Request) {
	trip, err := h.tripService.GetTrip(r.PathValue("tripID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, trip)
}

func (h *TripHandler) ListMyTrips(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	trips, err := h.tripService.ListMyTrips(claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, trips)
}

func (h *TripHandler) CreateTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreateTripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}
	trip, err := h.tripService.CreateTrip(claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, trip)
}

func (h *TripHandler) UpdateTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.UpdateTripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}
	trip, err := h.tripService.UpdateTrip(r.PathValue("tripID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, trip)
}

func (h *TripHandler) DeleteTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if err := h.tripService.DeleteTrip(r.PathValue("tripID"), claims.UserID); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TripHandler) ListSchedules(w http.ResponseWriter, r *http.Request) {
	schedules, err := h.tripService.ListSchedules(r.PathValue("tripID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, schedules)
}

func (h *TripHandler) ListPlaces(w http.ResponseWriter, r *http.Request) {
	places, err := h.tripService.ListPlaces(r.PathValue("tripID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, places)
}

func (h *TripHandler) ListRoutes(w http.ResponseWriter, r *http.Request) {
	routes, err := h.tripService.ListRoutes(r.PathValue("tripID"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, routes)
}

func writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrTripNotFound):
		httpjson.WriteError(w, http.StatusNotFound, "여행을 찾을 수 없습니다.")
	case errors.Is(err, service.ErrForbidden):
		httpjson.WriteError(w, http.StatusForbidden, "권한이 없습니다.")
	case errors.Is(err, service.ErrInvalidTrip):
		httpjson.WriteError(w, http.StatusBadRequest, "필수 항목이 누락됐습니다.")
	default:
		httpjson.WriteError(w, http.StatusInternalServerError, "서버 오류가 발생했습니다.")
	}
}
