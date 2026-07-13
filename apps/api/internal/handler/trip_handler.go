package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/httpjson"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

type TripHandler struct {
	tripService *service.TripService
}

func NewTripHandler(tripService *service.TripService) *TripHandler {
	return &TripHandler{tripService: tripService}
}

func (h *TripHandler) GetTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	trip, err := h.tripService.GetOwnedTrip(r.PathValue("tripID"), claims.UserID)
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

func (h *TripHandler) CreateShareLink(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	link, err := h.tripService.CreateShareLink(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, link)
}

func (h *TripHandler) GetSharedTrip(w http.ResponseWriter, r *http.Request) {
	sharedTrip, err := h.tripService.GetSharedTrip(r.PathValue("token"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, sharedTrip)
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
	claims := middleware.GetClaims(r)
	schedules, err := h.tripService.ListSchedulesForOwner(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, schedules)
}

func (h *TripHandler) CreateSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreateScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}
	schedule, err := h.tripService.CreateSchedule(r.PathValue("tripID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, schedule)
}

// UpdateSchedule은 여행 소유자가 선택한 일정 일부 필드를 수정할 때 사용한다.
func (h *TripHandler) UpdateSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.UpdateScheduleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}
	schedule, err := h.tripService.UpdateSchedule(r.PathValue("tripID"), r.PathValue("scheduleID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, schedule)
}

func (h *TripHandler) DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if err := h.tripService.DeleteSchedule(r.PathValue("tripID"), r.PathValue("scheduleID"), claims.UserID); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TripHandler) ListPlaces(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	places, err := h.tripService.ListPlacesForOwner(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, places)
}

func (h *TripHandler) CreatePlace(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreatePlaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}
	place, err := h.tripService.CreatePlace(r.PathValue("tripID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, place)
}

// UpdatePlace는 여행 소유자가 선택한 장소 일부 필드를 수정할 때 사용한다.
func (h *TripHandler) UpdatePlace(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.UpdatePlaceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}
	place, err := h.tripService.UpdatePlace(r.PathValue("tripID"), r.PathValue("placeID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, place)
}

func (h *TripHandler) DeletePlace(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if err := h.tripService.DeletePlace(r.PathValue("tripID"), r.PathValue("placeID"), claims.UserID); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TripHandler) ListFlights(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	flights, err := h.tripService.ListFlightsForOwner(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, flights)
}

func (h *TripHandler) CreateFlight(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreateFlightRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpjson.WriteError(w, http.StatusBadRequest, "요청 형식이 올바르지 않습니다.")
		return
	}
	flight, err := h.tripService.CreateFlight(r.PathValue("tripID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, flight)
}

func (h *TripHandler) ListRoutes(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	routes, err := h.tripService.ListRoutesForOwner(r.PathValue("tripID"), claims.UserID)
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
	case errors.Is(err, service.ErrShareNotFound):
		httpjson.WriteError(w, http.StatusNotFound, "공유 링크를 찾을 수 없습니다.")
	case errors.Is(err, service.ErrForbidden):
		httpjson.WriteError(w, http.StatusForbidden, "권한이 없습니다.")
	case errors.Is(err, service.ErrInvalidTrip):
		httpjson.WriteError(w, http.StatusBadRequest, "필수 항목이 누락됐습니다.")
	default:
		httpjson.WriteError(w, http.StatusInternalServerError, "서버 오류가 발생했습니다.")
	}
}
