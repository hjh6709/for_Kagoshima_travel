package handler

import (
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

func (h *TripHandler) service(r *http.Request) *service.TripService {
	return h.tripService.WithContext(r.Context())
}

func NewTripHandler(tripService *service.TripService) *TripHandler {
	return &TripHandler{tripService: tripService}
}

func (h *TripHandler) GetTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	trip, err := h.service(r).GetOwnedTrip(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, trip)
}

func (h *TripHandler) ListMyTrips(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	trips, err := h.service(r).ListMyTrips(claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, trips)
}

func (h *TripHandler) CreateTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreateTripRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	trip, err := h.service(r).CreateTrip(claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, trip)
}

func (h *TripHandler) CreateShareLink(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	link, err := h.service(r).CreateShareLink(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, link)
}

func (h *TripHandler) GetSharedTrip(w http.ResponseWriter, r *http.Request) {
	sharedTrip, err := h.service(r).GetSharedTrip(r.PathValue("token"))
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, sharedTrip)
}

func (h *TripHandler) UpdateTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.UpdateTripRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	trip, err := h.service(r).UpdateTrip(r.PathValue("tripID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, trip)
}

func (h *TripHandler) DeleteTrip(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if err := h.service(r).DeleteTrip(r.PathValue("tripID"), claims.UserID); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TripHandler) ListSchedules(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	schedules, err := h.service(r).ListSchedulesForOwner(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, schedules)
}

func (h *TripHandler) CreateSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreateScheduleRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	schedule, err := h.service(r).CreateSchedule(r.PathValue("tripID"), claims.UserID, req)
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
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	schedule, err := h.service(r).UpdateSchedule(r.PathValue("tripID"), r.PathValue("scheduleID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, schedule)
}

func (h *TripHandler) DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if err := h.service(r).DeleteSchedule(r.PathValue("tripID"), r.PathValue("scheduleID"), claims.UserID); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TripHandler) ListPlaces(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	places, err := h.service(r).ListPlacesForOwner(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, places)
}

func (h *TripHandler) CreatePlace(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreatePlaceRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	place, err := h.service(r).CreatePlace(r.PathValue("tripID"), claims.UserID, req)
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
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	place, err := h.service(r).UpdatePlace(r.PathValue("tripID"), r.PathValue("placeID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, place)
}

func (h *TripHandler) DeletePlace(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	if err := h.service(r).DeletePlace(r.PathValue("tripID"), r.PathValue("placeID"), claims.UserID); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TripHandler) ListFlights(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	flights, err := h.service(r).ListFlightsForOwner(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, flights)
}

func (h *TripHandler) CreateFlight(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.CreateFlightRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	flight, err := h.service(r).CreateFlight(r.PathValue("tripID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusCreated, flight)
}

// UpdateFlight는 여행 소유자가 선택한 항공편 일부 필드를 수정할 때 사용한다.
func (h *TripHandler) UpdateFlight(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	var req dto.UpdateFlightRequest
	if !httpjson.DecodeRequest(w, r, &req) {
		return
	}
	flight, err := h.service(r).UpdateFlight(r.PathValue("tripID"), r.PathValue("flightID"), claims.UserID, req)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, flight)
}

func (h *TripHandler) DeleteFlight(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	// DeleteFlight는 여행 상세 화면에서 사용자가 직접 항공편을 제거할 때 호출된다.
	if err := h.service(r).DeleteFlight(r.PathValue("tripID"), r.PathValue("flightID"), claims.UserID); err != nil {
		writeServiceError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *TripHandler) ListRoutes(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	routes, err := h.service(r).ListRoutesForOwner(r.PathValue("tripID"), claims.UserID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, routes)
}

func (h *TripHandler) SearchPlaces(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetClaims(r)
	tripID := r.PathValue("tripID")
	query := r.URL.Query().Get("q")

	results, err := h.service(r).SearchPlaces(tripID, claims.UserID, query)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	httpjson.Write(w, http.StatusOK, results)
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
	case errors.Is(err, service.ErrTripDateConflict):
		httpjson.WriteError(w, http.StatusConflict, "여행 기간 밖에 일정이나 날짜별 준비물이 있어 날짜를 변경할 수 없습니다.")
	case errors.Is(err, service.ErrInvalidChecklist):
		httpjson.WriteError(w, http.StatusBadRequest, "준비물 이름과 구분을 확인해 주세요.")
	case errors.Is(err, service.ErrPlaceSearchUnavailable):
		httpjson.WriteError(w, http.StatusServiceUnavailable, "지도 검색을 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.")
	case errors.Is(err, service.ErrPlaceSearchQuotaExceeded):
		httpjson.WriteError(w, http.StatusTooManyRequests, "이번 달 지도 검색 제공량을 모두 사용했습니다. 저장된 장소나 직접 입력을 이용해 주세요.")
	default:
		httpjson.WriteError(w, http.StatusInternalServerError, "서버 오류가 발생했습니다.")
	}
}
