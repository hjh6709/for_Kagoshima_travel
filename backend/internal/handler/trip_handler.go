package handler

import (
	"errors"
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/httpjson"
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
	status := http.StatusInternalServerError
	if errors.Is(err, service.ErrTripNotFound) {
		status = http.StatusNotFound
	}

	httpjson.Write(w, status, map[string]string{"error": err.Error()})
}
