package server

import (
	"net/http"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/handler"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/repository"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/service"
)

type Server struct {
	mux         *http.ServeMux
	tripHandler *handler.TripHandler
}

func New() *Server {
	tripRepository := repository.NewMemoryTripRepository()
	tripService := service.NewTripService(tripRepository)

	s := &Server{
		mux:         http.NewServeMux(),
		tripHandler: handler.NewTripHandler(tripService),
	}
	s.registerRoutes()
	return s
}

func (s *Server) Routes() http.Handler {
	return withCORS(s.mux)
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("GET /healthz", handler.Health)
	s.mux.HandleFunc("GET /api/trips/{tripID}", s.tripHandler.GetTrip)
	s.mux.HandleFunc("GET /api/trips/{tripID}/schedules", s.tripHandler.ListSchedules)
	s.mux.HandleFunc("GET /api/trips/{tripID}/places", s.tripHandler.ListPlaces)
	s.mux.HandleFunc("GET /api/trips/{tripID}/routes", s.tripHandler.ListRoutes)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
