package handler

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/service"
)

type failingUserRepository struct {
	saveError error
}

func (r failingUserRepository) FindByEmail(string) (model.User, error) {
	return model.User{}, repository.ErrNotFound
}

func (r failingUserRepository) FindByID(string) (model.User, error) {
	return model.User{}, repository.ErrNotFound
}

func (r failingUserRepository) Save(model.User) error {
	return r.saveError
}

func (r failingUserRepository) UpdatePassword(string, string) (model.User, error) {
	return model.User{}, nil
}

func (r failingUserRepository) DeleteAccount(string) error {
	return nil
}

func (r failingUserRepository) RecordFailedLogin(string, time.Time, int, time.Duration) (model.User, error) {
	return model.User{}, repository.ErrNotFound
}

func (r failingUserRepository) ResetFailedLogins(string) error {
	return nil
}

func TestRegisterDoesNotExposeInternalRepositoryError(t *testing.T) {
	t.Setenv("AUTH_TEST_BYPASS", "1")
	internalError := errors.New("database host secret.internal failed")
	authService := service.NewAuthService(
		failingUserRepository{saveError: internalError},
		repository.NewMemoryVerificationRepository(),
		"test-jwt-secret",
	)
	handler := NewAuthHandler(authService, false)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/register",
		strings.NewReader(`{"email":"traveler@example.com","password":"Strong1!Password","code":"123456"}`),
	)
	response := httptest.NewRecorder()

	handler.Register(response, request)

	if response.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusInternalServerError)
	}
	if strings.Contains(response.Body.String(), internalError.Error()) {
		t.Fatalf("response exposed internal error: %s", response.Body.String())
	}
	if got := response.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("auth cache control = %q, want no-store", got)
	}
}

func TestSendVerificationCodeMapsDeliveryFailureToSafeGatewayError(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	authService := service.NewAuthService(
		repository.NewMemoryUserRepository(),
		repository.NewMemoryVerificationRepository(),
		"test-jwt-secret",
	)
	handler := NewAuthHandler(authService, false)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/send-verification-code",
		strings.NewReader(`{"email":"traveler@example.com","purpose":"register"}`),
	)
	response := httptest.NewRecorder()

	handler.SendVerificationCode(response, request)

	if response.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusBadGateway)
	}
	if !strings.Contains(response.Body.String(), "잠시 후 다시 시도") {
		t.Fatalf("response = %s, want retry guidance", response.Body.String())
	}
}

func TestVerifyCodeKeepsCompatibilityWithCachedRegisterClient(t *testing.T) {
	t.Setenv("APP_ENV", "development")
	authService := service.NewAuthService(
		repository.NewMemoryUserRepository(),
		repository.NewMemoryVerificationRepository(),
		"test-jwt-secret",
	)
	code, err := authService.SendVerificationCode("cached@example.com", "register")
	if err != nil {
		t.Fatalf("SendVerificationCode: %v", err)
	}
	handler := NewAuthHandler(authService, false)
	request := httptest.NewRequest(
		http.MethodPost,
		"/api/auth/verify-code",
		strings.NewReader(`{"email":"cached@example.com","code":"`+code+`"}`),
	)
	response := httptest.NewRecorder()

	handler.VerifyCode(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body=%s", response.Code, http.StatusOK, response.Body.String())
	}
}

func TestProductionSessionCookieUsesBrowserSecurityAttributes(t *testing.T) {
	handler := NewAuthHandler(nil, true)
	response := httptest.NewRecorder()

	handler.setSessionCookie(response, "signed-session-token")

	cookies := response.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatalf("cookie count = %d, want 1", len(cookies))
	}
	cookie := cookies[0]
	if !cookie.HttpOnly || !cookie.Secure || cookie.SameSite != http.SameSiteLaxMode || cookie.Path != "/" {
		t.Fatalf("session cookie is missing security attributes: %#v", cookie)
	}
}
