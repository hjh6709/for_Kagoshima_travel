package server

import (
	"context"
	"log"
	"net/http"
	"os"

	"golang.org/x/time/rate"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/db"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/handler"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

type Server struct {
	mux              *http.ServeMux
	tripHandler      *handler.TripHandler
	authHandler      *handler.AuthHandler
	checklistHandler *handler.ChecklistHandler
	rateLimiter      *middleware.RateLimiter
}

func New() *Server {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "dev-secret-replace-in-production"
	}

	var tripRepository repository.TripRepository
	var userRepository repository.UserRepository
	var checklistRepository repository.ChecklistRepository

	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		pool, err := db.NewPool(dbURL)
		if err != nil {
			log.Fatalf("DB 연결 실패: %v", err)
		}
		if err := pool.Ping(context.Background()); err != nil {
			log.Fatalf("DB ping 실패: %v", err)
		}
		log.Println("PostgreSQL 연결됨")
		tripRepository = repository.NewPostgresTripRepository(pool)
		userRepository = repository.NewPostgresUserRepository(pool)
		checklistRepository = repository.NewPostgresChecklistRepository(pool)
	} else {
		log.Println("in-memory 리포지토리 사용 (DATABASE_URL 미설정)")
		tripRepository = repository.NewMemoryTripRepository()
		userRepository = repository.NewMemoryUserRepository()
		checklistRepository = repository.NewMemoryChecklistRepository()
	}

	tripService := service.NewTripService(tripRepository, checklistRepository)
	authService := service.NewAuthService(userRepository, jwtSecret)
	checklistService := service.NewChecklistService(checklistRepository, tripRepository)

	s := &Server{
		mux:              http.NewServeMux(),
		tripHandler:      handler.NewTripHandler(tripService),
		authHandler:      handler.NewAuthHandler(authService),
		checklistHandler: handler.NewChecklistHandler(checklistService),
		rateLimiter:      middleware.NewRateLimiter(rate.Limit(5), 20),
	}
	s.registerRoutes(jwtSecret)
	return s
}

func (s *Server) Routes() http.Handler {
	return withCORS(s.rateLimiter.Limit(middleware.DiscordAlert(s.mux)))
}

func (s *Server) registerRoutes(jwtSecret string) {
	requireAuth := middleware.RequireAuth(jwtSecret)

	// 공개 엔드포인트
	s.mux.HandleFunc("GET /healthz", handler.Health)
	s.mux.HandleFunc("GET /docs", handler.DocsUI)
	s.mux.HandleFunc("GET /openapi.json", handler.OpenAPISpec)
	s.mux.HandleFunc("POST /api/auth/register", s.authHandler.Register)
	s.mux.HandleFunc("POST /api/auth/login", s.authHandler.Login)
	s.mux.HandleFunc("POST /api/auth/forgot-password", s.authHandler.ForgotPassword)
	s.mux.HandleFunc("GET /api/share/{token}", s.tripHandler.GetSharedTrip)

	// 인증 필요 엔드포인트
	s.mux.Handle("GET /api/auth/me", requireAuth(http.HandlerFunc(s.authHandler.Me)))
	s.mux.Handle("POST /api/auth/change-password", requireAuth(http.HandlerFunc(s.authHandler.ChangePassword)))
	s.mux.Handle("GET /api/trips", requireAuth(http.HandlerFunc(s.tripHandler.ListMyTrips)))
	s.mux.Handle("POST /api/trips", requireAuth(http.HandlerFunc(s.tripHandler.CreateTrip)))
	s.mux.Handle("GET /api/trips/{tripID}", requireAuth(http.HandlerFunc(s.tripHandler.GetTrip)))
	s.mux.Handle("PATCH /api/trips/{tripID}", requireAuth(http.HandlerFunc(s.tripHandler.UpdateTrip)))
	s.mux.Handle("DELETE /api/trips/{tripID}", requireAuth(http.HandlerFunc(s.tripHandler.DeleteTrip)))
	s.mux.Handle("POST /api/trips/{tripID}/share", requireAuth(http.HandlerFunc(s.tripHandler.CreateShareLink)))
	s.mux.Handle("GET /api/trips/{tripID}/schedules", requireAuth(http.HandlerFunc(s.tripHandler.ListSchedules)))
	s.mux.Handle("POST /api/trips/{tripID}/schedules", requireAuth(http.HandlerFunc(s.tripHandler.CreateSchedule)))
	s.mux.Handle("PATCH /api/trips/{tripID}/schedules/{scheduleID}", requireAuth(http.HandlerFunc(s.tripHandler.UpdateSchedule)))
	s.mux.Handle("DELETE /api/trips/{tripID}/schedules/{scheduleID}", requireAuth(http.HandlerFunc(s.tripHandler.DeleteSchedule)))
	s.mux.Handle("GET /api/trips/{tripID}/places", requireAuth(http.HandlerFunc(s.tripHandler.ListPlaces)))
	s.mux.Handle("POST /api/trips/{tripID}/places", requireAuth(http.HandlerFunc(s.tripHandler.CreatePlace)))
	s.mux.Handle("PATCH /api/trips/{tripID}/places/{placeID}", requireAuth(http.HandlerFunc(s.tripHandler.UpdatePlace)))
	s.mux.Handle("DELETE /api/trips/{tripID}/places/{placeID}", requireAuth(http.HandlerFunc(s.tripHandler.DeletePlace)))
	s.mux.Handle("GET /api/trips/{tripID}/flights", requireAuth(http.HandlerFunc(s.tripHandler.ListFlights)))
	s.mux.Handle("POST /api/trips/{tripID}/flights", requireAuth(http.HandlerFunc(s.tripHandler.CreateFlight)))
	s.mux.Handle("PATCH /api/trips/{tripID}/flights/{flightID}", requireAuth(http.HandlerFunc(s.tripHandler.UpdateFlight)))
	s.mux.Handle("DELETE /api/trips/{tripID}/flights/{flightID}", requireAuth(http.HandlerFunc(s.tripHandler.DeleteFlight)))
	s.mux.Handle("GET /api/trips/{tripID}/routes", requireAuth(http.HandlerFunc(s.tripHandler.ListRoutes)))

	// 체크리스트 관련 엔드포인트
	s.mux.Handle("GET /api/trips/{tripID}/checklists", requireAuth(http.HandlerFunc(s.checklistHandler.ListChecklist)))
	s.mux.Handle("POST /api/trips/{tripID}/checklists", requireAuth(http.HandlerFunc(s.checklistHandler.CreateChecklistCustomItem)))
	s.mux.Handle("PATCH /api/trips/checklists/{checklistID}", requireAuth(http.HandlerFunc(s.checklistHandler.UpdateChecklistItem)))
	s.mux.Handle("DELETE /api/trips/checklists/{checklistID}", requireAuth(http.HandlerFunc(s.checklistHandler.DeleteChecklistItem)))
}

func withCORS(next http.Handler) http.Handler {
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173"
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigins)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
