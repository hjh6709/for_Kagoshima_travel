package server

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/time/rate"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/auth"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/db"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/handler"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/middleware"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/observability"
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
	logger           *slog.Logger
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
	if production {
		if err := validateProductionOrigins(os.Getenv("ALLOWED_ORIGINS")); err != nil {
			return nil, err
		}
	}
	if jwtSecret == "" {
		jwtSecret = "dev-secret-replace-in-production"
	}
	logger := observability.NewLogger(os.Stdout)
	slog.SetDefault(logger)

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
		logger.Info("storage ready", slog.String("backend", "postgres"))
		tripRepository = repository.NewPostgresTripRepository(pool)
		userRepository = repository.NewPostgresUserRepository(pool)
		checklistRepository = repository.NewPostgresChecklistRepository(pool)
		verificationRepository = repository.NewPostgresVerificationRepository(pool)
	} else {
		logger.Warn("storage ready", slog.String("backend", "in-memory"),
			slog.String("reason", "DATABASE_URL is not set"))
		tripRepository = repository.NewMemoryTripRepository()
		userRepository = repository.NewMemoryUserRepository()
		checklistRepository = repository.NewMemoryChecklistRepository()
		verificationRepository = repository.NewMemoryVerificationRepository()
	}

	tripService := service.NewTripService(tripRepository, checklistRepository)
	authService := service.NewAuthService(userRepository, verificationRepository, jwtSecret)
	checklistService := service.NewChecklistService(checklistRepository, tripRepository)

	s := &Server{
		logger:           logger,
		mux:              http.NewServeMux(),
		tripHandler:      handler.NewTripHandler(tripService),
		authHandler:      handler.NewAuthHandler(authService, production),
		checklistHandler: handler.NewChecklistHandler(checklistService),
		userRepository:   userRepository,
		rateLimiter:      middleware.NewRateLimiter(rateLimitPerSecond(), rateLimitBurst()),
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

// 레이트 리밋 기본값은 초당 5회, 버스트 20이다. 한 사용자가 화면 하나를 열 때
// 나가는 요청 수를 감당하면서 자동화된 대량 요청은 막는 값이다.
//
// E2E처럼 여러 브라우저가 같은 IP에서 동시에 도는 환경에서는 이 값이 너무 낮아
// 429가 섞인다. 기본값은 그대로 두고 환경변수로만 올릴 수 있게 한다.
func rateLimitPerSecond() rate.Limit {
	if parsed, ok := positiveFloatEnv("RATE_LIMIT_PER_SECOND"); ok {
		return rate.Limit(parsed)
	}
	return rate.Limit(5)
}

func rateLimitBurst() int {
	if parsed, ok := positiveFloatEnv("RATE_LIMIT_BURST"); ok {
		return int(parsed)
	}
	return 20
}

func positiveFloatEnv(name string) (float64, bool) {
	raw := strings.TrimSpace(os.Getenv(name))
	if raw == "" {
		return 0, false
	}
	parsed, err := strconv.ParseFloat(raw, 64)
	if err != nil || parsed <= 0 {
		return 0, false
	}
	return parsed, true
}

func validateProductionOrigins(configuredOrigins string) error {
	if strings.TrimSpace(configuredOrigins) == "" {
		return errors.New("production ALLOWED_ORIGINS is required")
	}
	for _, origin := range strings.Split(configuredOrigins, ",") {
		origin = strings.TrimSpace(origin)
		parsed, err := url.Parse(origin)
		if err != nil || parsed.Scheme != "https" || parsed.Host == "" || parsed.User != nil || parsed.Path != "" || parsed.RawQuery != "" || parsed.Fragment != "" {
			return fmt.Errorf("production ALLOWED_ORIGINS contains invalid HTTPS origin %q", origin)
		}
	}
	return nil
}

// Routes는 미들웨어를 바깥에서 안쪽 순서로 감싼다.
//
//	CORS            — 프리플라이트를 가장 먼저 처리해야 한다
//	RequestContext  — 그다음. 이후 모든 계층이 request ID를 쓴다
//	RequestLog      — 레이트 리밋 거부(429)까지 기록하려면 그 바깥이어야 한다
//	rateLimiter     — 실제 차단
//	DiscordAlert    — 패닉 복구는 핸들러에 가장 가깝게
func (s *Server) Routes() http.Handler {
	return withCORS(
		middleware.RequestContext(s.logger)(
			middleware.RequestLog(
				s.rateLimiter.Limit(middleware.DiscordAlert(s.mux)),
			),
		),
	)
}

func (s *Server) registerRoutes(jwtSecret string) {
	requireAuth := middleware.RequireAuth(jwtSecret, func(ctx context.Context, claims *auth.Claims) bool {
		user, err := repository.WithUserRepositoryContext(s.userRepository, ctx).FindByID(claims.UserID)
		return err == nil && user.Email == claims.Email && user.TokenVersion == claims.TokenVersion
	})
	var readinessChecker handler.ReadinessChecker
	if s.pool != nil {
		readinessChecker = s.pool
	}

	// 공개 엔드포인트
	s.mux.HandleFunc("GET /healthz", handler.Health)
	s.mux.Handle("GET /readyz", handler.Readiness(readinessChecker))
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
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		_, allowed := allowedOrigins[origin]
		trustedOrigin := allowed || isSameHostOrigin(origin, r.Host)
		if allowed {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Add("Vary", "Origin")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			if origin != "" && !trustedOrigin {
				http.Error(w, "origin is not allowed", http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// 브라우저 mutation은 로그인처럼 아직 쿠키가 없는 요청도 포함해 Origin을
		// 검증한다. Origin이 없는 앱/CLI는 계속 허용하지만, 쿠키 인증을 쓰는 요청은
		// 반드시 신뢰할 수 있는 브라우저 Origin 또는 명시적인 Bearer가 필요하다.
		if isUnsafeMethod(r.Method) {
			untrustedBrowser := origin != "" && !trustedOrigin
			originlessCookie := origin == "" && hasSessionCookie(r) && !hasBearerAuthorization(r)
			if untrustedBrowser || originlessCookie {
				http.Error(w, "origin is not allowed", http.StatusForbidden)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}

func isUnsafeMethod(method string) bool {
	switch method {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}

func hasSessionCookie(r *http.Request) bool {
	cookie, err := r.Cookie(middleware.SessionCookieName)
	return err == nil && strings.TrimSpace(cookie.Value) != ""
}

func hasBearerAuthorization(r *http.Request) bool {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	parts := strings.Fields(authorization)
	return len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") && parts[1] != ""
}

func isSameHostOrigin(origin, requestHost string) bool {
	if origin == "" || requestHost == "" {
		return false
	}
	parsed, err := url.Parse(origin)
	return err == nil && parsed.Scheme != "" && strings.EqualFold(parsed.Host, requestHost)
}
