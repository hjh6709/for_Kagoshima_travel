package server

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/time/rate"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/auth"
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
	userRepository   repository.UserRepository
	rateLimiter      *middleware.RateLimiter
	pool             *pgxpool.Pool
}

func New() (*Server, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	production := isProduction()
	secretLower := strings.ToLower(jwtSecret)
	if production && (len(jwtSecret) < 32 || strings.Contains(secretLower, "replace") || strings.Contains(secretLower, "change-me")) {
		return nil, errors.New("production JWT_SECRET must be at least 32 characters and must not be a placeholder")
	}
	if production && os.Getenv("AUTH_TEST_BYPASS") != "" {
		return nil, errors.New("AUTH_TEST_BYPASS must not be set in production")
	}
	if jwtSecret == "" {
		jwtSecret = "dev-secret-replace-in-production"
	}
	dbURL := os.Getenv("DATABASE_URL")
	if production && strings.TrimSpace(dbURL) == "" {
		return nil, errors.New("production DATABASE_URL is required")
	}

	var tripRepository repository.TripRepository
	var userRepository repository.UserRepository
	var checklistRepository repository.ChecklistRepository
	var verificationRepository repository.VerificationRepository

	var pool *pgxpool.Pool
	if dbURL != "" {
		pool, err := db.NewPool(dbURL)
		if err != nil {
			return nil, fmt.Errorf("DB 연결 실패: %w", err)
		}
		if err := pool.Ping(context.Background()); err != nil {
			pool.Close()
			return nil, fmt.Errorf("DB ping 실패: %w", err)
		}
		if err := db.RunMigrations(context.Background(), pool); err != nil {
			pool.Close()
			return nil, fmt.Errorf("DB migration 실패: %w", err)
		}
		log.Println("PostgreSQL 연결됨")
		tripRepository = repository.NewPostgresTripRepository(pool)
		userRepository = repository.NewPostgresUserRepository(pool)
		checklistRepository = repository.NewPostgresChecklistRepository(pool)
		verificationRepository = repository.NewPostgresVerificationRepository(pool)
	} else {
		log.Println("in-memory 리포지토리 사용 (DATABASE_URL 미설정)")
		tripRepository = repository.NewMemoryTripRepository()
		userRepository = repository.NewMemoryUserRepository()
		checklistRepository = repository.NewMemoryChecklistRepository()
		verificationRepository = repository.NewMemoryVerificationRepository()
	}

	tripService := service.NewTripService(tripRepository, checklistRepository)
	authService := service.NewAuthService(userRepository, verificationRepository, jwtSecret)
	checklistService := service.NewChecklistService(checklistRepository, tripRepository)

	s := &Server{
		mux:              http.NewServeMux(),
		tripHandler:      handler.NewTripHandler(tripService),
		authHandler:      handler.NewAuthHandler(authService, production),
		checklistHandler: handler.NewChecklistHandler(checklistService),
		userRepository:   userRepository,
		rateLimiter:      middleware.NewRateLimiter(rate.Limit(5), 20),
		pool:             pool,
	}
	s.registerRoutes(jwtSecret)
	return s, nil
}

func (s *Server) Close() {
	s.rateLimiter.Close()
	if s.pool != nil {
		s.pool.Close()
	}
}

func isProduction() bool {
	env := strings.TrimSpace(os.Getenv("APP_ENV"))
	if env == "" {
		env = strings.TrimSpace(os.Getenv("ENV"))
	}
	env = strings.ToLower(env)
	return env == "production" || env == "prod"
}

func (s *Server) Routes() http.Handler {
	return withCORS(s.rateLimiter.Limit(middleware.DiscordAlert(s.mux)))
}

func (s *Server) registerRoutes(jwtSecret string) {
	requireAuth := middleware.RequireAuth(jwtSecret, func(ctx context.Context, claims *auth.Claims) bool {
		user, err := repository.WithUserRepositoryContext(s.userRepository, ctx).FindByID(claims.UserID)
		return err == nil && user.Email == claims.Email && user.TokenVersion == claims.TokenVersion
	})

	// 공개 엔드포인트
	s.mux.HandleFunc("GET /healthz", handler.Health)
	s.mux.HandleFunc("GET /docs", handler.DocsUI)
	s.mux.HandleFunc("GET /openapi.json", handler.OpenAPISpec)
	s.mux.HandleFunc("POST /api/auth/register", s.authHandler.Register)
	s.mux.HandleFunc("POST /api/auth/login", s.authHandler.Login)
	s.mux.HandleFunc("POST /api/auth/logout", s.authHandler.Logout)
	s.mux.HandleFunc("POST /api/auth/forgot-password", s.authHandler.ForgotPassword)
	s.mux.HandleFunc("POST /api/auth/send-verification-code", s.authHandler.SendVerificationCode)
	s.mux.HandleFunc("POST /api/auth/verify-code", s.authHandler.VerifyCode)
	s.mux.HandleFunc("GET /api/share/{token}", s.tripHandler.GetSharedTrip)

	// 인증 필요 엔드포인트
	s.mux.Handle("GET /api/auth/me", requireAuth(http.HandlerFunc(s.authHandler.Me)))
	s.mux.Handle("POST /api/auth/change-password", requireAuth(http.HandlerFunc(s.authHandler.ChangePassword)))
	s.mux.Handle("DELETE /api/auth/account", requireAuth(http.HandlerFunc(s.authHandler.DeleteAccount)))
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
	s.mux.Handle("GET /api/trips/{tripID}/places/search", requireAuth(http.HandlerFunc(s.tripHandler.SearchPlaces)))
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
	configuredOrigins := os.Getenv("ALLOWED_ORIGINS")
	if configuredOrigins == "" {
		configuredOrigins = "http://localhost:5173"
	}
	allowedOrigins := make(map[string]struct{})
	for _, origin := range strings.Split(configuredOrigins, ",") {
		if origin = strings.TrimSpace(origin); origin != "" {
			allowedOrigins[origin] = struct{}{}
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if _, allowed := allowedOrigins[origin]; allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Add("Vary", "Origin")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
