package server

import (
	"net/http"
	"os"

	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/handler"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/repository"
	"github.com/hanjeonghyun/for-kagoshima-travel/backend/internal/service"
)

type Server struct {
	mux         *http.ServeMux
	tripHandler *handler.TripHandler
	authHandler *handler.AuthHandler
}

func New() *Server {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-secret-replace-in-production"
	}

	tripRepository := repository.NewMemoryTripRepository()
	tripService := service.NewTripService(tripRepository)

	userRepository := repository.NewMemoryUserRepository()
	authService := service.NewAuthService(userRepository, jwtSecret)

	s := &Server{
		mux:         http.NewServeMux(),
		tripHandler: handler.NewTripHandler(tripService),
		authHandler: handler.NewAuthHandler(authService),
	}
	s.registerRoutes(jwtSecret)
	return s
}

func (s *Server) Routes() http.Handler {
	return withCORS(s.mux)
}

func (s *Server) registerRoutes(jwtSecret string) {
	requireAuth := middleware.RequireAuth(jwtSecret)

	// 공개 엔드포인트
	s.mux.HandleFunc("GET /healthz", handler.Health)
	s.mux.HandleFunc("POST /api/auth/register", s.authHandler.Register)
	s.mux.HandleFunc("POST /api/auth/login", s.authHandler.Login)

	// 인증 필요 엔드포인트
	s.mux.Handle("GET /api/trips/{tripID}", requireAuth(http.HandlerFunc(s.tripHandler.GetTrip)))
	s.mux.Handle("GET /api/trips/{tripID}/schedules", requireAuth(http.HandlerFunc(s.tripHandler.ListSchedules)))
	s.mux.Handle("GET /api/trips/{tripID}/places", requireAuth(http.HandlerFunc(s.tripHandler.ListPlaces)))
	s.mux.Handle("GET /api/trips/{tripID}/routes", requireAuth(http.HandlerFunc(s.tripHandler.ListRoutes)))
}

func withCORS(next http.Handler) http.Handler {
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173"
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigins)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
